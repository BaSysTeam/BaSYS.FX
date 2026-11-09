# Proposal

## Why

An application developer cannot set a register balance or turnover by operation moment or by date. `SelectQueryBuilder` supports only `where`, parameters, and filters, and the server must build the moment condition. Stage 2.3 of the parent change `add-records-moment-boundaries` adds a `boundaries` field to the query model in `@basysteam/basys-fx` and a `moment` function, so the client sends intent rather than SQL.

The source of the requirements is the stage 2.3 task and decision D7 of the parent design. This document refers to them and does not rewrite the server contract.

- Task: `D:\_WORK\BaSysProject\REPO\BaSysApp\BaSYS.DevDocs\openspec\changes\add-records-moment-boundaries\tasks\2026-11-07-2155-fx-records-moment-stage-2-3-boundary-helpers-task.md`
- Design D5, D7: `D:\_WORK\BaSysProject\REPO\BaSysApp\BaSYS.DevDocs\openspec\changes\add-records-moment-boundaries\design.md`
- Parent-change requirements: `...\specs\records-query-boundaries\spec.md` — "Query builder offers four boundary methods", "Boundary argument is a date or an operation moment", "moment builds an operation moment", "Own movements can be excluded", "A date boundary can use an explicit column".

## What Changes

- A new boundary module: `BoundaryKind`, `Moment`, `BoundaryOptions`, `QueryBoundary`, `moment`, and `isMoment`.
- Four builder methods: `beforeMoment`, `upToMoment`, `fromMoment`, and `afterMoment`. Each adds one boundary to `model.boundaries` and does not change `where`, `parameters`, or `filters`.
- `SelectQueryModel.boundaries` serializes to JSON and is restored from a plain object. Missing values are passed as `null`.
- A public export from the package. Version `1.1.0`: the API is only added.
- A README section, `Границы запроса к регистру`.
- The short form `moment($h)` does not appear in the library. The frontend adds the form context in stage 2.4.

## Capabilities

### New Capabilities

- `query-boundaries`: building query boundaries and an operation moment in `@basysteam/basys-fx`. The library validates the argument, serializes the date, and places a `QueryBoundary` in the model. The server builds the SQL, the `p_bnd_*` parameters, and the meaning of the boundaries.

### Modified Capabilities

- None. This repository's `openspec/specs` has no requirements yet.

## Impact

- Code: `src/query/queryBoundary.ts` (new), `src/query/selectQueryModel.ts`, `src/query/selectQueryBuilder.ts`, and `src/index.ts`.
- Tests: `tests/queryBoundary.spec.ts` and `tests/selectQueryBuilder.boundaries.spec.ts`. Existing builder tests remain the regression suite.
- Documentation and version: `README.md`, `package.json`, and `package-lock.json` (`1.0.6` → `1.1.0`).
- Consumers: the frontend (`Queries/Execute`) and server scripts (`QueriesEvaluator/Execute`) receive the `boundaries` field. A server without stage 2.2 silently ignores an unknown field, so the package can be published only after `BaSys.Back` is released with stage 2.2. Publishing to npm is not part of this stage.
- Left unchanged: `toLocalISO`, `endMonth`, and the other date extensions; SQL construction; `BaSys.Front` and `jsSource.resx`; storing form context in `globalThis`.
