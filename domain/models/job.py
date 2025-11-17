from __future__ import annotations

from typing import Generic

from sqlalchemy.orm import Mapped, relationship

from domain.models.enums.task_type import TaskType
from domain.models.mixins.io import InputT, OutputT
from domain.models.task import Task
from domain.models.task_dependency import TaskDependency


class Job(Generic[InputT, OutputT], Task[InputT, OutputT]):

    def __init__(self, **kwargs):
        kwargs.setdefault("task_type", TaskType.JOB)
        super().__init__(**kwargs)

    dependencies: Mapped[list[TaskDependency]] = relationship(
        "TaskDependency",
        back_populates="job",
        cascade="all, delete-orphan",
        foreign_keys=[TaskDependency.job_id],
        lazy="selectin",
    )

    @property
    def output(self):
        return [child.output for child in self.children]
