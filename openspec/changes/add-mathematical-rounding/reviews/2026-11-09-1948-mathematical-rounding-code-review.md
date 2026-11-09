# Code Review — Mathematical rounding

**Date:** 2026-11-09 19:48 (Europe/Moscow)
**Scope:** Implementation of `add-mathematical-rounding`: `src/numberRounding.ts`, rounding and numeric-formatting changes in `src/common.ts`, `src/index.ts` integration, `tests/round.spec.ts`, `tests/format.spec.ts`, and related README/documentation. Reviewed against the change's proposal, design, specification, and tasks.
**Revision:** `6e891441a3b1afae8ed9ab46233ffe0e776c84da` plus the current uncommitted working tree. Rounding includes modified tracked files and untracked `src/numberRounding.ts`, `tests/round.spec.ts`, and `docs/round.md`; HEAD alone does not contain the reviewed implementation. No staged changes were present.

## Summary

One Medium finding: formatter precision normalization does not preserve the explicitly required JavaScript coercion behavior. Fractional precision supplied as a string or boxed number can produce malformed decimal text; some previously accepted precision values now throw or produce the wrong result.

The shared decimal core, numeric `round` contract, direct decimal rendering, public exports, and generated declarations otherwise matched the reviewed requirements in the inspected paths and executed checks. The complete Jest suite, strict TypeScript check, isolated Rollup build, and OpenSpec validation passed. Passing tests do not cover the coercion defect below.

The working tree also contains changes for `fix-query-where-parentheses` and `add-datatable-sql-order-by`, including unrelated README content. Those changes were excluded from substantive review, although the regression suite and temporary build necessarily used the current working tree. All tasks in this rounding change are marked complete; the finding is an implementation defect rather than an acknowledged unfinished delivery task. Release/version selection and publishing are explicitly outside this change's scope.

## Validation

Environment: Windows, Node.js `v22.23.2`, npm `10.9.8`, installed repository dependencies. The sandbox helper failed before starting commands; checks subsequently ran through the approved execution fallback. No dependencies were installed.

| Check | Result |
| --- | --- |
| `npm test -- --runInBand --no-cache --coverage=false` | Passed: 12 suites, 315 tests, including both rounding/formatting suites. |
| `node node_modules/typescript/bin/tsc --noEmit` | Passed with the repository's strict configuration. Checked separately because Jest config uses `strict: false`. |
| `node <repository>/node_modules/rollup/dist/bin/rollup -c` in an isolated temporary copy | Passed. This invokes the same Rollup command as `npm run build`. Copied source/configuration and reused installed dependencies through a temporary junction. Rollup reported circular dependencies in the existing table processors, outside the rounding change. |
| ESM, UMD, and IIFE smoke checks in Node | Passed public `round`, `formatNumber`, and numeric `format` checks for decimal halves, high-precision padding, unsigned zero, exponential input, special tokens, and absence of core helpers from entry-point exports. ESM output was copied to `.mjs` for Node loading; IIFE ran in a VM context. |
| Generated declarations | Confirmed `round(value: number, digits?: number): number` in `common.d.ts` and the existing `common` re-export in `index.d.ts`. |
| Precision compatibility probes | Reproduced finding 1 against the built UMD API and compared with HEAD's `common.ts`, transpiled in memory. No test files were created. |
| `openspec validate add-mathematical-rounding --strict` | Passed, with telemetry disabled. |
| `git diff --check` | Passed; Git emitted line-ending conversion notices for existing modified task files. |

The isolated build directory and its dependency junction were removed. Repository source, tests, task checkboxes, package files, and `dist` were not changed by the review. No coverage percentage was measured. Native browser execution, older JavaScript engines, external application consumers, and a published-package installation were not tested.

## Findings

### 1. Preserve precision coercion before truncation and range checking [Medium]

