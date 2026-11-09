# Proposal

## Why

`SelectQueryBuilder.whereAnd` and `whereOr` concatenate SQL fragments without parentheses, so SQL operator precedence can change the intended meaning of chained conditions. The backend change archived as `2026-11-04-fix-query-where-parentheses-and-sql-errors` explicitly deferred this BaSYS.FX defect; client-side composition still needs its own fix.

## What Changes

- Group both operands on every `whereAnd` / `whereOr` concatenation: `(<left>) and (<right>)` or `(<left>) or (<right>)`. Each call combines the entire accumulated condition with the new fragment.
- Preserve the first condition verbatim when no condition exists, the replacement behavior of `where`, fluent return values, and the existing query-model shape.
- **BREAKING**: Mixed operator chains will follow call order instead of implicit SQL precedence. For example, `where('a').whereOr('b').whereAnd('c')` will produce `((a) or (b)) and (c)`, replacing `a or b and c`. Scripts that require the old grouping must express it explicitly in their fragments.
- Add regression coverage for compound operands, mixed chains, first conditions, replacement, and provider forwarding; document the composition contract and compatibility impact.
- Out of scope: backend RLS enforcement and SQL errors, Update/Delete builders in other repositories, SQL parsing or validation, changes to empty-fragment handling, and npm publishing or version changes.

## Capabilities

### New Capabilities

- `query-conditions`: Composition and replacement of SELECT WHERE conditions through the fluent client query builder.

### Modified Capabilities

None. The existing `query-boundaries` specification covers boundary data and its isolation from user conditions, not WHERE composition; its requirements remain unchanged.

## Impact

- Implementation: `src/query/selectQueryBuilder.ts`; `SelectQueryModel.whereExpression` remains a string and `query()` continues passing the model to `IQueriesProvider.execute`.
- Tests: a focused Jest suite under `tests/selectQueryBuilder.where.spec.ts`, alongside the existing filter and boundary suites.
- Documentation: query-composition examples and migration guidance in `README.md`.
- No new dependencies or request fields. Single conditions and AND-only chains retain their logical meaning; concatenated strings gain parentheses. Server-side RLS remains a separate responsibility.
