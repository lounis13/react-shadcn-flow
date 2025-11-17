import uuid

from application.build_library_job import BuildLibraryJob, PricingLibrary
from application.multi_price_job import MultiPriceJob, TriggerMultiPriceInput
from database import database
from domain.job_repository import JobRepository
from domain.models.job import Job
from domain.models.task import Task
from domain.services.engine.reactive.reactive_engine import get_engine


class Start(Task):
    async def action(self):
        print("Starting")


class NightBatchJob(Job):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)

        self.start = Start(parent=self, name="Start")

        self.candidate_engine = BuildLibraryJob(
            parent=self,
            name="Building Candidate Image Job",
            input=PricingLibrary(name="1.0.0-candidate")
        )
        self.reference_engine = BuildLibraryJob(
            parent=self,
            name="Building Reference Image Job",
            input=PricingLibrary(name="2.0.0-reference"),
        )

        self.start.add_downstream(self.candidate_engine, self.reference_engine)

        self.reference_pricing = MultiPriceJob(
            parent=self,
            name="Reference Pricing Job",
            input=TriggerMultiPriceInput(collation_id="reference-collation-id")
        )

        self.candidate_pricing = MultiPriceJob(
            parent=self,
            name="Candidate Pricing Job",
            input=TriggerMultiPriceInput(collation_id="candidate-collation-id")
        )

        self.reference_pricing.add_upstream(self.reference_engine)

        self.candidate_pricing.add_upstream(self.candidate_engine)


async def create() -> NightBatchJob:
    job = NightBatchJob(name="Night Batch Job")
    async with database.get_session_manager() as session:
        session.add(job)
        await session.commit()
        await session.refresh(job)
    return job


async def run(job_id: uuid.UUID):
    async with database.get_session_manager() as session:
        engine = await get_engine(repository=JobRepository(session), job_id=job_id)
        await engine.run()


async def retry(job_id: uuid.UUID, task_id: uuid.UUID):
    async with database.get_session_manager() as session:
        engine = await get_engine(repository=JobRepository(session), job_id=job_id)
        await engine.retry(task_id=task_id)
