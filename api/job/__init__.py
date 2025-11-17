import uuid
from typing import Annotated

from fastapi import APIRouter
from fastapi.params import Depends
from pydantic import BaseModel
from starlette.background import BackgroundTasks

from application import night_batch_job
from domain.job_repository import get_job_repository, JobRepository

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


class JobResponse(BaseModel):
    job_id: uuid.UUID
    status: str


@router.post("/", status_code=202)
async def run(bg: BackgroundTasks):
    job = await night_batch_job.create()
    bg.add_task(night_batch_job.run, job.id)
    return JobResponse(job_id=job.id, status=job.status)


@router.get("/")
async def get_jobs(repository: Annotated[JobRepository, Depends(get_job_repository)]):
    jobs = await repository.get_all(load_graph=False)
    return jobs


@router.get("/{job_id}")
async def get_job(job_id: uuid.UUID, repository: Annotated[JobRepository, Depends(get_job_repository)]):
    job = await repository.get(job_id)
    return job


class RetryRequest(BaseModel):
    task_id: uuid.UUID

@router.post("/{job_id}/retries", status_code=202)
async def retry(job_id: uuid.UUID, request: RetryRequest, bg: BackgroundTasks):
    bg.add_task(night_batch_job.retry, job_id, request.task_id)
    return job_id