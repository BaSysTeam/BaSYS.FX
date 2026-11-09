# Spec Review — mathematical rounding

**Date:** 2026-11-09 18:51 (Europe/Moscow)
**Change and scope:** `add-mathematical-rounding` — proposal, delta spec `number-rounding`, design, and tasks
**BaSYS.FX revision:** `23070f610a5864f51dd1340e0152bdab84875bec`. Working tree has one unrelated modification, `docs/relises/1.1.0.md`. The change artifacts are in HEAD.
**Reviewed sources:** [proposal.md](../proposal.md), [design.md](../design.md), [specs/number-rounding/spec.md](../specs/number-rounding/spec.md), [tasks.md](../tasks.md), [src/common.ts](../../../../src/common.ts), [src/index.ts](../../../../src/index.ts), [tsconfig.json](../../../../tsconfig.json), [package.json](../../../../package.json), [rollup.config.mjs](../../../../rollup.config.mjs), [jest.config.js](../../../../jest.config.js), [Solutions.Construction `module.common.bjs`](../../../../../Solutions.Construction/metadata/modules/common/module.common.bjs)

## Verdict
**Readiness:** Ready after corrections

The public contract is one new synchronous `round` function, the delta is ADDED for a new capability, and the checked examples match both the canonical `String` of the current host and the tie-away-from-zero rule. Current-code claims about `common`, `formatNumber`, `parseNumber`, the ES6 build, and the Construction helper are accurate. Correct the early-return cutoff in D3 before implementation so an exact tie with an empty kept coefficient cannot become `+0`.

## Automated checks
| Check | Result |
| --- | --- |
| OpenSpec status | Passed. Schema `spec-driven`. Proposal, specs, design, and tasks are `done`. `isPlanningComplete` and `isComplete` are true. |
| OpenSpec validate --strict | Passed. `Change 'add-mathematical-rounding' is valid`. |

## Findings
### 1. The early return to zero has no numeric cutoff [Medium]
- **Location:** [design.md](../design.md) D3 step 2; [specs/number-rounding/spec.md](../specs/number-rounding/spec.md) tie requirement; [tasks.md](../tasks.md) 1.1 and 1.3
- **Issue:** D3 tells the implementer to return `+0` when the rounding place is “substantially coarser” than the number, and it does not define that predicate. Step 3 then handles an empty kept coefficient, including a first discarded digit of `5–9`. That case is an exact tie and must round away from zero. A cutoff that treats every magnitude below `10^(-digits)` as zero still passes every written scenario, including `round(-Number.MIN_VALUE, 322) → +0`, because that value is below half a unit (`5e-324 < 5e-323`). The same cutoff returns `+0` for exact ties whose kept coefficient is empty.
- **Evidence:** Design D3 says: “If the rounding place is substantially coarser than the number, return `+0`.” The next step says to increment on digits `5–9`, “including the case of all nines and an empty kept part.” The spec requires the value with the larger absolute value when distances are equal. On this host, `String(5) === "5"` and `String(5e-323) === "5e-323"`. Under that contract, `round(5, -1)` is `10`, `round(-5, -1)` is `-10`, and `round(5e-323, 322)` is `1e-322`. Task 1.3 is done when the suite covers every scenario in the spec. None of those scenarios is an empty-kept tie, so the suite can pass while this class of ties is wrong.
- **Recommendation:** Define the early return as an absolute canonical value strictly below half a unit, `5 × 10^(-(digits+1))`. Add a scenario for an exact tie with an empty kept coefficient, with both signs, and include it in the task 1.3 suite.

### 2. The implementation report has no destination [Low]
- **Location:** [tasks.md](../tasks.md) 2.2; [proposal.md](../proposal.md) Impact
- **Issue:** The done criterion for task 2.2 requires the check results to be recorded in “the implementation report,” and no artifact, path, or template names that report. The proposal keeps version changes and package publishing out of scope and does not point at an external task section.
- **Evidence:** Task 2.2 ends with “the check results are recorded in the implementation report.” The proposal’s out-of-scope list names Construction migration, rounding aliases, banker's rounding, arbitrary decimal arithmetic, a version change, release artifacts in Git, and publishing. No other planning file defines a report path.
- **Recommendation:** Name the report file under this change, or remove the recording sentence from the done criterion. The diff review, behavior checks, and `openspec validate` command can stay as they are.

