from __future__ import annotations

import uuid
from typing import TYPE_CHECKING, Callable, Any

from sqlalchemy import ForeignKey, String, JSON
from sqlalchemy.ext.associationproxy import association_proxy, AssociationProxy
from sqlalchemy.orm import Mapped, mapped_column, relationship, declared_attr

from domain.models.enums.status import Status
from domain.models.mixins.base import Base
from domain.models.mixins.timestamp import Timestamp
from domain.models.enums.input_strategy import MergeStrategy

if TYPE_CHECKING:
    from domain.models.task import Task
    from domain.models.job import Job


class TaskDependency(Timestamp, Base):
    __tablename__ = "task_dependencies"

    task_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tasks.id"),
        nullable=False,
        index=True,
    )

    upstream_task_id: Mapped["uuid.UUID"] = mapped_column(
        ForeignKey("tasks.id"),
        nullable=False,
        index=True,
    )

    task: Mapped["Task"] = relationship(
        "Task",
        foreign_keys=[task_id],
        back_populates="upstream_links",
    )

    upstream_task: Mapped["Task"] = relationship(
        "Task",
        foreign_keys=[upstream_task_id],
        back_populates="downstream_links",
    )

    job_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("tasks.id"),
        nullable=True,
        index=True,
    )

    job: Mapped["Job | None"] = relationship(
        "Job",
        back_populates="dependencies",
        foreign_keys=[job_id],
    )

    # Input mapping configuration
    merge_strategy: Mapped[str] = mapped_column(
        String(20),
        default="replace",
        nullable=False,
    )

    mapper_config: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
    )


class Dependency:
    """
    Dependency mixin for Task and Job.
    """

    @declared_attr
    def upstream_links(self) -> Mapped[list[TaskDependency]]:
        return relationship(
            "TaskDependency",
            back_populates="task",
            cascade="all, delete-orphan",
            foreign_keys=[TaskDependency.task_id],
            lazy="selectin",
        )

    @declared_attr
    def downstream_links(self) -> Mapped[list[TaskDependency]]:
        return relationship(
            "TaskDependency",
            back_populates="upstream_task",
            cascade="all, delete-orphan",
            foreign_keys=[TaskDependency.upstream_task_id],
            lazy="selectin",
        )

    @declared_attr
    def upstream(self: "Task") -> AssociationProxy[list["Task"]]:
        return association_proxy("upstream_links", "upstream_task")

    @declared_attr
    def downstream(self: "Task") -> AssociationProxy[list["Task"]]:
        return association_proxy("downstream_links", "task")

    @property
    def is_runnable(self: "Task") -> bool:
        return (
                self.status == Status.SCHEDULED
                and all(t.status == Status.SUCCESS for t in self.upstream)
        )

    def add_upstream(
            self: "Task",
            *tasks: "Task",
            merge_strategy: "MergeStrategy" = "replace",
            mapper: Callable[[list[Any]], Any] | None = None
    ) -> None:

        for t in tasks:
            if t in self.upstream:
                continue

            # Prepare mapper config if custom mapper provided
            mapper_config = None
            if mapper is not None:
                if merge_strategy != MergeStrategy.CUSTOM:
                    raise ValueError(
                        "mapper function can only be used with merge_strategy='custom'"
                    )
                mapper_config = {
                    "module": mapper.__module__,
                    "name": mapper.__name__,
                }

            dep = TaskDependency(
                task=self,
                upstream_task=t,
                job=self.parent,
                merge_strategy=merge_strategy,
                mapper_config=mapper_config,
            )
            self.upstream_links.append(dep)

    def add_downstream(self: "Task", *tasks: "Task") -> None:
        for t in tasks:
            if t in self.downstream:
                continue
            dep = TaskDependency(
                task=t,
                upstream_task=self,
                job=self.parent,
            )
            self.downstream_links.append(dep)
