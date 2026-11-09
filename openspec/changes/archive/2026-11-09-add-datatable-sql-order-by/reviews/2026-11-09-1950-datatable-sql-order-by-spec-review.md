# Spec Review — datatable-sql-order-by

**Date:** 2026-11-09 19:50 (Europe/Moscow)
**Change and scope:** `add-datatable-sql-order-by`, full planning package (proposal, design, delta spec `datatable-ordering`, tasks)
**BaSYS.FX revision:** HEAD `6e891441a3b1afae8ed9ab46233ffe0e776c84da`; working tree dirty. The change directory is untracked. Unrelated uncommitted edits exist in `README.md`, `docs/format.md`, `src/common.ts`, `src/query/selectQueryBuilder.ts`, `tests/format.spec.ts`, other changes' `tasks.md`, plus untracked `src/numberRounding.ts`, `docs/round.md`, `tests/round.spec.ts`, `tests/selectQueryBuilder.where.spec.ts`. None of them touch `src/table/`.
**Reviewed sources:** [proposal](../proposal.md), [design](../design.md), [tasks](../tasks.md), [datatable-ordering spec](../specs/datatable-ordering/spec.md), [main query-boundaries spec](../../../specs/query-boundaries/spec.md), [dataTable.ts](../../../../src/table/dataTable.ts), [dataTableColumn.ts](../../../../src/table/dataTableColumn.ts), [distributionProcessor.ts](../../../../src/table/distributionProcessor.ts), [index.ts](../../../../src/index.ts), [queryBoundary.ts](../../../../src/query/queryBoundary.ts), [tests/](../../../../tests/), `README.md`, `package.json`, `tsconfig.json`, `jest.config.js`, `rollup.config.mjs`.

## Verdict
**Readiness:** Ready for implementation; all seven findings have been resolved in the planning artifacts.

**Correction status (2026-11-09):** The observations and original traceability below retain the pre-correction review history. The checked findings and Resolution verification section record their current disposition.

**Original review summary:**

The package is coherent and the behavior is mostly specified well. Every requirement has testable scenarios, the worked examples are arithmetically correct (B, D, A, C; `2, 0, null, NaN`; `A, a, b`), and the stable decorate-sort-copy-back design fits the ES6 target and embedded runtimes. The plan also correctly keeps `rows` array identity, which `filter`/`clear` do not preserve today.

One High gap remains. The grammar promises both "punctuation is allowed in column names" and "SQL quoting/expressions are rejected", but it never says where the line falls. That changes both the implementation and the expected error for task 1.3. Three Medium items should also be settled before apply: an existing column-ordering precedent in `DistributionProcessor` that the design does not mention, an undefined type-level check in task 2.2, and grammar behavior that appears only in the design and tasks.

## Automated checks
| Check | Result |
| --- | --- |
| OpenSpec status | `spec-driven`; proposal, specs, design, tasks all `done`; `isPlanningComplete: true` |
| OpenSpec validate --strict | `Change 'add-datatable-sql-order-by' is valid` |

## Findings
### 1. The line between literal punctuation names and rejected SQL syntax is undefined [High]
- **Location:** [spec — Criterion grammar and name resolution](../specs/datatable-ordering/spec.md), [spec — Validate criteria before mutation](../specs/datatable-ordering/spec.md), [design — Decision 2](../design.md), [tasks 1.3](../tasks.md)
- **Issue:** The design allows column tokens to contain Unicode or punctuation and resolves them literally against the table, without treating them as property paths. It also requires rejecting "SQL quote delimiters and expression syntax" with an `orderBy:` error. Neither artifact says which characters or forms count as SQL syntax. Inputs such as `"number"`, `[number]`, `` `number` ``, `t.number`, `price-usd`, `lower(name)` or `qty(kg)` could therefore produce either `orderBy: …` or `Column … not found`, depending on the implementer. It is also unclear what happens when a real column is named with such characters, e.g. `addColumn({ name: 'qty(kg)' })`: should it be found or rejected? Task 1.3 requires tests that "reject … SQL syntax" with "the specified error messages/prefixes", but no scenario specifies them.
- **Evidence:** Design: "Do not restrict names to ASCII identifiers: existing metadata can contain Unicode or punctuation. Reject SQL quote delimiters and expression syntax instead of interpreting them." Spec: "Names containing whitespace or commas and SQL quoting/expressions SHALL be outside this grammar." The spec's malformed-criterion scenarios only cover `period sideways`, `42` and an embedded comma. `DataTableColumn` allows any non-empty name ([dataTableColumn.ts L6-L10](../../../../src/table/dataTableColumn.ts#L6-L10)).
- **Recommendation:** Pick one rule and add a scenario for it. Option (a): purely literal. Any token without whitespace or commas is looked up exactly, so `"number"` fails with `Column "number" not found`, and the "reject SQL syntax" wording is dropped from design and tasks. Option (b): an explicit rejected character set, e.g. `" ' \` [ ] ( )`, checked before lookup, which fails with `orderBy:`. If you choose (b), also state whether it overrides an existing column with such a name. Either way, the README task should describe the same rule.

