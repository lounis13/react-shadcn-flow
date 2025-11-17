# app/db_sqlite.py
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import NullPool

SQLITE_URL: str = "sqlite+aiosqlite:///./app.db"

engine_sqlite = create_async_engine(
    SQLITE_URL,
    echo=False,
    future=True,
    connect_args={"timeout": 30},
    poolclass=NullPool,
)

SessionLocalSqlite = async_sessionmaker(
    bind=engine_sqlite,
    expire_on_commit=False,
    class_=AsyncSession,
)


async def init_sqlite() -> None:
    async with engine_sqlite.begin() as conn:
        await conn.execute(text("PRAGMA journal_mode=WAL"))
        await conn.execute(text("PRAGMA foreign_keys=ON"))
