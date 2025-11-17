from __future__ import annotations

import asyncio
from dataclasses import dataclass, field

from reactivex import Observable, combine_latest, operators, from_future, of

from domain.models.enums.status import Status
from domain.services.engine.reactive.event import Event, EventType
from domain.services.engine.reactive.reactive_task import ReactiveTask
from shared.utils import flatten_tuple_to_list


@dataclass
class ReactiveJob(ReactiveTask):
    children: list[ReactiveTask] = field(default_factory=list)

    async def _start_sub_job(self, *events: Event):
        print(f"Starting {self.task.name} with {events}")
        try:
            if self.is_retry(*events):
                await self.set_status(Status.READY_TO_RETRY)
                return await self._start(event_type=EventType.RETRY)

            if self.is_setup(*events) or not self.task.is_runnable:
                return await self._start(event_type=EventType.SETUP)
            else:
                await self.refresh_input()
                return await self._start(event_type=EventType.RUN)
        except Exception as e:
            await self.set_status(Status.FAILED, str(e))
            await self.finish()
            return Event(task=self.task, type=EventType.FAILED)

    async def handler(self, *events: Event):
        print(f"JOB Handling {self.task.name} events: {events}")
        try:
            statuses = [event.task.status for event in events]
            final_status = Status.compute(statuses)
            if final_status.is_final() and self.task.status != final_status:
                await self.finish()
            await self.set_status(final_status)
            if self.is_retry(*events):
                return Event(task=self.task, type=EventType.RETRY)
            if self.is_setup(*events):
                return Event(task=self.task, type=EventType.SETUP)
            return Event(task=self.task, type=EventType.RUN)
        except Exception as e:
            await self.set_status(Status.FAILED, str(e))
            await self.finish()
            return Event(task=self.task, type=EventType.FAILED)

    def _get_observable(self) -> Observable:
        children = [children.observable for children in self.children]
        trigger: Observable = of("root")

        if self.is_root and self.parent:
            trigger = self.parent.subject.pipe(
                operators.flat_map(lambda x: from_future(asyncio.ensure_future(self._start_sub_job(x)))),
            )

        if not self.is_root:
            upstream = [up.observable for up in self.upstream]
            trigger = combine_latest(*upstream) if len(upstream) > 1 else upstream[0]
            trigger = trigger.pipe(
                operators.map(flatten_tuple_to_list),
                operators.flat_map(lambda x: from_future(asyncio.ensure_future(self._start_sub_job(*x)))),
                operators.share()
            )
        return combine_latest(trigger, *children).pipe(
            operators.map(lambda x: x[1:]),
            operators.map(flatten_tuple_to_list),
            operators.flat_map(lambda x: from_future(asyncio.ensure_future(self.handler(*x)))),
        )

    async def _start(self, event_type: EventType = EventType.SETUP):
        print(f"Starting {self.task.name} with {event_type} event")
        if event_type == EventType.SETUP:
            return self.subject.on_next(Event(task=self.task, type=event_type))
        if event_type == EventType.RETRY:
            return self.subject.on_next(Event(task=self.task, type=event_type))
        await self.start_now()
        await self.locked_update(self.task.start)
        return self.subject.on_next(Event(task=self.task, type=event_type))


    async def start(self) -> None:
        print("starting job ", self.task)
        await self._start(EventType.RUN)
