from pydantic import BaseModel

from domain.models.enums.input_strategy import MergeStrategy
from domain.models.job import Job
from domain.models.task import Task


class TriggerMultiPriceInput(BaseModel):
    collation_id: str


class TriggerMultiPriceOut(TriggerMultiPriceInput):
    status: str


class TriggerMultiPrice(Task[TriggerMultiPriceInput, TriggerMultiPriceInput]):
    def __init__(self, input: TriggerMultiPriceInput, **kwargs):
        super().__init__(**kwargs)
        self.input = input

    async def action(self):
        print(f"executing action TriggerMultiPrice {self.parent.name}")
        return self.input


class CollationMultiPrice(Task[TriggerMultiPriceInput, TriggerMultiPriceOut]):
    async def action(self):
        print(f"executing action CollationMultiPrice {self.parent.name}")
        return TriggerMultiPriceOut(collation_id=self.input.collation_id, status="OK")


def mapper(inputs: list[TriggerMultiPriceInput]):
    return inputs[0]


class MultiPriceJob(Job[TriggerMultiPriceInput, TriggerMultiPriceOut]):

    def __init__(self, input: TriggerMultiPriceInput, **kwargs):
        super().__init__(**kwargs)
        self.input = input
        trigger = TriggerMultiPrice(parent=self, name="Trigger Pricing", input=self.input)
        collation = CollationMultiPrice(parent=self, name="Collation Pricing")

        collation.add_upstream(
            trigger,
            merge_strategy=MergeStrategy.CUSTOM,
            mapper=mapper
        )
