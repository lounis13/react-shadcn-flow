import enum


class Status(enum.StrEnum):
    SCHEDULED = "SCHEDULED"
    RUNNING = "RUNNING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    SKIPPED = "SKIPPED"
    READY_TO_RETRY = "READY_TO_RETRY"

    def __new__(cls, value):
        obj = str.__new__(cls, value)
        obj._value_ = value
        return obj

    def is_final(self) -> bool:
        return self in {Status.SUCCESS, Status.FAILED, Status.SKIPPED}

    def __repr__(self):
        return f"{self.name}"

    @property
    def priority(self) -> int:
        priorities = {
            Status.FAILED: 1,
            Status.RUNNING: 2,
            Status.SKIPPED: 3,
            Status.SUCCESS: 4,
            Status.SCHEDULED: 5,
            Status.READY_TO_RETRY: 0,
        }
        return priorities[self]

    @staticmethod
    def compute(statuses: list["Status"]) -> "Status":
        if not statuses:
            return Status.SCHEDULED

        if any(s == Status.READY_TO_RETRY for s in statuses):
            return Status.READY_TO_RETRY

        if any(s == Status.FAILED for s in statuses):
            return Status.FAILED

        if any(s == Status.RUNNING for s in statuses):
            return Status.RUNNING

        if all(s == Status.SKIPPED for s in statuses):
            return Status.SKIPPED

        if all(s == Status.SUCCESS for s in statuses):
            return Status.SUCCESS

        return Status.SCHEDULED
