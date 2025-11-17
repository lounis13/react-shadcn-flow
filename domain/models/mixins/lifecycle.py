from __future__ import annotations

from datetime import datetime, timedelta

from sqlalchemy import DateTime
from sqlalchemy.orm import Mapped, mapped_column


class Lifecycle:
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    finished_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    @property
    def duration(self) -> timedelta | None:
        if self.started_at and self.finished_at:
            return self.finished_at - self.started_at
        return None

    def start(self) -> None:
        self.started_at = datetime.now()

    def finish(self) -> None:
        self.finished_at = datetime.now()

