# Proposal

## Why

`SelectQueryBuilder.whereAnd` and `whereOr` concatenate SQL fragments without parentheses, so SQL operator precedence can change the intended meaning of chained conditions. The backend change archived as `2026-11-04-fix-query-where-parentheses-and-sql-errors` explicitly deferred this BaSYS.FX defect; client-side composition still needs its own fix.

## What Changes

- Group both operands on every `whereAnd` / `whereOr` concatenation: `(<left>) and (<right>)` or `(<left>) or (<right>)`. Each call combines the entire accumulated condition with the new fragment.
- Preserve the first condition verbatim when no condition exists, the replacement behavior of `where`, fluent return values, and the existing query-model shape.
- **BREAKING**: Mixed operator chains will follow call order instead of implicit SQL precedence. For example, `where('a').whereOr('b').whereAnd('c')` will produce `((a) or (b)) and (c)`, replacing `a or b and c`. Scripts that require the old grouping must express it explicitly in their fragments.
- Add regression coverage for compound operands, mixed chains, first conditions, replacement, and provider forwarding; document the composition contract and compatibility impact.
- Release target: `2.0.0`, a separate major release after the pinned boundaries release `1.1.0`. The **BREAKING** behavior will not ship as a `1.x` minor or patch, or by re-pinning `1.1.0`; consumers on `^1.0.6` must explicitly upgrade to the new major.
- Out of scope: backend RLS enforcement and SQL errors, Update/Delete builders in other repositories, SQL parsing or validation, changes to empty-fragment handling, and release execution (version bump, npm publishing, and consumer deployment). Release notes and rollout are explicit follow-ups below.

## Capabilities

### New Capabilities

- `query-conditions`: Composition and replacement of SELECT WHERE conditions through the fluent client query builder.

### Modified Capabilities

None. The existing `query-boundaries` specification covers boundary data and its isolation from user conditions, not WHERE composition; its requirements remain unchanged.

## Impact

- Implementation: `src/query/selectQueryBuilder.ts`; `SelectQueryModel.whereExpression` remains a string and `query()` continues passing the model to `IQueriesProvider.execute`.
- Tests: a focused Jest suite under `tests/selectQueryBuilder.where.spec.ts`, alongside the existing filter and boundary suites.
- Documentation: query-composition examples and migration guidance in `README.md`.
- Release-owner follow-up: use `bs-release-note-item` to add the breaking change, old/new grouping examples, and migration advice to `docs/relises/2.0.0.md` before publishing `2.0.0`. Preserve the boundaries release's `1.1.0` notes and pinned revision `edabb452961d95deecc1660f55c1f4f10fb2ce9c`; release preparation must assign the fixed build its own version and revision.
- Runtime carriers: frontend SPAs consume the npm package and deploy rebuilt bundles under `BaSys.Host/wwwroot`; backend script evaluation embeds manual copies in the `BaSysFX` and `BaSysFXmodule` resources of `BaSys.Back/src/BaSys.EvalEngine/jsSource.resx`. Each runtime adopts the fix only when its carrier is updated. External frontend/backend owners must deliver both carriers from the same `2.0.0` revision in one coordinated rollout, as described in the design; this repository does not update those consumers.
- No new dependencies or request fields. Single conditions and AND-only chains retain their logical meaning; concatenated strings gain parentheses. Server-side RLS remains a separate responsibility.
