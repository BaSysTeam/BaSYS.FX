# Proposal

## Why

Application projects keep repeating their own functions for rounding quantities, hours, and amounts. The example in `Solutions.Construction/metadata/modules/common/module.common.bjs` uses `Math.round(value * factor) / factor`: negative halves round toward positive infinity, and binary multiplication produces an unexpected result for `1.005` and `10.075`.

## What Changes

- Add a public synchronous function `round(value: number, digits: number = 0): number` that rounds to the nearest decimal place; ties resolve away from zero.
- Support a positive number of fractional digits, zero for integers, and a negative value for tens, hundreds, and beyond. The proposed `digits` range is the integers from `-308` to `324`, covering the decimal orders of `Number`.
- Round the canonical decimal representation of the input `Number`: `round(1.005, 2) → 1.01`, `round(-1.5) → -2`. The result remains a `number` with IEEE 754 limits.
- Accept only numeric arguments, with no implicit conversion and no substitution of errors by zero. This was agreed with the user. Pass `NaN` and infinities through as standard math functions do; normalize a zero result to `+0`.
- Document the contract, examples, and the differences from `Math.round` and formatting; add checks for edge cases and the public export.

## Capabilities

### New Capabilities

- `number-rounding`: numeric decimal rounding with explicitly defined rules for ties, precision, argument types, and special values.

### Modified Capabilities

None: the `openspec/specs` directory does not contain specifications yet.

## Impact

- `src/common.ts`: the new function and its documentation; `src/index.ts` already exports all of `common`.
- `tests/round.spec.ts`: a new contract test suite, including an import through the public entry point.
- `README.md`, `docs/round.md`: usage examples and limits.
- Dependencies and ES6 compatibility stay as they are. The implementation uses no `BigInt`, no new npm packages, and does not change prototypes.
- Compatibility: a new API is added. `parseNumber`, `formatNumber`, and `format` keep their existing behavior. String formatting may differ from the new decimal rounding on boundary values.
- Out of scope: moving functions from Construction, the aliases `round1`/`round2`/`round3`/`round6`, banker's rounding, arbitrary decimal arithmetic, a version change, committing release build artifacts, and publishing the package.
