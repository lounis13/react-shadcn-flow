import uuid

from pydantic import BaseModel

from domain.models.job import Job
from domain.models.task import Task


class PricingLibrary(BaseModel):
    name: str


class PricingEngine(PricingLibrary):
    engine: str


class BuildLibraryTask(Task[PricingLibrary, PricingEngine]):
    async def action(self) -> PricingEngine:
        print(f"executing action BuildLibraryTask {self.parent.name}")
        return PricingEngine(
            name=self.input.name,
            engine=f"engine-{self.input.name}-{uuid.uuid4()}",
        )


class BuildLibraryJob(Job[PricingLibrary, PricingEngine]):

    def __init__(self, input: PricingLibrary, **kwargs, ):
        super().__init__(**kwargs)
        self.input = input
        build_image = BuildLibraryTask(parent=self, name="Building Image")
        build_image.input = input
