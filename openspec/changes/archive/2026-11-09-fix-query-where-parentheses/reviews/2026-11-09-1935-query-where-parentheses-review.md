# Code Review — Query WHERE Parentheses

**Date:** 2026-11-09 19:35 (Europe/Moscow)
**Scope:** Implementation of active change `fix-query-where-parentheses`: working-tree changes to `src/query/selectQueryBuilder.ts`, the new untracked `tests/selectQueryBuilder.where.spec.ts`, and the WHERE composition section of `README.md`. Requirements, task completion, query models, provider forwarding, public exports, and related boundary/filter tests were inspected as supporting context.
**Revision:** HEAD `6e891441a3b1afae8ed9ab46233ffe0e776c84da`, with unstaged changes and untracked files; no staged diff. This review covers the working tree, not HEAD alone. Unrelated rounding implementation/documentation and the untracked order-by change are outside the review scope. Unrelated documentation changed during the review; the reviewed builder diff remained the same.

## Summary

**No findings.** The two changed concatenating branches wrap both the accumulated expression and the incoming fragment, retain lowercase operators and spacing, and preserve the specified left-associated call order. First-condition assignment, `where` replacement/reset, fluent identity, and the query-model shape remain unchanged.

The implementation meets the [query-conditions contract](../specs/query-conditions/spec.md). The [README](../../../../README.md#compose-where-conditions) documents the change in mixed-chain meaning, an explicit-fragment migration example, input limitations, and the separate major release. Parameters, filters, boundaries, and provider/JSON forwarding are covered by observable assertions.

The behavioral break is intentional: `where('a').whereOr('b').whereAnd('c')` now means `(a OR b) AND c`. Release notes, version preparation for `2.0.0`, explicit consumer upgrades, and coordinated replacement of frontend bundles and both backend resources remain the delivery obligations recorded in [tasks](../tasks.md#workflow-follow-up) and [design](../design.md#migration-plan). The existing `1.1.0` package metadata is deliberate at this implementation stage; the resulting local build must not be published as `1.1.0`. These pending delivery actions are not implementation regressions.

## Validation

Environment: Windows, Node `v22.23.2`, npm `10.9.8`, existing installed dependencies. No dependencies were installed.

| Check | Result |
| --- | --- |
| `npm test -- --runInBand --no-cache --coverage=false` | Passed: 12 suites, 315 tests, including all 15 WHERE regression cases. |
| `node node_modules/typescript/bin/tsc --noEmit` | Passed with the repository's strict TypeScript configuration. Jest alone uses `strict: false`. |
| `npm run build` in an isolated temporary source/configuration copy using the installed dependencies | Passed: ESM, UMD, IIFE, and declarations generated. Rollup reported four circular dependencies among unchanged table modules. Repository `dist/` was not rebuilt by this review. |
| In-memory Node smoke checks against the temporary bundles | Passed for ESM, UMD, and IIFE: public `SelectQueryBuilder` and `from()`, mixed chains, compound operands, fluent identity, clearing/restarting, source database, zero-valued parameters, filters, date boundaries, provider identity, serialized payload, and empty-table response. |
| Generated declarations | `dist/index.d.ts` exists; `where`, `whereAnd`, and `whereOr` retain their string argument and `SelectQueryBuilder` return type. |
| Final scoped diff | Only the two intended builder branches change; no public signature, request field, dependency, or version change accompanies this fix. |

The build copy was `C:/Users/MainGate/AppData/Local/Temp/basys-fx-where-review-ea797ac2bcb64eee81b03b76ff31d14d`. The ESM smoke check imported the generated bundle through a data URL; UMD used Node `require`, and IIFE used an isolated VM context. This verifies bundle exports and behavior, not npm publication or consumer package resolution. Temporary global provider/database assignments were restored after the checks.

The sandbox command runner failed before starting commands; validation succeeded using the permitted runner outside that sandbox. No validation command failed on the reviewed implementation. Full-suite and build results reflect the combined current source tree, including unrelated rounding work; that work is not independently reviewed here.

The referenced external archived backend task file was readable, and its scope explicitly defers BaSYS.FX client composition. No backend implementation, live SQL/RLS behavior, deployed browser, embedded backend engine, or coordinated rollout was verified. No coverage percentage was measured. The historical pre-fix failing test run marked in tasks was not independently replayed.

## Findings

No findings in the reviewed implementation.

## Test coverage

The [WHERE suite](../../../../tests/selectQueryBuilder.where.spec.ts) asserts exact strings for compound operands on both sides of AND, compound OR operands, both mixed-chain orders, repeated AND/OR, the migration fragment, first conditions through both methods, clearing, replacement, and retention of whitespace/existing parentheses.

State assertions check fluent return identity and preservation of the model, selected fields, source, pagination, display flag, sorting, grouping, HAVING, parameters, filters, and boundaries. The provider test checks the actual forwarded model and its JSON representation, retained auxiliary fields, and the returned empty table. Tests create independent builders and inject their provider; the new suite does not assign provider/database globals.

The committed-style suite imports implementation modules directly. The separate review smoke checks exercised exports from all three generated public bundles, including `from()` with a mocked global provider. Missing/rejected-provider cases are not added by this change, whose execution path is unchanged. Empty/null/undefined composition inputs are expressly outside the agreed contract, apart from `where('')` reset; absence of new validation tests for them is consistent with scope. No material contract coverage gap was identified.

Reviewed file fingerprints (SHA-256):

- `src/query/selectQueryBuilder.ts`: `BD504772079842B05B94E41B3E4C451BCDFB18E0EC9366B79B95A22BA7986138`
- `tests/selectQueryBuilder.where.spec.ts`: `B151BF98BD3355923599D5D6212F7E711C5374055FCB408B8724C9540941549F`

## Ranked findings

| Done | # | Severity | Finding | File |
| --- | --- | --- | --- | --- |
| | | | No findings | |