## Requirements traceability
| Requirement / Scenario | Tasks | Test / validation | Status |
| --- | --- | --- | --- |
| number-rounding: package access and default precision | 1.1, 1.4, 2.1 | `round(12.6)` and `round(12.6, undefined)` return `13`; import from `src/index.ts` and the built bundles | covered |
| number-rounding: positive and negative precision | 1.1, 1.3 | `1234.567` at `2` and `-2` returns `1234.57` and `1200`; `round(1.2, 2)` preserves `1.2` | covered |
| number-rounding: integer ties on both sides | 1.1, 1.3 | `1.49/1.5/1.51` and the negative counterparts return `1, 2, 2, -1, -2, -2` | covered |
| number-rounding: fractional and integer-place ties | 1.1, 1.3 | `round(±1.25, 1)` returns `±1.3`; `round(±1250, -2)` returns `±1300` | covered |
| Tie with an empty kept coefficient | — | `round(±5, -1)` and `round(5e-323, 322)` are required by the tie rule and have no scenario | missing |
| number-rounding: typical decimal ties | 1.1, 1.3 | `1.005`, `2.675`, `1.255`, and `10.075` at 2 places return `1.01`, `2.68`, `1.26`, and `10.08`, with matching negatives | covered |
| number-rounding: value immediately below a tie | 1.3 | `round(1.4999999999999998)` returns `1` | covered |
| number-rounding: exponential notation and digit carry | 1.3 | `round(±1.25e-7, 8)` returns `±1.3e-7`; `round(9.995, 2)` returns `10` | covered |
| number-rounding: non-numeric value | 1.2 | Strings, null, undefined, booleans, objects, arrays, boxed numbers, symbols, and a missing argument throw `TypeError` | covered |
| number-rounding: non-numeric precision | 1.2 | `'2'`, `null`, `false`, and an object in `digits` throw `TypeError`; explicit `undefined` means `0` | covered |
| number-rounding: invalid numeric precision | 1.2 | `1.5`, `NaN`, infinities, `-309`, and `325` throw `RangeError`, including when `value` is `NaN` or `Infinity` | covered |
| number-rounding: both precision bounds | 1.3 | `round(1, -308)` returns `0`; `round(1, 324)` returns `1` | covered |
| number-rounding: non-finite values preserved | 1.3 | `NaN`, `Infinity`, and `-Infinity` are preserved for an allowed precision | covered |
| number-rounding: negative zero removed | 1.3 | `round(-0)`, `round(0)`, and `round(-0.004, 2)` satisfy `Object.is(result, 0)` | covered |
| number-rounding: large value kept when precision is kept | 1.3 | `round(Number.MAX_VALUE, 2)`, `round(-Number.MAX_VALUE, 324)`, and `round(1e308, -308)` preserve those values | covered |
| number-rounding: final result overflows | 1.3 | `round(±Number.MAX_VALUE, -308)` returns `±Infinity` | covered |
| number-rounding: subnormal numbers | 1.3 | `Number.MIN_VALUE` at `324`, `323`, and negative at `322` returns `Number.MIN_VALUE`, `1e-323`, and positive zero | covered |

## Ranked findings
| Done | # | Severity | Finding | Artifact |
| --- | --- | --- | --- | --- |
| [ ] | 1 | Medium | The early return to zero has no numeric cutoff | [design.md](../design.md) |
| [ ] | 2 | Low | The implementation report has no destination | [tasks.md](../tasks.md) |

## Review limitations
The Construction helper was available and matches the proposal: `roundBy` is `Math.round((Number(value) || 0) * factor) / factor`, with `round1`, `round2`, `round3`, and `round6` as aliases. On this Node host, `String(1.005)`, `String(2.675)`, `String(1.255)`, `String(10.075)`, `String(9.995)`, `String(1.25e-7)`, and `String(1.4999999999999998)` are those same decimal literals; `1.4999999999999998 < 1.5`; `Number.MIN_VALUE` stringifies as `5e-324`; and `String(Number.MAX_VALUE)` is `1.7976931348623157e+308`. `Math.round(1.005 * 100) / 100` is `1`, `Math.round(10.075 * 100) / 100` is `10.07`, and `Math.round(-1.5)` is `-1`. `(1.005).toFixed(2)` is `1.00`, so the claimed difference from `formatNumber` is real. ECMAScript `Number::toString` does not uniquely fix the last digit in its normative step; the scenarios were confirmed on this host, not on every ES6 engine. `src/index.ts` re-exports `common`, `parseNumber` replaces `NaN` with `0`, and `formatNumber` uses `Math.abs(value).toFixed(decimals)`. The main `openspec/specs` catalog is empty, as the proposal says. `dist` is gitignored and has no tracked files. This review did not run the test suite or the build, and it did not review the unrelated working-tree edit in `docs/relises/1.1.0.md`.
