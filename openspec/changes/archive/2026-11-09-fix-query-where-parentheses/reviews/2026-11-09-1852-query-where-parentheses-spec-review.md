# Spec Review — query-where-parentheses

**Date:** 2026-11-09 18:52 (Europe/Moscow)
**Change and scope:** `fix-query-where-parentheses` — full package: proposal, delta spec `query-conditions`, design, tasks
**BaSYS.FX revision:** HEAD `ba9ce5632c3cff083a876a925b6bc0b4cde87aa9`; working tree contains only the untracked artifacts of this change (`proposal.md`, `design.md`, `specs/`, `tasks.md`); no source or test changes.
**Reviewed sources:** [proposal](../proposal.md), [query-conditions spec](../specs/query-conditions/spec.md), [design](../design.md), [tasks](../tasks.md), [.openspec.yaml](../.openspec.yaml), [main query-boundaries spec](../../../specs/query-boundaries/spec.md), [selectQueryBuilder.ts](../../../../src/query/selectQueryBuilder.ts), [selectQueryModel.ts](../../../../src/query/selectQueryModel.ts), [queriesProvider.ts](../../../../src/query/queriesProvider.ts), [boundaries tests](../../../../tests/selectQueryBuilder.boundaries.spec.ts), [withFilters tests](../../../../tests/selectQueryBuilder.withFilters.spec.ts), [README.md](../../../../README.md), [1.1.0 release notes](../../../../docs/relises/1.1.0.md), [package.json](../../../../package.json), [tsconfig.json](../../../../tsconfig.json), [jest.config.js](../../../../jest.config.js). External: backend change [tasks.md](../../../../../BaSysApp/BaSYS.DevDocs/openspec/changes/archive/2026-11-04-fix-query-where-parentheses-and-sql-errors/tasks.md) and [design.md](../../../../../BaSysApp/BaSYS.DevDocs/openspec/changes/archive/2026-11-04-fix-query-where-parentheses-and-sql-errors/design.md), [jsSource.resx](../../../../../BaSysApp/BaSys.Back/src/BaSys.EvalEngine/jsSource.resx), [FX stage 2.3 task](../../../../../BaSysApp/BaSYS.DevDocs/openspec/changes/add-records-moment-boundaries/tasks/2026-11-07-2155-fx-records-moment-stage-2-3-boundary-helpers-task.md).

## Verdict
**Readiness:** Ready after corrections.

The library contract is coherent and implementable as written. The proposal, spec, design and tasks describe the same change: wrap both operands, use left-associated nesting, store the first condition verbatim, and leave `where` as replacement. Every factual claim about the current code was confirmed. The tasks give full traceability and executable checks. No finding blocks the code change in `selectQueryBuilder.ts`. The corrections concern delivery and documentation. The plan marks the change as **BREAKING**, but it does not say which release carries it or how it reaches the runtimes that execute user scripts. Two of those runtimes use embedded copies of the old code.

## Automated checks
| Check | Result |
| --- | --- |
| OpenSpec status | `spec-driven`; proposal, specs, design, tasks — `done`; `isPlanningComplete: true` |
| OpenSpec validate --strict | `Change 'fix-query-where-parentheses' is valid` |
| Baseline `npm test -- --runInBand` | 10 suites, 259 tests passed (HEAD, no implementation yet) |
| Command form from task 1.1 | `npm test -- --runInBand tests/selectQueryBuilder.boundaries.spec.ts` resolves the path pattern on Windows (20 tests passed), so the focused command in tasks 1.1–2.1 is usable |

## Findings

### 1. Release vehicle and release note for the BREAKING behavior are undefined [Medium]
- **Location:** [proposal.md](../proposal.md) "What Changes" (BREAKING, out of scope); [design.md](../design.md) "Migration Plan"; [tasks.md](../tasks.md) 2.2
- **Issue:** The proposal calls mixed-chain regrouping a breaking change. It also excludes "npm publishing or version changes", and task 2.2 must confirm that no version bump happened. `package.json` already reads `1.1.0`, the version prepared for the boundaries release. Per the external stage 2.3 record, that release is pinned to revision `edabb45` and has not been published. After implementation, the working tree would still read `1.1.0` but would behave differently from the pinned `1.1.0` artifact. Nothing in the plan records which version must carry the fix, whether a breaking behavior change in a `1.x` minor or patch release is acceptable under semver for consumers on `^1.0.6`, or whether [docs/relises](../../../../docs/relises/1.1.0.md) receives an entry. Without that, the fix could ship unannounced, or under a version string that no longer identifies a single build.
- **Evidence:** proposal: "Out of scope: … npm publishing or version changes"; task 2.2: "confirm no … version bump"; [package.json](../../../../package.json) line 3 `"version": "1.1.0"`; `npm view` lists published versions only up to `1.0.6`; stage 2.3 task §8: "Ревизия BaSYS.FX для публикации: `edabb452…`" (revision to publish). Frontend apps depend on `"@basysteam/basys-fx": "^1.0.6"`.
- **Recommendation:** In the proposal or design, state which release carries the fix: a version after the pinned `1.1.0`, or `1.1.0` re-pinned. Record the semver decision for the BREAKING marker. Decide whether the release-notes file gets an item, either in this plan or as an explicit follow-up for `bs-release-note-item`. The version bump and publishing can remain the owner's separate action. The plan should make the gap visible rather than leave it implicit.