- **Location:** [src/common.ts, lines 250–265](../../../../src/common.ts#L250), particularly the non-finite branch at lines 254–255; called by `formatNumber` at line 352 and numeric `format` through delegation.
- **Issue and evidence:** `Number.isNaN` and `Number.isFinite` do not coerce their arguments. A string or boxed number therefore enters the non-finite branch and is returned without numeric conversion or truncation. The decimal core can receive a fractional exponent or `NaN`, and range comparisons can reject a precision before its required truncation. The [formatting normalization requirement](../specs/number-rounding/spec.md#requirement-formatting-precision-preserves-its-existing-normalization) and design D2 explicitly retain the previous `toFixed`-compatible coercion. Although the TypeScript option is declared as `number`, this is a promised JavaScript runtime behavior, distinct from the intentionally strict argument contract of `round`.

  Reproduced with input `1.005`; the following `decimals` values produce the same failures through `formatNumber` and numeric `format`:

  | `decimals` | Required normalized precision | Expected current result | Actual result |
  | --- | --- | --- | --- |
  | `'2.9'` | `2` | `"1.01"` | `".101"` |
  | `new Number(2.9)` | `2` | `"1.01"` | `".101"` |
  | `'abc'` | `0` | `"1"` | `"0"` |
  | `'-0.9'` | `0` | `"1"` | `RangeError` |
  | `'100.9'` | `100` | `"1.005"` followed by 97 zeros | `RangeError` |

  The HEAD implementation accepted these precisions through native `toFixed`: the first two produced properly formed two-place text (`"1.00"` under the old, intentionally replaced rounding rule), and the negative fraction and non-numeric string produced `"1"`. JavaScript consumers passing configuration-derived precision can now receive malformed text, an incorrect magnitude, or an unexpected exception.
- **Recommendation:** Perform the prior `toFixed`-compatible numeric coercion once, then normalize `NaN`, truncate finite fractions, and check the normalized range. Preserve nullish option defaults and the prior errors for values that cannot be converted. Pass only a normalized numeric integer to the shared core and renderer. Add public regression cases for fractional strings, boxed fractions, non-numeric strings, and truncation at both bounds through both formatting entry points.

## Test coverage

[tests/round.spec.ts](../../../../tests/round.spec.ts) covers defaults and explicit `undefined`, positive/negative precision, symmetric ties, immediately-below-half behavior, exponent notation and carry, empty-kept ordinary/subnormal ties, below/above-half values, type/range errors and validation order, both precision limits, non-finite values, positive-zero identity, extreme finite values, final overflow, and public entry-point exports. Expected values are explicit; zero checks use `Object.is`. The internal core is not tested through a newly public interface.

[tests/format.spec.ts](../../../../tests/format.spec.ts) covers canonical decimal halves, ties near zero, carry and padding, high-precision `0.1`, unsigned zero, masks, custom/disabled grouping, separators, numeric fractional/NaN normalization, nullish defaults, precision bounds/errors before special tokens, plain exponential-input rendering, whole special tokens, and equivalence with numeric `format`. Existing date, boolean, unsupported-type, and parsing regression checks also passed. These tests assert actual values rather than only successful execution.

The normalization tests at [lines 154–165](../../../../tests/format.spec.ts#L154) exercise primitive numeric values but omit the explicitly retained coercion cases. The equivalence cases compare the two entry points but cannot independently detect a defect shared by both. Add explicit expected-output assertions for the cases in finding 1. The runtime absence check for the erased `DecimalRecord` interface alone does not prove type visibility; the source exports and generated entry-point declarations were also inspected.

No new provider/global-state mutations were introduced by the rounding code or its tests. Importing the public index retains the existing Date-extension side effect; numeric rounding itself has no browser, provider, locale, or Node runtime dependency. Existing ES6 target and dependency declarations are unchanged.

## Ranked findings

| Done | # | Severity | Finding | File |
| --- | --- | --- | --- | --- |
| [ ] | 1 | Medium | Preserve precision coercion before truncation and range checking | [src/common.ts:250](../../../../src/common.ts#L250) |
