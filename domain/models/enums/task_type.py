# domain/models/task_type.py
from enum import Enum


class TaskType(str, Enum):
    TASK = "TASK"
    JOB = "JOB"
