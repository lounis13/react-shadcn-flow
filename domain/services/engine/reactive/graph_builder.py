from typing import Generator

from domain.models.enums.task_type import TaskType
from domain.models.job import Job
from domain.models.task import Task
from .reactive_job import ReactiveJob
from .reactive_task import ReactiveTask


def iter_task_tree(root: Job) -> Generator[Task, None, None]:
    stack: list[Task] = [root]

    while stack:
        current = stack.pop()
        yield current

        if current.task_type == TaskType.JOB and isinstance(current, Job):
            stack.extend(current.children)


def build_reactive_graph(root: Job) -> dict[Task, ReactiveTask]:
    nodes: dict[Task, ReactiveTask] = {
        task:  ReactiveJob(task=task) if isinstance(task, Job) else ReactiveTask(task=task)
        for task in iter_task_tree(root)
    }

    for task, node in nodes.items():
        node.upstream = [nodes[up] for up in task.upstream if up in nodes]
        if isinstance(task, Job):
            node.children = [nodes[child] for child in task.children if child in nodes]
        if task.parent:
            node.parent = nodes[task.parent]


    return nodes
