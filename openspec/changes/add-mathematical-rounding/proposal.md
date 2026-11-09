# Proposal

## Why

Application projects keep repeating their own functions for rounding quantities, hours, and amounts. Construction uses `Math.round(value * factor) / factor`, while BaSYS.FX formatting uses `toFixed`; a shared decimal rounding rule is needed so calculations and displayed values agree on halves and do not expose binary tails at high display precision.

## What Changes

- Add public synchronous `round(value: number, digits: number = 0): number`, rounding the canonical decimal representation of the input to the nearest decimal place, with ties away from zero. Accept integer `digits` from `-308` to `324`.
- Introduce one internal decimal rounding core used by `round` and `formatNumber`. The numeric branch of `format` continues to delegate to `formatNumber`. Formatting consumes decimal digits directly, without a round-trip through an intermediate `number` or a second rounding step.
- Accept only numeric arguments in `round`, with explicit type/range checks. Preserve `NaN` and infinities in numeric results and normalize zero to `+0`. Format a rounded zero without a minus sign.
- **BREAKING**: correct numeric formatting to use the same decimal rule: `formatNumber(1.005)` becomes `"1.01"`, negative halves are symmetric, and high precision pads canonical decimal digits instead of exposing binary tails. `formatNumber(-0.004)` becomes `"0.00"`.
- Render finite formatted numbers as fixed decimal text, including exponential inputs. Render `NaN`, `Infinity`, and `-Infinity` as literal tokens without grouping. Existing masks, separators, grouping, default precision, and precision normalization/range behavior remain supported.
- Document numeric rounding and its relationship to formatting, with compatibility examples and contract tests for all three entry points.

## Capabilities

### New Capabilities

- `number-rounding`: consistent decimal rounding for numeric results and formatted numeric text, including ties, precision, argument checks, special values, and presentation constraints.

### Modified Capabilities

None: no existing rounding or numeric-formatting specification is present in the main catalog. The existing `query-boundaries` capability is unaffected.

## Impact

- `src/numberRounding.ts`: internal decimal core; no new public helper or type export.
- `src/common.ts`: public `round`, integration of `formatNumber` with the core, and JSDoc. `src/index.ts` already re-exports `common`.
- `tests/round.spec.ts`, `tests/format.spec.ts`: numeric contract, formatter regression, and cross-API consistency tests.
- `README.md`, `docs/round.md`, `docs/format.md`: usage, precision differences, changed results, and IEEE 754 limits of numeric output.
- Dependencies, ES6 build compatibility, and existing public signatures remain unchanged. `parseNumber`, date formatting, boolean formatting, and non-numeric dispatch behavior are unaffected.
- Compatibility changes also correct malformed grouped exponential/non-finite text: for example, `formatNumber(1e21, { groupSeparator: '' })` becomes `"1000000000000000000000.00"`; `formatNumber(Infinity)` becomes `"Infinity"`. Consumers with saved display expectations must review these changes before release.
- Out of scope: migrating Construction helpers, rounding aliases, additional rounding modes, arbitrary decimal arithmetic, changing mask syntax, changing package versions, committing release build artifacts, and publishing. Release/version selection is a separate process and must account for the observable formatting changes.
