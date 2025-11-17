from __future__ import annotations

import asyncio
import dataclasses
from dataclasses import dataclass, field
from typing import Callable, Awaitable, Optional

from reactivex import Observable, combine_latest, operators, from_future, Subject
from reactivex.subject import BehaviorSubject

from domain.models.enums.input_strategy import prepare_task_input
from domain.models.enums.status import Status
from domain.models.task import Task
from shared.utils import flatten_tuple_to_list
from .event import Event, EventType


@dataclass
class ReactiveTask:
    task: Task

    subject: BehaviorSubject[Event] = field(init=False)

    parent: ReactiveTask | None = None
    upstream: list[ReactiveTask] = field(default_factory=list)

    complete: Subject = Subject()
    _observable: Observable | None = None

    on_change: Callable[[], Awaitable[None]] | None = None

    lock: asyncio.Lock = dataclasses.field(default_factory=asyncio.Lock, init=False)

    def __post_init__(self):
        self.subject = BehaviorSubject(Event(task=self.task, type=EventType.NONE))

    @property
    def observable(self) -> Observable:
        if not self._observable:
            self._observable = self._get_observable()
        return self._observable

    def is_setup(self, *events: Event):
        return all(_event.type == EventType.SETUP or _event.type == EventType.NONE for _event in events)

    def is_retry(self, *events: Event):
        return any(_event.type == EventType.RETRY for _event in events)

    async def handler(self, *events: Event):
        print(f"Handling {self.task.name} events: {events}")
        try:
            if self.is_setup(*events):
                return Event(task=self.task, type=EventType.SETUP)
            if self.is_retry(*events) and self.subject.value.type != EventType.RUN:
                await self.set_status(Status.READY_TO_RETRY)
                return Event(task=self.task, type=EventType.RETRY)

            if self.task.is_runnable:
                await self.refresh_input()
                await self.set_status(Status.RUNNING)
                await self.start_now()
                output = await self.task.action()
                await self.set_output(output)
                await self.set_status(Status.SUCCESS)
                await self.finish()
            return Event(task=self.task, type=EventType.RUN)
        except Exception as e:
            await self.set_status(Status.FAILED, str(e))
            await self.finish()
            return Event(task=self.task, type=EventType.FAILED)

    def _get_observable(self) -> Observable:
        if self.is_root:
            return combine_latest(self.subject, self.parent.subject).pipe(
                operators.map(flatten_tuple_to_list),
                operators.flat_map(lambda x: from_future(asyncio.ensure_future(self.handler(*x)))),
                operators.share()
            )

        else:
            obs = [up.observable for up in self.upstream]
            return combine_latest(self.subject, *obs).pipe(
                operators.map(flatten_tuple_to_list),
                operators.flat_map(lambda x: from_future(asyncio.ensure_future(self.handler(*x)))),
                operators.share()
            )

    @property
    def is_root(self) -> bool:
        return not self.upstream

    async def set_status(self, status: Status, error: Optional[str] = None) -> None:
        async with self.lock:
            if self.task.status != status:
                self.task.status = status
                print(f"Setting status of {self.task.name} to {status}")
                await self.apply_changes()
                if error:
                    self.task.error = error
                await self.apply_changes()

    async def refresh_input(self):
        async with self.lock:
            await prepare_task_input(self.task)
            await self.apply_changes()

    async def set_output(self, output) -> None:
        async with self.lock:
            self.task.output = output

    async def locked_update(self, func: Callable) -> None:
        async with self.lock:
            func()
            await self.apply_changes()

    async def finish(self):
        await self.locked_update(self.task.finish)

    async def start_now(self):
        await self.locked_update(self.task.start)

    async def apply_changes(self) -> None:
        if self.on_change:
            await self.on_change()

    async def retry(self) -> None:
        await asyncio.sleep(10)
        print(f"retrying {self.task.name}")
        await self.set_status(Status.READY_TO_RETRY)
        self.subject.on_next(Event(task=self.task, type=EventType.RETRY))
        await asyncio.sleep(10)
        print(f"retrying {self.task.name}")
        self.subject.on_next(Event(task=self.task, type=EventType.RUN))
