from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from database.config import settings

engine_postgres = create_async_engine(
    settings.get_database_url(),
    echo=False,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    pool_timeout=30,
    pool_recycle=1800,
)

SessionLocalPostgres = async_sessionmaker(
    bind=engine_postgres,
    expire_on_commit=False,
    autoflush=False,
    class_=AsyncSession,
)


async def init_postgres() -> None:
    async with engine_postgres.connect() as conn:
        await conn.execute("SELECT 1")