### 2. The existing column ordering in `DistributionProcessor` is not acknowledged and uses different rules [Medium]
- **Location:** [design — Context and Decision 3](../design.md), [proposal — Out of scope](../proposal.md)
- **Issue:** The design says "There is no existing declarative ordering contract to preserve." However, `distributeFifo`/`distributeLifo` already sort a table by a named column (`sortColumn`), and their rules differ from the proposed ones:
  - strings are compared with locale-sensitive `localeCompare`, not relational order;
  - dates are detected with `instanceof Date`, which fails for dates from another context;
  - missing and mixed values compare as `0`, not "missing last";
  - the result relies on native `sort` stability.

  As a result, `orderBy('name')` and `distributeFifo(..., 'name', ...)` will order the same strings differently: `A, a, b` versus the ICU-typical `a, A, b`. The choice in the design may still be right, but it is made without acknowledging this precedent. The non-goal "changes to other table methods" makes the difference permanent without stating it.
- **Evidence:** [distributionProcessor.ts L66-L70](../../../../src/table/distributionProcessor.ts#L66-L70), [distributionProcessor.ts L145-L163](../../../../src/table/distributionProcessor.ts#L145-L163).
- **Recommendation:** In the design Context, name this precedent and state that the two orderings deliberately differ, or record it as a possible follow-up. Correct the "no existing … contract" sentence. Optionally, mention the difference in the README section from task 1.7.

### 3. Task 2.2's type-level acceptance and rejection check has no defined harness [Medium]
- **Location:** [tasks 2.2](../tasks.md), [design — Migration Plan](../design.md)
- **Issue:** Task 2.2 requires "strict TypeScript consumer checks" that accept contextual comparator parameters and string/array inputs while rejecting unsupported argument types. The repository has no type-test fixture and no `tsc --noEmit` script. Jest runs ts-jest with `strict: false`, and `npm run build` only compiles `src/`. Without a named command, "rejecting unsupported argument types" cannot be shown objectively, because a negative check needs something like `// @ts-expect-error` compiled under `--strict`. "Inspect `dist/table/dataTable.d.ts`" only confirms that the overloads exist.
- **Evidence:** [jest.config.js](../../../../jest.config.js) `strict: false`; `package.json` scripts are only `build`/`test`/`test:watch`/`test:coverage`; `dist/` is git-ignored.
- **Recommendation:** Name the check. For example, a temporary consumer file compiled with `npx tsc --noEmit --strict` against `dist/index.d.ts` or `src/index.ts`, with positive calls and `// @ts-expect-error` lines for `orderBy(42)`, `orderBy(null)` and `orderBy({})`. Also say whether the file is kept or discarded.

### 4. Grammar behavior promised in design and tasks is missing from the spec [Medium]
- **Location:** [spec — Criterion grammar and name resolution](../specs/datatable-ordering/spec.md), [tasks 1.2](../tasks.md)
- **Issue:** Some user-visible rules appear only in the design and task 1.2, so they would not reach the main spec on archive:
  - Unicode column names are supported.
  - A column literally named `desc` (or `asc`) is usable as a single token.
  - The meaning of "whitespace" is not defined: ASCII space/tab only, or JavaScript `\s` including NBSP and other Unicode spaces. This affects both splitting and the "names without whitespace" rule.

  In addition, the "Whitespace and direction casing" and "A selected alias" scenarios give no input rows or expected order, so their THEN clauses are checkable only informally.
- **Evidence:** Design Decision 2: "A column literally named `desc` is usable as the single token `desc`." Task 1.2 lists "Unicode column names, a column named `desc`". No spec scenario covers either.
- **Recommendation:** Add short scenarios for a Unicode name and a single-token `desc` column, and define whitespace in the grammar requirement. Give the whitespace and alias scenarios concrete rows and an expected order, as the "Equivalent string and array" scenario already does.

### 5. Overloads reject `string | string[]` unions and readonly arrays [Low]
- **Location:** [design — Decision 1](../design.md), [spec — Three ordering call forms](../specs/datatable-ordering/spec.md)
- **Issue:** With three separate overloads, a consumer value typed `string | string[]` (e.g. a configurable sort setting) or `readonly string[]` / `as const` does not match any overload. At runtime, both would work through `Array.isArray`.
- **Evidence:** Decision 1 only specifies comparator, `string` and `string[]` overloads.
- **Recommendation:** Decide whether the criteria overload should accept `string | readonly string[]`. Note that this keeps contextual typing for the comparator. Then include the decision in task 2.2's consumer check.

### 6. Validation edge cases: error precedence and sparse arrays [Low]
- **Location:** [spec — Validate criteria before mutation](../specs/datatable-ordering/spec.md), [design — Decision 2](../design.md)
- **Issue:** The spec does not say which error wins when one call has both a malformed criterion and an unknown column, e.g. `'absent, period sideways'` or `'absent sideways'`. Parsing everything first and resolving afterwards gives `orderBy:`; resolving per criterion gives `Column absent not found`. Separately, an array with holes (`['number', , 'period']`) passes the "non-string elements" check if validation uses `forEach`/`map`, because those skip holes.
- **Evidence:** The spec only requires that "the entire input and all referenced columns" are validated before mutation.
- **Recommendation:** State the order, e.g. parse the whole list, then resolve columns left to right. State whether holes count as non-string elements, so the tests in task 1.3 have one expected result.

### 7. The proposal says this "matches the conventions" of `select`, but empty segments are handled differently [Low]
- **Location:** [proposal — Why](../proposal.md), [tasks 1.7](../tasks.md)
- **Issue:** `select('a, b,')` silently drops empty segments, while the new `orderBy('a, b,')` throws. The design gives good reasons for this, but the proposal's wording suggests the two behave the same. Users who copy column lists between the two calls will run into the difference.
- **Evidence:** [dataTable.ts L200-L202](../../../../src/table/dataTable.ts#L200-L202) (`.filter((s) => s.length > 0)`); spec "Empty segments are invalid".
- **Recommendation:** Reword the proposal to say "similar string/array input forms". In the README note from task 1.7, mention that trailing or empty segments are errors in `orderBy`.

## Original requirements traceability
| Requirement / Scenario | Tasks | Test / validation | Status |
| --- | --- | --- | --- |
| datatable-ordering: Three ordering call forms — Equivalent string and array | 1.1, 1.2 | Both forms produce `(1,20)`, `(1,10)`, `(2,10)` | covered |
| Three ordering call forms — Custom comparator remains usable | 1.1, 2.2 | Descending numeric callback; identity checks; d.ts inspection | covered (type check harness: finding 3) |
| Criterion grammar — Whitespace and direction casing | 1.2 | Tabs, repeated spaces, mixed-case directions | partial (no concrete data; whitespace undefined: finding 4) |
| Criterion grammar — Selected alias is a current column | 1.2 | `select('product as item, quantity').orderBy('item desc')` | partial (no expected rows: finding 4) |
| Criterion grammar — Column names case-sensitive | 1.2, 1.3 | `Column Number not found` | covered |
| Criterion grammar — Unicode names, `desc` column, SQL syntax rejection | 1.2, 1.3 | Listed in tasks only | missing in spec (findings 1, 4) |
| Ordered priority and stable ties — Secondary direction | 1.6 | Identifiers B, D, A, C | covered |
| Ordered priority and stable ties — Repeated column | 1.6 | `number asc, number desc` equals `number asc` | covered |
| Scalar and date comparison — Numeric not textual | 1.4 | `1, 2, 10` | covered |
| Scalar and date comparison — Strings and booleans | 1.4 | `A, a, b`; `false, true` | covered |
| Scalar and date comparison — Equal instants, cross-context Date | 1.4 | Secondary key decides; `vm.runInNewContext` precedent exists in `tests/queryBoundary.spec.ts` | covered |
| Missing values — Missing dates last in either direction | 1.5 | Valid dates first; missing rows stable | covered |
| Missing values — Zero is not missing | 1.5 | `2, 0, null, NaN` | covered |
| Fluent in-place sorting — Existing references | 1.1, 1.6 | Same table, array, row objects | covered |
| Fluent in-place sorting — Successive calls | 1.6 | Final order by period desc, ties keep previous order | covered |
| Empty criteria — Explicit empty list | 1.3 | `''`, `'   '`, `[]` no-op | covered |
| Empty criteria — Empty segments invalid | 1.3 | Five inputs fail before mutation | covered |
| Validate before mutation — Invalid secondary criterion | 1.3 | `orderBy:` and no mutation | covered (precedence: finding 6) |
| Validate before mutation — Unknown column on empty table | 1.3 | `Column absent not found` | covered |
| Validate before mutation — Unsupported argument type | 1.3, 2.2 | Runtime `orderBy:`; type-level rejection | partial (finding 3) |
| Documentation and integration | 1.7, 2.1, 2.2, 2.3 | README section; full suite; build; strict validate; diff review | covered |

## Ranked findings
| Done | # | Severity | Finding | Artifact |
| --- | --- | --- | --- | --- |
| [x] | 1 | High | The line between literal punctuation names and rejected SQL syntax is undefined | [spec](../specs/datatable-ordering/spec.md), [design](../design.md), [tasks](../tasks.md) |
| [x] | 2 | Medium | The existing column ordering in `DistributionProcessor` is not acknowledged and uses different rules | [design](../design.md) |
| [x] | 3 | Medium | Task 2.2's type-level acceptance and rejection check has no defined harness | [tasks](../tasks.md) |
| [x] | 4 | Medium | Grammar behavior promised in design and tasks is missing from the spec | [spec](../specs/datatable-ordering/spec.md) |
| [x] | 5 | Low | Overloads reject `string \| string[]` unions and readonly arrays | [design](../design.md) |
| [x] | 6 | Low | Validation edge cases: error precedence and sparse arrays | [spec](../specs/datatable-ordering/spec.md) |
| [x] | 7 | Low | The proposal says this "matches the conventions" of `select`, but empty segments are handled differently | [proposal](../proposal.md) |

## Resolution verification — 2026-11-09

| # | Resolution | Updated artifacts / acceptance evidence |
| --- | --- | --- |
| 1 | Chose literal-token lookup with no SQL syntax blacklist. Quotes, brackets, backticks, dots, hyphens, and parentheses remain part of the name; exact columns sort, absent names produce `Column <token> not found`. | [Spec — Punctuation tokens are literal names](../specs/datatable-ordering/spec.md#requirement-punctuation-tokens-are-literal-names), design Decision 2, tasks 1.3/1.7, proposal scope |
| 2 | Acknowledged `DistributionProcessor` ordering and deliberately retained its existing collation, date, missing-value, and native stability behavior. Aligning it would be a separate change. | Design Context / Decision 3, proposal scope, README task 1.7 |
| 3 | Defined the temporary root-level consumer file, generated-declaration import, exact local `tsc --noEmit --strict` command, positive calls, negative `@ts-expect-error` calls, required result, and file disposal. | [Tasks — Strict consumer check for task 2.2](../tasks.md#strict-consumer-check-for-task-22), design Migration Plan |
| 4 | Defined whitespace as JavaScript `\s`, added Unicode and single-token `desc`/`asc` scenarios, and supplied concrete rows/results for whitespace and selected-alias scenarios. | Spec — Criterion grammar and name resolution, design Decision 2, task 1.2 |
| 5 | Chose a comparator overload plus a `string \| readonly string[]` overload. The contract and strict consumer check cover mutable/readonly arrays, `as const` tuples, and string/array union settings; criteria arrays remain unchanged. | Spec — Three ordering call forms, design Decision 1, tasks 1.1/1.6/2.2 |
| 6 | Made whole-list syntax validation precede column lookup; valid lists resolve names left to right. Holes count as non-string elements. Added exact precedence and sparse-array scenarios. | Spec — Validate criteria before mutation / Validation errors have deterministic precedence, design Decision 2, task 1.3 |
| 7 | Reworded the proposal to similar string/array input forms and explicitly distinguished `select`'s empty-segment handling. | Proposal Why, README task 1.7 |

Validation after corrections: `openspec validate add-datatable-sql-order-by --strict` passed. The four planning artifacts were reconciled against all seven findings. Implementation tasks remain unchecked (0/10); no implementation source, README, package script, or persistent consumer fixture was changed. Runtime tests, build, and the consumer compilation remain apply-stage checks and were not run for these planning-only corrections.

## Review limitations
- No tests, build, or TypeScript compilation were run. This review only covers planning, so the code claims were checked by reading and searching.
- `dist/table/dataTable.d.ts` exists locally but is git-ignored and was not inspected, because it reflects the current build and not the planned API.
- The change has no external source task, so there was no cross-repository contract to check.
