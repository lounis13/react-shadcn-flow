from __future__ import annotations

import uuid
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

import database.database
from domain.models.job import Job
from domain.models.task import Task


@dataclass
class JobRepository:
    session: AsyncSession

    async def get_all(self, load_graph: bool = True) -> list[Job]:
        stmt = select(Job)
        if load_graph:
            stmt = stmt.options(
                selectinload(Job.children).selectinload(Task.upstream_links),
                selectinload(Job.children).selectinload(Task.downstream_links),
                selectinload(Job.dependencies),
            )

        result = await self.session.execute(stmt)
        return list(result.scalars().unique().all())

    async def get(self, job_id: uuid.UUID, load_graph: bool = False) -> Job:
        stmt = select(Job).where(Job.id == job_id)
        if load_graph:
            stmt = stmt.options(
                selectinload(Job.children).selectinload(Task.upstream_links),
                selectinload(Job.children).selectinload(Task.downstream_links),
                selectinload(Job.dependencies),
            )

        result = await self.session.execute(stmt)
        return result.scalar_one()

    async def get_task(self, task_id: uuid.UUID) -> Task:
        stmt = select(Task).where(Task.id == task_id)
        result = await self.session.execute(stmt)
        return result.scalar_one()

    async def add(self, job: Job) -> None:
        self.session.add(job)

    async def flush(self) -> None:
        await self.session.flush()

    async def commit(self) -> None:
        await self.session.commit()

    async def refresh(self, job: Job) -> None:
        await self.session.refresh(job)


async def get_job_repository() -> JobRepository:
    async with database.database.get_session_manager() as session:
        return JobRepository(session)
