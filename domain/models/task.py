from __future__ import annotations

import uuid
from typing import Optional, TYPE_CHECKING, Generic

from sqlalchemy import Enum as SAEnum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship, declared_attr

from domain.models.enums.status import Status
from domain.models.enums.task_type import TaskType
from domain.models.mixins.base import Base
from domain.models.mixins.io import IO, OutputT, InputT
from domain.models.mixins.lifecycle import Lifecycle
from domain.models.mixins.timestamp import Timestamp
from domain.models.task_dependency import Dependency

if TYPE_CHECKING:
    from domain.models.job import Job


class Task(Base, IO[InputT, OutputT], Dependency, Generic[InputT, OutputT], Lifecycle, Timestamp):
    """
    Base task: atomic task or job (polymorphic single-table inheritance).
    Handles dependencies (upstream/downstream) but no hierarchical children.
    """

    __tablename__ = "tasks"

    task_type: Mapped[TaskType] = mapped_column(
        SAEnum(TaskType),
        default=TaskType.TASK,
        nullable=False,
    )

    kind: Mapped[str] = mapped_column(String(50), nullable=False, index=True)

    name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    status: Mapped[Status] = mapped_column(
        SAEnum(Status),
        default=Status.SCHEDULED,
        nullable=False,
    )

    error: Mapped[Optional[str]] = mapped_column(nullable=True)

    # Parent job (if any). Only Jobs can be parents, but stored in same table (STI).
    parent_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("tasks.id"),
        nullable=True,
        index=True,
    )

    parent: Mapped[Optional["Job"]] = relationship(
        "Task",
        back_populates="children",
        remote_side="Task.id",
        lazy="selectin",
    )

    children: Mapped[list[Task]] = relationship(
        "Task",
        back_populates="parent",
        cascade="all, delete-orphan",
        lazy="selectin",
        join_depth=5
    )

    @property
    def is_finished(self) -> bool:
        return self.status.is_final()

    @property
    def is_runnable(self) -> bool:
        """Runnable if not finished and all upstream tasks succeeded."""
        if self.is_finished or self.status == Status.RUNNING:
            return False
        if not self.upstream:
            return True
        return all(t.status == Status.SUCCESS for t in self.upstream)

    @declared_attr
    def __mapper_args__(self):
        return {"polymorphic_on": self.kind, "polymorphic_identity": f"{self.__module__}.{self.__name__}"}

    async def action(self) -> OutputT | Optional[OutputT]:
        print(f"action executed {self.id=} {self.name=} {self.kind=} {self.status=}")

    def __repr__(self):
        return f"<{self.name} | {self.status}>"