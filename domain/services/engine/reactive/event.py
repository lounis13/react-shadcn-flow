import enum
from dataclasses import dataclass

from domain.models.task import Task


class EventType(enum.StrEnum):
    NONE = "none"
    SETUP = "setup"
    RUN = "start"
    RETRY = "retry"
    FAILED = "failed"
    FINISHED = "finished"

    def skip_execution(self) -> bool:
        return self in {EventType.SETUP}


@dataclass
class Event:
    task: Task
    type: EventType
