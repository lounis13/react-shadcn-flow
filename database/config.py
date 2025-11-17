from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DB_BACKEND: str = "sqlite"


    def get_database_url(self) -> str:
        if self.DB_BACKEND == "sqlite":
            return "sqlite+aiosqlite:///./app.db"
        return f"postgresql+asyncpg://user:password@localhost:5432/mydb"

settings = Settings()