### 2. Runtime consumers and environment divergence are not described [Medium]
- **Location:** [proposal.md](../proposal.md) "Impact"; [design.md](../design.md) "Context", "Migration Plan"
- **Issue:** The plan treats the npm package as the only carrier of `whereAnd` / `whereOr`. The backend script engine embeds two copies of the library in `jsSource.resx`, resources `BaSysFX` and `BaSysFXmodule`. Both still contain the ungrouped concatenation. The frontend bundles under `BaSys.Host/wwwroot` are built from the npm package `1.0.6`. After this change ships and the frontend upgrades, the same user script would produce `((a) or (b)) and (c)` in the browser but `a or b and c` in server-side evaluation, until someone re-syncs the resx copies. The skill requires a cross-repository change to describe compatibility and delivery order, and to separate the library's obligations from server and frontend work. The proposal says only "Server-side RLS remains a separate responsibility".
- **Evidence:** [jsSource.resx](../../../../../BaSysApp/BaSys.Back/src/BaSys.EvalEngine/jsSource.resx) lines 1431 and 1440 (`BaSysFX`, starting at line 120), and lines 3010 and 3019 (`BaSysFXmodule`, starting at line 1699): ``this.model.whereExpression += ` and ${whereExpression}`;`` / `` ` or ${whereExpression}` ``. The shared-modules requirements document in DevDocs refers to "обновлением его копии в `jsSource.resx`" ("updating its copy in `jsSource.resx`"). The backend design says server wrapping "группировка нескольких вызовов внутри этой строки не меняется" ("does not change the grouping of several calls within that string").
- **Recommendation:** In Impact or Migration Plan, list the dependent carriers: the frontend SPAs through npm, and the two `jsSource.resx` resources through a manual copy. State that the grouping takes effect per runtime only after each carrier is updated, and give the intended order, for example both in one rollout to avoid divergence. Keep this work out of this repository's tasks and reference it as an external follow-up.

### 3. Handling of empty, null and undefined fragments is only in design and diverges from the backend [Low]
- **Location:** [design.md](../design.md) Decision 3; [query-conditions spec](../specs/query-conditions/spec.md)
- **Issue:** Design decides that an empty incoming fragment stays accepted. With the new wrapper, `where('a').whereAnd('')` yields `(a) and ()`. `whereAnd(undefined)` yields `(a) and (undefined)`. The spec has no requirement or scenario for these inputs, so they are not part of the contract. The cited backend change chose the opposite policy, leaving the expression unchanged when the fragment is empty, specifically to avoid `AND ()`. The old client output (`a and `) was already invalid, so this is not a regression, but the divergence is undocumented where readers look for the contract.
- **Evidence:** design: "An empty incoming fragment remains accepted and can still yield invalid SQL"; the backend design.md Decision 1 says that if the appended fragment is empty or `null`, the expression does not change, otherwise `AND ()` would appear.
- **Recommendation:** Either add a spec statement that empty, `null` and `undefined` fragments are outside the contract, with a note in the README, or add a scenario that fixes the current output. Mention the deliberate difference from the backend's skip policy in the design.

### 4. One THEN clause cannot be checked by the planned tests [Low]
- **Location:** [query-conditions spec](../specs/query-conditions/spec.md), scenario "Repeated AND keeps every operand"
- **Issue:** "**AND** its logical meaning remains the conjunction of all three conditions" cannot be observed in Jest. Design rules out an SQL evaluator, and the exact string in the first THEN already implies the meaning. The extra clause adds an acceptance condition with no verification step.
- **Evidence:** design Decision 4: "No new test runner or SQL evaluator is needed."
- **Recommendation:** Drop the clause or rephrase it as rationale outside the scenario.

## Verified claims

