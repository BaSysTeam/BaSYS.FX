# Design

## Context

See [proposal.md](proposal.md) for motivation and [query-conditions](specs/query-conditions/spec.md) for the behavior contract.

In `src/query/selectQueryBuilder.ts`, `whereAnd` and `whereOr` independently check whether `model.whereExpression` is truthy, then append an operator and the supplied text. `where` assigns the text directly. `SelectQueryModel` initializes a missing condition to `''`; `query()` passes the model directly to `IQueriesProvider.execute`.

`withFilters` stores separate filter objects; boundary methods store separate boundary objects. Neither builds WHERE SQL in this repository. Existing Jest suites cover filters and boundaries but not WHERE composition. `openspec/specs/query-boundaries/spec.md` requires boundaries to leave the user condition alone, which is compatible with this change.

The external source is `D:/_WORK/BaSysProject/REPO/BaSysApp/BaSYS.DevDocs/openspec/changes/archive/2026-11-04-fix-query-where-parentheses-and-sql-errors/tasks.md`, sections 2, 5, and 6. It explicitly leaves client composition for a separate repository change. This plan does not assert that a client-only change proves or replaces server RLS enforcement.

BaSYS.FX also executes inside the backend: `BaSys.Back/src/BaSys.EvalEngine/jsSource.resx` contains two manually embedded library resources, `BaSysFX` and `BaSysFXmodule`, both still using ungrouped concatenation at review time. Frontend SPAs in `BaSys.Front` depend on `@basysteam/basys-fx` through npm (`^1.0.6` at review time), and their built bundles are delivered through `BaSys.Host/wwwroot`. Updating this library alone does not update any of those runtime copies. Server SQL wrapping operates on the string already produced by the script and cannot repair grouping inside it.

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

Use the existing truthiness check for accumulated state. Do not trim, skip, reject, or parse incoming fragments. The composition contract covers non-empty SQL fragment strings; empty incoming fragments (`''`), `null`, and `undefined` are outside it, while `where('')` remains a supported reset. Existing whitespace and parentheses stay inside the added wrappers.

This preserves the current lack of validation rather than promising useful output for invalid inputs: appending `''` to `a` will form `(a) and ()`, and JavaScript callers passing `undefined` can form `(a) and (undefined)`. These are implementation consequences, not supported SQL or additional acceptance scenarios. The archived backend change deliberately skips empty or `null` fragments in its C# condition builder. BaSYS.FX does not adopt that policy in this fix; aligning validation or skip behavior would be a separate contract change. The README must make this distinction visible and tell callers to supply non-empty fragments.

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
- [Runtime copies use different grouping during deployment] -> Prepare frontend npm bundles and both backend resource copies from the same release revision and deploy them together; verify the same mixed-chain expression in every runtime before reopening script execution.

## Migration Plan

### Library work and release identity

Implement the builder change, regression tests, and README guidance together, and validate the package with its existing commands. This change's release target is `2.0.0`: the mixed-chain behavior is breaking, so a `1.x` minor or patch is not the delivery vehicle. The boundaries release `1.1.0` remains pinned to `edabb452961d95deecc1660f55c1f4f10fb2ce9c` in the external stage 2.3 record; do not re-pin it or publish the fixed working tree as `1.1.0`. Existing boundaries-release prerequisites remain in force.

Version bump and npm publication are separate release-owner actions. Before publishing, the owner must use `bs-release-note-item` to add an entry to `docs/relises/2.0.0.md` describing the breaking grouping change, examples of the previous and new results, and migration guidance. The owner must update package version metadata to `2.0.0` and record the release revision and bundle checksum so npm and embedded copies can be traced to the same build. Neither publishing nor changing package versions is part of this implementation's tasks.

### External runtime delivery order

The following work belongs to release, frontend, and backend owners in `BaSysApp`; it is a delivery dependency, not additional implementation work in this repository:

1. Review affected stored scripts and prepare any required grouping edits before upgrading a runtime. Prepare and publish the validated `2.0.0` package from the recorded release revision after its release notes are ready. Publishing alone does not activate the new behavior in deployed runtimes.
2. Frontend owners must explicitly update the npm dependency range from `^1.0.6` to the new major (for example, `^2.0.0`), lock the initial rollout to `2.0.0`, rebuild the consuming SPAs, and prepare their `BaSys.Host/wwwroot` bundles. Backend owners must refresh **both** `BaSysFX` and `BaSysFXmodule` resources in `BaSys.Back/src/BaSys.EvalEngine/jsSource.resx` from the matching `2.0.0` build; updating server SQL composition alone is insufficient.
3. Deploy the prepared backend resources and frontend bundles in one coordinated rollout. If the deployment cannot replace both together, keep user-script execution paused until both are updated; a backend-first or frontend-first interval would otherwise give the same script different grouping. Verify `where('a').whereOr('b').whereAnd('c')` produces `((a) or (b)) and (c)` in the browser and in both backend script contexts before resuming execution. Record the deployed package version, revision, and resource/bundle provenance in the external delivery record.

The library fix is effective separately in each runtime only after that runtime's carrier has been updated. These external actions remain pending even when this repository's implementation tasks are complete.

When upgrading consumers, inspect mixed `whereAnd` / `whereOr` chains that relied on implicit SQL precedence. Express the desired compound operand explicitly, such as `where('a').whereOr('b AND c')`. Single fragments remain untouched. Roll back frontend bundles and both backend resources together to their recorded previous builds, accounting for any script edits made for the new contract; reverting only one carrier recreates runtime divergence.
