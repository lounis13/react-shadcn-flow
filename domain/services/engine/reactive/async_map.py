# domain/services/engine/reactive/async_map.py
from __future__ import annotations

import asyncio
from typing import Dict, Generic, TypeVar, Callable

K = TypeVar("K")
V = TypeVar("V")


class ConcurrentAsyncMap(Generic[K, V]):
    def __init__(self) -> None:
        self._data: Dict[K, V] = {}
        self._lock = asyncio.Lock()

    async def get(self, key: K) -> V | None:
        async with self._lock:
            return self._data.get(key)

    async def set(self, key: K, value: V) -> None:
        async with self._lock:
            self._data[key] = value

    async def contains(self, key: K) -> bool:
        async with self._lock:
            return key in self._data

    async def delete(self, key: K) -> None:
        async with self._lock:
            self._data.pop(key, None)

    async def get_or_set(self, key: K, factory: Callable[[], V]) -> V:
        async with self._lock:
            value = self._data.get(key)
            if value is None:
                value = factory()
                self._data[key] = value
            return value
