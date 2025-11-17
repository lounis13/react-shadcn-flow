from __future__ import annotations

import asyncio
import dataclasses
import uuid

from domain.job_repository import JobRepository
from domain.services.engine.reactive.async_map import ConcurrentAsyncMap
from domain.services.engine.reactive.event import Event, EventType
from domain.services.engine.reactive.graph_builder import build_reactive_graph
from domain.services.engine.reactive.reactive_job import ReactiveJob

active_engines: ConcurrentAsyncMap[uuid.UUID, "ReactiveEngine"] = ConcurrentAsyncMap()


@dataclasses.dataclass
class ReactiveEngine:
    repository: JobRepository
    job_id: uuid.UUID
    lock: asyncio.Lock = dataclasses.field(default_factory=asyncio.Lock, init=False)
    done: asyncio.Event = dataclasses.field(default_factory=asyncio.Event, init=False)

    def on_next(self, event: Event):
        print(f"Received {event.type} for {event.task}")
        if event.task.is_finished and event.type == EventType.RUN:
            self.done.set()
            print(f"Job {event.task} Completed")

    async def _safe_commit(self) -> None:
        await self.repository.flush()
        await self.repository.commit()

    async def run(self) -> None:

        job = await self.repository.get(self.job_id)
        nodes = build_reactive_graph(job)
        for node in nodes.values():
            node.on_change = self._safe_commit
            node.lock = self.lock

        reactive_job = nodes.get(job)

        if not isinstance(reactive_job, ReactiveJob):
            raise ValueError("Task must be a Job")

        def on_error(e):
            print("Job Error", e)
            self.done.set()

        subscription = reactive_job.observable.subscribe(
            on_next=self.on_next,
            on_error=on_error
        )
        try:
            await reactive_job.start()
            await self.done.wait()
            await active_engines.delete(self.job_id)
        finally:
            subscription.dispose()

    async def retry(self, task_id: uuid.UUID) -> None:
        job = await self.repository.get(self.job_id)
        task = await self.repository.get_task(task_id)
        nodes = build_reactive_graph(job)
        for node in nodes.values():
            node.on_change = self._safe_commit
            node.lock = self.lock

        reactive_job = nodes.get(job)
        reactive_task = nodes.get(task)

        if not isinstance(reactive_job, ReactiveJob):
            raise ValueError("Task must be a Job")

        def on_error(e):
            print("Job Error", e)
            self.done.set()

        subscription = reactive_job.observable.subscribe(
            on_next=self.on_next,
            on_error=on_error
        )
        try:
            await reactive_task.retry()
            await self.done.wait()
            await active_engines.delete(self.job_id)
        finally:
            subscription.dispose()


async def get_engine(repository: JobRepository, job_id: uuid.UUID) -> ReactiveEngine:
    return await active_engines.get_or_set(job_id, lambda: ReactiveEngine(repository, job_id))
