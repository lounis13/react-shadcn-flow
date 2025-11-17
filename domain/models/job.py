from __future__ import annotations

from typing import Generic

from domain.models.enums.task_type import TaskType
from domain.models.mixins.io import InputT, OutputT
from domain.models.task import Task


class Job(Generic[InputT, OutputT], Task[InputT, OutputT]):

    def __init__(self, **kwargs):
        kwargs.setdefault("task_type", TaskType.JOB)
        super().__init__(**kwargs)

    @property
    def output(self):
        return [child.output for child in self.children]
