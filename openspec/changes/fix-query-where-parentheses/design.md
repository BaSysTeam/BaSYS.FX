# Design

## Context

See [proposal.md](proposal.md) for motivation and [query-conditions](specs/query-conditions/spec.md) for the behavior contract.

In `src/query/selectQueryBuilder.ts`, `whereAnd` and `whereOr` independently check whether `model.whereExpression` is truthy, then append an operator and the supplied text. `where` assigns the text directly. `SelectQueryModel` initializes a missing condition to `''`; `query()` passes the model directly to `IQueriesProvider.execute`.

`withFilters` stores separate filter objects; boundary methods store separate boundary objects. Neither builds WHERE SQL in this repository. Existing Jest suites cover filters and boundaries but not WHERE composition. `openspec/specs/query-boundaries/spec.md` requires boundaries to leave the user condition alone, which is compatible with this change.

The external source is `D:/_WORK/BaSysProject/REPO/BaSysApp/BaSYS.DevDocs/openspec/changes/archive/2026-11-04-fix-query-where-parentheses-and-sql-errors/tasks.md`, sections 2, 5, and 6. It explicitly leaves client composition for a separate repository change. This plan does not assert that a client-only change proves or replaces server RLS enforcement.

## Goals / Non-Goals

**Goals:**

- Make the grouping depend on complete operands and fluent call order, using the existing string model.
- Keep the change local to the two methods that actually concatenate WHERE fragments.
- Make the compatibility impact visible through examples and regression tests at the provider boundary.

**Non-Goals:**

- Introduce a SQL AST, inspect fragment syntax, remove redundant parentheses, or normalize whitespace.
- Add a new public helper, model method, overload, flag, request field, or dependency.
- Move filters or boundaries into the client WHERE string or change their server interpretation.

## Decisions

### 1. Wrap both operands in the existing builder methods

In each existing non-empty branch, replace the append operation with an assignment that wraps the old expression and the incoming fragment individually. Keep lowercase `and` / `or` and one surrounding space, matching the library's current operator formatting. Retain each empty-state assignment branch and the return of `this`; leave `where` unchanged.

This is two localized changes and avoids extending the exported API. A shared helper was considered but adds indirection to two short branches without a current third caller. Moving concatenation into `SelectQueryModel` would add responsibility and potentially public surface to a data model. Wrapping only the accumulated expression would leave an incoming OR fragment able to escape an AND, so both sides must be wrapped.

### 2. Use nested grouping in fluent call order

Do not flatten the accumulated expression or infer operator precedence. For example:

| Fluent calls | Result |
| --- | --- |
| `where('a').whereAnd('b OR c')` | `(a) and (b OR c)` |
| `where('a').whereOr('b').whereAnd('c')` | `((a) or (b)) and (c)` |
| `where('a').whereAnd('b').whereOr('c')` | `((a) and (b)) or (c)` |

Preserving SQL precedence across separate calls would retain the reported defect and require a different composition contract. Scripts can still choose grouping inside one fragment, for example `where('a').whereOr('b AND c')` for the previous meaning of `a OR b AND c`.

### 3. Preserve existing input policy and transport

Use the existing truthiness check for accumulated state. Do not trim, skip, reject, or parse incoming fragments. An empty incoming fragment remains accepted and can still yield invalid SQL when appended to a non-empty condition; this change adds grouping, not input validation. Existing whitespace and parentheses stay inside the added wrappers.

Do not change `SelectQueryModel`, its constructor, `query()`, or `IQueriesProvider`. The provider already receives `whereExpression` as a string. Formatting at serialization or execution time instead would delay the correction and leave the public builder model with an ambiguous condition.

### 4. Verify the observable condition and provider payload

Add `tests/selectQueryBuilder.where.spec.ts` using the existing builder-test conventions. Cover the spec scenarios with exact string expectations, including both compound operands, both mixed-chain orders, repeated AND and OR, first calls through either method, replacement and clearing, existing parentheses and whitespace, and unchanged fluent state.

Use a provider mock that returns a minimal successful empty table response (`{ isOK: true, data: { columns: [], rows: [] } }`) to exercise `query()`. Assert the grouped string on the received model and its JSON serialization, and verify that parameters, filters, and boundaries survive unchanged. No live backend is required: this repository owns the model payload, not final SQL execution or RLS.

Run the focused suite, the complete Jest suite, and the existing Rollup build during implementation. No new test runner or SQL evaluator is needed.

## Risks / Trade-offs

- [Mixed chains can select a different set of rows] -> Mark the behavioral break in the proposal and README, show the old and new expressions, and explain how to preserve a chosen grouping inside one fragment.
- [Exact string consumers see additional parentheses, even for AND-only chains] -> Specify the output and add regression expectations. No model schema change is required.
- [Already grouped inputs gain redundant parentheses] -> Preserve them deliberately; avoiding them safely would require SQL parsing beyond this change.
- [Long chains create deeper nesting] -> Accept linear growth in expression length and depth; no new parsing or flattening is introduced.
- [Client grouping could be mistaken for a security boundary] -> Keep backend RLS and backend verification outside this plan and describe the fix as client condition composition.

## Migration Plan

Implement the builder change, regression tests, and README guidance together. Validate the package with its existing commands. Version selection and publishing remain a separate release action.

When upgrading consumers, inspect mixed `whereAnd` / `whereOr` chains that relied on implicit SQL precedence. Express the desired compound operand explicitly, such as `where('a').whereOr('b AND c')`. Single fragments remain untouched. Reverting the implementation would restore ambiguous composition, so rollback should also account for any consumer edits made for the new contract.
