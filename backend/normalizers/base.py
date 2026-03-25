"""Normalization boundary definitions for Phase 2.5.

This module defines the minimal Normalizer interface used by the
normalization layer. Implementations live in domain-specific modules
and must implement `normalize(payload: Any) -> dict`.

Contract summary
- input: raw provider payload (opaque `Any`)
- output: a plain `dict` matching the target Pydantic model shape
  (the authoritative contract defined in Package 1)
- success: return a `dict` that can be consumed by the domain Pydantic
  model (e.g. `Model.parse_obj(result)` will succeed)
- failure: raise `NormalizationError` for unrecoverable transformation
  problems; implementations MAY return partial/degenerate results when
  the domain allows degradable omissions, but such behavior must be
  documented in the implementation.

This file intentionally contains no runtime wiring or registration.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Dict


class NormalizationError(Exception):
    """Raised when a normalizer cannot produce a contract-conformant dict.

    Use this error to signal unrecoverable transformation or validation
    failures. Callers can catch this exception and decide whether to
    propagate an error response, log and skip, or attempt fallback
    strategies.
    """


class Normalizer(ABC):
    """Abstract normalizer interface.

    Implementations must provide `normalize(payload)` which accepts an
    opaque raw payload from upstream providers and returns a plain
    `dict` whose keys and value shapes match the target Pydantic model.

    Example:
        result = MyConditionsNormalizer().normalize(raw_payload)
        # result should be acceptable to: Conditions.parse_obj(result)

    Implementations should be defensive and keep transformations narrow:
    prefer explicit field mappings and rely on the Package 1 models for
    final validation.
    """

    @abstractmethod
    def normalize(self, payload: Any) -> Dict[str, Any]:
        """Transform `payload` into a contract-shaped `dict`.

        Args:
            payload: Raw input from a provider or a mock. Could be any
                Python object (dict, list, custom object, etc.).

        Returns:
            A plain `dict` that matches the domain Pydantic model shape.

        Raises:
            NormalizationError: If the input cannot be transformed into a
                contract-conformant dict.
        """

        raise NotImplementedError()
