# Alembic

https://alembic.sqlalchemy.org/en/latest/index.html

## Generate a Migration

```bash
alembic revision --autogenerate -m "description"
```

## Apply Migrations

```bash
alembic upgrade head
```

**Note:** Migrations are automatically applied each time the application starts.
`database.run_migrations()` in [database.py](../database.py)

## Roll Back

```bash
alembic downgrade -1
````

## Automatic Execution

Migrations are automatically applied at application startup via `database.run_migrations()`.

## Configuration

The database URL used by Alembic comes from:

```
settings.get_database_url()
```

## importants files

- `alembic.ini` — config Alembic
- `database/migrations/` — migrations scripts
- `database/migrations/env.py` — Alembic (async engine)