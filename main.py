from contextlib import asynccontextmanager

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

import api.job
from database import database


@asynccontextmanager
async def lifespan(_app: FastAPI):
    print(f"Starting app {_app.__dict__}",)
    engine = await database.init()
    yield
    await engine.dispose()


app = FastAPI(lifespan=lifespan)
app.include_router(api.job.router)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)


@app.get("/")
async def root():
    return {"message": "Hello World"}


