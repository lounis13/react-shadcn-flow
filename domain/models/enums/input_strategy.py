from __future__ import annotations

from enum import Enum
from typing import Any, Callable


class MergeStrategy(str, Enum):
    """
    Strategy for merging multiple upstream outputs into a single input.
    """
    REPLACE = "replace"  # Last non-None output wins
    MERGE_DICT = "merge_dict"  # Merge all dict outputs (later keys override)
    MERGE_LIST = "merge_list"  # Concatenate all list outputs
    CUSTOM = "custom"  # Use custom mapper function


class InputMapper:
    """
    Handles transformation and merging of upstream task outputs
    into downstream task inputs.
    """

    @staticmethod
    def merge_outputs(
            upstream_outputs: list[Any],
            merge_strategy: MergeStrategy,
            custom_mapper: Callable[[list[Any]], Any] | None = None
    ) -> Any:

        if not upstream_outputs:
            return None

        if merge_strategy == MergeStrategy.REPLACE:
            for output in reversed(upstream_outputs):
                if output is not None:
                    return output
            return None

        elif merge_strategy == MergeStrategy.MERGE_DICT:
            # Merge all dict outputs (later keys override earlier ones)
            result = {}
            for output in upstream_outputs:
                if isinstance(output, dict):
                    result.update(output)
                elif output is not None:
                    # If output is not a dict, wrap it with an index key
                    result[f"output_{len(result)}"] = output
            return result

        elif merge_strategy == MergeStrategy.MERGE_LIST:
            # Concatenate all list outputs
            result = []
            for output in upstream_outputs:
                if isinstance(output, list):
                    result.extend(output)
                elif output is not None:
                    # If output is not a list, append it as a single item
                    result.append(output)
            return result

        elif merge_strategy == MergeStrategy.CUSTOM:
            if custom_mapper is None:
                raise ValueError(
                    "Custom mapper function is required for CUSTOM merge strategy"
                )
            return custom_mapper(upstream_outputs)

        else:
            raise ValueError(f"Unknown merge strategy: {merge_strategy}")

    @staticmethod
    def load_mapper_function(mapper_config: dict) -> Callable:
        import importlib

        module_name = mapper_config.get("module")
        function_name = mapper_config.get("name")

        if not module_name or not function_name:
            raise ValueError(
                f"Invalid mapper config: {mapper_config}. "
                "Must contain 'module' and 'name' keys."
            )

        module = importlib.import_module(module_name)
        mapper_fn = getattr(module, function_name)

        return mapper_fn


async def prepare_task_input(task) -> None:
    if not task.upstream:
        return
    upstream_outputs = [up_task.output for up_task in task.upstream]
    if not task.upstream_links:
        return
    first_link = task.upstream_links[0]
    merge_strategy = MergeStrategy(first_link.merge_strategy)
    mapper_config = first_link.mapper_config

    custom_mapper = None
    if mapper_config:
        print(f"Loading custom mapper for {task.name}: {mapper_config}")
        custom_mapper = InputMapper.load_mapper_function(mapper_config)

    print(f"Preparing input for {task.name}, strategy={merge_strategy}, upstream_count={len(upstream_outputs)}")

    # Merge outputs and assign to task input
    merged_input = InputMapper.merge_outputs(
        upstream_outputs,
        merge_strategy,
        custom_mapper
    )
    print(f"Merged input for {task.name}: {merged_input}")
    task.input = merged_input
