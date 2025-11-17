import asyncio
from contextlib import asynccontextmanager
from typing import Optional

from alembic import command
from alembic.config import Config
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker

from .config import settings
from .postgres import engine_postgres, SessionLocalPostgres
from .sqlite import engine_sqlite, SessionLocalSqlite

engine: Optional[AsyncEngine]
SessionLocal: Optional[async_sessionmaker[AsyncSession]]


async def init() -> AsyncEngine:
    global engine, SessionLocal

    if settings.DB_BACKEND == "postgres":
        engine = engine_postgres
        SessionLocal = SessionLocalPostgres
    else:
        engine = engine_sqlite
        SessionLocal = SessionLocalSqlite
    async with engine.begin() as connection:
        await run_migrations(connection)
    return engine


async def run_migrations(connection) -> None:
    cfg = Config("alembic.ini")
    cfg.attributes['connection'] = connection

    def _run_migrations():
        command.upgrade(cfg, "head")

    await asyncio.to_thread(_run_migrations)
    print("Migration ended")


@asynccontextmanager
async def get_session_manager():
    if SessionLocal is None:
        raise RuntimeError("database.init() n'a pas été appelé")

    async with SessionLocal() as session:
        yield session


async def get_session():
    async with get_session_manager() as session:
        yield session
