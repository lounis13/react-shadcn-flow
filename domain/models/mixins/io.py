from __future__ import annotations

from dataclasses import is_dataclass, asdict
from typing import Any, ClassVar, Optional, TypeVar, get_args, get_origin, Generic

from pydantic import BaseModel
from sqlalchemy import JSON
from sqlalchemy.orm import Mapped, mapped_column

InputT = TypeVar("InputT")
OutputT = TypeVar("OutputT")


def _to_model(model: Any, raw: Any):
    """
    Convert raw data to typed model.
    Supports: primitives, generics (list, dict), dataclasses, Pydantic models.
    """
    if raw is None or model is None:
        return None

    # Primitifs et containers simples : on considère que le JSON est déjà au bon format
    if model in (int, str, float, bool, list, dict, tuple, set):
        return raw

    origin = get_origin(model)
    # Types génériques (list[str], dict[str, int], etc.)
    if origin in (list, dict, tuple, set):
        # Ici tu peux faire du mapping récursif fin si tu veux,
        # mais en pratique le JSON correspond déjà à la structure.
        return raw

    # Si ce n'est pas un dict, on suppose que c'est déjà instancié ou un type simple
    if not isinstance(raw, dict):
        return raw

    # Dataclass
    if is_dataclass(model):
        return model(**raw)

    # Pydantic
    if isinstance(model, type) and issubclass(model, BaseModel):
        return model.model_validate(raw)

    return raw


def _to_json(value: Any):
    if value is None:
        return None
    if is_dataclass(value):
        return asdict(value)
    if isinstance(value, BaseModel):
        return value.model_dump()
    if isinstance(value, list):
        return [_to_json(item) for item in value]
    if isinstance(value, dict):
        return {k: _to_json(v) for k, v in value.items()}
    return value


class IO(Generic[InputT, OutputT]):
    """Typed IO loaded from generics."""

    _input_data: Mapped[dict | None] = mapped_column(
        "input",
        JSON,
        nullable=True,
    )
    _output_data: Mapped[dict | None] = mapped_column(
        "output",
        JSON,
        nullable=True,
    )

    # modèles typés déduits des génériques
    input_model: ClassVar[Optional[Any]] = None
    output_model: ClassVar[Optional[Any]] = None

    def __init_subclass__(cls, **kwargs):
        """
        Déduction automatique de InputT / OutputT à partir des bases génériques.

        Gère :
        - class Foo(IO[In, Out])
        - class Bar(Task[In, Out])  avec  class Task(Base, IO[InT, OutT], Generic[InT, OutT])
        """
        super().__init_subclass__(**kwargs)

        for base in getattr(cls, "__orig_bases__", []):
            origin = get_origin(base)
            if origin is None:
                continue

            # On veut les bases dont l'origin est IO ou une sous-classe de IO (ex: Task)
            try:
                if not issubclass(origin, IO):
                    continue
            except TypeError:
                # origin peut être un truc typing chelou → on ignore
                continue

            args = get_args(base)
            if len(args) != 2:
                continue

            in_t, out_t = args
            cls.input_model = in_t
            cls.output_model = out_t
            # on prend le premier match qui convient
            break

    # ---- Input ----

    @property
    def input(self) -> Optional[InputT]:
        return _to_model(self.input_model, self._input_data)

    @input.setter
    def input(self, value: Optional[InputT]) -> None:
        self._input_data = _to_json(value)

    # ---- Output ----

    @property
    def output(self) -> Optional[OutputT]:
        return _to_model(self.output_model, self._output_data)

    @output.setter
    def output(self, value: Optional[OutputT]) -> None:
        self._output_data = _to_json(value)
