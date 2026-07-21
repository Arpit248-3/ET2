# UrjaNetra AI — Phase 3 Developer Guide & Metadata Architecture

This guide explains how to consume, test, and extend the Phase 3 deterministic decision intelligence engines in UrjaNetra AI.

---

## 1. Engine Contract & Signature

Every core decision engine in `backend/app/core/` implements the functional contract:

```python
def execute(state: PipelineState, context: ExecutionContext) -> PipelineState:
    ...
    return state
```

### Input Parameters
- `state`: The immutable or transient `PipelineState` passed through the DAG controller.
- `context`: `ExecutionContext` object carrying `execution_id`, `scenario_id`, `demo_step`, `timestamp`, `trigger`, and `correlation_id`.

---

## 2. Metadata Schemas

Every engine section output includes structured JSON metadata for explainability and calculation replay:

```python
class ExplanationMetadata(BaseModel):
    assumptions: List[str]
    formula_used: str
    primary_drivers: List[str]
    secondary_drivers: List[str]
    sensitivity_factors: Dict[str, float]
    limitations: List[str]

class CalculationMetadata(BaseModel):
    execution_time_ms: float
    input_hash: str
    output_hash: str
    calculation_version: str = "3.0.0"
    engine_version: str = "3.0.0"
```

---

## 3. Running Automated Tests

To execute the full unit test suite covering determinism, engine boundary conditions, and all 15 scenario simulation packs:

```bash
cd backend
python -m unittest discover -s tests -p "test_*.py"
```

### Key Test Files
- `tests/test_determinism.py`: Verifies deterministic replayability and SHA-256 calculation output hashes.
- `tests/test_engines.py`: Tests sanctions exclusions, physical SPR capacity boundaries, and dynamic risk weights.
- `tests/test_scenario_suite.py`: Executes the entire pipeline across all 15 scenario simulation packs.

---

## 4. Replay Verification

To verify deterministic replayability programmatically:

```python
from app.pipeline.controller import controller
from app.pipeline.models import ExecutionContext

ctx = ExecutionContext(scenario_id="hormuz_closure", demo_step=1)
state1 = controller.run(context=ctx)
state2 = controller.run(context=ctx)

assert state1.risk.calculation_metadata.output_hash == state2.risk.calculation_metadata.output_hash
```
