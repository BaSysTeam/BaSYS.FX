# Code Review — DataTable SQL-like orderBy

**Date:** 2026-11-09 20:26 (Europe/Moscow)
**Scope:** Implementation of active change `add-datatable-sql-order-by`: `src/table/dataTable.ts`, `tests/dataTable.orderBy.spec.ts`, and the ordering section in `README.md`. Requirements were read from the current proposal, design, delta spec, and completed tasks. Related column, distribution, export, and build code was inspected for context.
**Revision:** HEAD `09758beb2d685e405956fad2ee8abd5d834c6ac9`; working tree clean at review start and after validation, before this report was created. The implementation diff is `HEAD~1..HEAD`; HEAD contains all reviewed source changes.

## Summary

No findings. The implementation matches the change's supported contract. Existing comparator calls retain the native in-place sort branch. The new overload accepts string and readonly-array criteria, validates the full syntax before column lookup, and completes validation before sorting. Literal column lookup, whitespace handling, error precedence, missing-last placement, scalar/date comparisons, and independent successive calls agree with the specification.

Declarative sorting preserves table, row-array, row-object, and column identities. Its final original-index comparison guarantees stable ties independently of native sort stability. The new functionality is available through the public entry point and all three generated bundle formats. No dependency, package-version, query-model, or distribution behavior changes were introduced by the implementation diff.

The earlier spec review in this directory describes an older planning revision. Its comments were not treated as current implementation defects; this review used the current artifacts.

## Validation

Environment: Windows, Node.js `v22.23.2`, npm `10.9.8`, installed repository dependencies. No dependencies were installed.

| Check | Command or method | Result |
| --- | --- | --- |
| Revision and working copy | `git rev-parse HEAD`, `git status --short`, `git diff`, `git diff --cached`, `git diff HEAD~1 HEAD` | Reviewed committed implementation; no pre-existing working-copy changes. |
| Full regression suite | `npm test -- --runInBand --no-cache --coverage=false` | Passed: 13 suites, 351 tests, including 34 ordering tests. |
| Strict source type check | `node node_modules/typescript/bin/tsc --noEmit` | Passed with no diagnostics. Checked separately because Jest uses `strict: false`. |
| Isolated build | `node <original-root>/node_modules/rollup/dist/bin/rollup -c`, with the temporary copy as the working directory | Passed; emitted ESM, UMD, IIFE, and declarations. This directly invokes the same Rollup command as the build script. Existing circular imports between DataTable and its processors produced warnings. |
| Generated signatures | Inspected temporary `dist/table/dataTable.d.ts` | Both comparator and `string \| readonly string[]` overloads are present. |
| Strict consumer | `node <original-root>/node_modules/typescript/bin/tsc --noEmit --strict --target ES6 --lib ES2017,DOM --module commonjs --moduleResolution node .order-by-consumer-check.ts` | Passed with no diagnostics using the exact TypeScript fixture from [task 2.2](../tasks.md). Contextual callback typing, mutable/readonly arrays, tuples, and genuinely unnarrowed unions compile; negative calls remain errors. |
| Public bundle API | Temporary Node assertion harness against UMD exports, ESM exports, and IIFE `BaSYSFX` | Passed comparator/declarative calls, frozen arrays, return/array identity, validation precedence, and cross-context dates with missing values. ESM output was copied to an `.mjs` file for Node loading. |
| Additional numeric boundaries | UMD and ESM public API harness | Passed infinity, negative infinity, stable signed-zero ties, and missing NaN/null ordering. |
| Stability without native stable sort | IIFE in an isolated VM with a deliberately unstable selection-sort replacement for `Array.prototype.sort` | Passed ascending and descending tie-order assertions. The replacement was confined to the disposable VM. |

Builds and temporary consumers were created under the OS temporary directory with access to installed dependencies; both temporary copies were removed. The repository's existing `dist/` was not rebuilt or modified. No source or test fixtures were added or edited.

An initial IIFE harness supplied column-description objects from the host context and hit the existing `addColumn` cross-context `instanceof Object` restriction. Re-running the harness with descriptions constructed inside the IIFE context passed. That setup issue is outside the orderBy change and is not a new finding. The normal sandbox launcher also initially failed before executing commands; validation subsequently ran successfully through the approved execution path.

Limitations: no actual browser or embedded host was exercised; VM tests validate the relevant context and stability behavior but do not certify every host. Coverage percentages were not measured. The OpenSpec CLI validator was not rerun because this was an implementation review and planning artifacts were unchanged. Mixed runtime value types and arbitrary objects are outside the declared comparison contract. SQL execution and provider behavior are outside this in-memory change's scope.

## Findings

No findings in the reviewed implementation.

## Test coverage

The [focused suite](../../../../tests/dataTable.orderBy.spec.ts) contains 34 tests covering all three call forms, frozen/readonly criteria, Unicode and punctuation names, exact case, selected aliases, whitespace and direction casing, numeric/textual/boolean/date comparisons, cross-context and equal-instant dates, missing values in both directions, secondary keys, repeated criteria, stable ties, successive calls, no-ops, and zero/one-row tables.

Validation tests assert Error type, message or prefix, unchanged row order, row-array and row-object identity, column identity, and cell values. Successful in-place tests check concrete results and reference preservation. Inputs with trailing or repeated commas, blank entries, invalid directions, embedded array-element commas, non-string entries, sparse holes, unsupported argument types, and unknown columns are covered. Syntax-before-lookup and first-unknown-column precedence have explicit assertions.

The suite imports DataTable directly. Public exports and generated declarations were checked separately during this review. Runtime union examples in Jest are narrowed by initialization; the separate strict consumer fixture checks unnarrowed function parameters and therefore validates the actual union contract. Native Node sort stability alone cannot prove the legacy-runtime guarantee, so the temporary unstable-sort harness supplied that additional check.

No provider or global state is changed by the focused suite; foreign dates are created in separate VM contexts. The review-only unstable-sort replacement was similarly isolated. Optional future regression additions include a retained public-entry-point case, foreign invalid dates, and the unstable-sort case currently exercised only by the review harness. These are incremental coverage opportunities, not confirmed implementation defects.

## Ranked findings

| Done | # | Severity | Finding | File |
| --- | --- | --- | --- | --- |
| — | — | — | No findings | — |