- `whereAnd` / `whereOr` check truthiness and then append `` ` and ${…}` `` / `` ` or ${…}` ``. `where` assigns the value directly, and every method returns `this` ([selectQueryBuilder.ts](../../../../src/query/selectQueryBuilder.ts) lines 40–63).
- `SelectQueryModel.whereExpression` is a string initialized with `|| ''` ([selectQueryModel.ts](../../../../src/query/selectQueryModel.ts) line 33). `query()` passes `this.model` to `provider.execute` unchanged (line 223).
- The planned mock response `{ isOK: true, data: { columns: [], rows: [] } }` takes the success path without `console.error`, because empty arrays are truthy (lines 226–238).
- No other code in this repository composes WHERE text. `withFilters` and the boundary methods only push objects. The main `query-boundaries` spec stays compatible: boundaries do not change the condition, and that is still tested at [boundaries tests](../../../../tests/selectQueryBuilder.boundaries.spec.ts) line 160.
- No WHERE composition tests exist yet. `tests/selectQueryBuilder.where.spec.ts` does not exist, which matches task 1.1.
- The new public API, exports, declarations and request fields are unchanged. `npm run build` runs Rollup with `strict: true` from `tsconfig.json`, so task 2.2 provides the strict type check that ts-jest (`strict: false`) does not.
- The delta spec's `## Purpose` block follows the precedent of the archived `query-boundaries` delta.

## Requirements traceability
| Requirement / Scenario | Tasks | Test / validation | Status |
| --- | --- | --- | --- |
| query-conditions: Concatenation groups both operands — AND over existing disjunction | 1.1, 1.2 | Exact `(rd_code = 65 OR rd_code = 66) and (project = @project)` | covered |
| — AND groups a new disjunction | 1.1, 1.2 | Exact `(project = @project) and (rd_code = 65 OR rd_code = 66)` | covered |
| — OR groups both compound operands | 1.1, 1.2 | Exact `(a = 1 AND b = 2) or (c = 3 AND d = 4)` | covered |
| — Existing formatting retained | 1.3 | Exact `( (a = 1 OR b = 2) ) and ( c = 3 )` | covered |
| query-conditions: Successive calls in call order — OR then AND / AND then OR | 1.1, 1.2 | Exact nested strings for both orders | covered |
| — Repeated AND | 1.1, 1.2 | Exact `((a = 1) and (b = 2)) and (c = 3)`; "logical meaning" clause not testable (finding 4) | partial |
| query-conditions: First condition stored verbatim — either method | 1.3 | `whereAnd` and `whereOr` on a new query keep `a = 1 OR b = 2` | covered |
| — Cleared condition restarted | 1.3 | `where('')` then `whereOr` gives `b = 2` | covered |
| query-conditions: where replaces the accumulated condition | 1.3 | Exact `(c = 3 OR d = 4) and (e = 5)` | covered |
| query-conditions: Condition methods preserve fluent state | 1.3 | Same builder from all three methods; source, select, parameter, filter, boundary unchanged | covered |
| query-conditions: Execution forwards the grouped condition | 2.1 | Mock provider receives `(a = 1 OR b = 2) and (c = @c)`; JSON serialization; parameters, filters, boundaries retained | covered |
| Documentation and compatibility (proposal) | 1.4, 2.2 | README section checked against regression cases; full Jest suite, build and diff inspection | partial — release vehicle and runtime carriers not covered (findings 1, 2) |

## Ranked findings
| Done | # | Severity | Finding | Artifact |
| --- | --- | --- | --- | --- |
| [ ] | 1 | Medium | Release vehicle and release note for the BREAKING behavior are undefined | [proposal.md](../proposal.md) |
| [ ] | 2 | Medium | Runtime consumers (`jsSource.resx` copies, frontend npm) and environment divergence not described | [proposal.md](../proposal.md), [design.md](../design.md) |
| [ ] | 3 | Low | Handling of empty, null and undefined fragments is only in design and diverges from the backend | [design.md](../design.md), [spec](../specs/query-conditions/spec.md) |
| [ ] | 4 | Low | Untestable "logical meaning" THEN clause | [spec](../specs/query-conditions/spec.md) |

## Review limitations
- User scripts that rely on mixed `whereAnd` / `whereOr` chains are stored in application metadata, not in source code. Their number and location could not be assessed. A search of `BaSys.Front` source found no direct calls; only built bundles contain the library.
- The publication status of `1.1.0` comes from the DevDocs stage 2.3 record and `npm view`. Owner decisions about the next version were not available.
- Build outputs were not produced, as the review scope requires. The planned `npm run build` step was assessed from configuration only.
