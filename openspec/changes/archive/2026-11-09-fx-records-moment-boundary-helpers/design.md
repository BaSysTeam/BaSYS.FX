# Design

## Context

See `proposal.md` for why this change is needed. Behavior is in `specs/query-boundaries/spec.md`. Field contracts and the meaning of boundaries are set by the parent change and are not redefined here:

- D5 and D7: `D:\_WORK\BaSysProject\REPO\BaSysApp\BaSYS.DevDocs\openspec\changes\add-records-moment-boundaries\design.md`
- Stage 2.3 task: `...\tasks\2026-11-07-2155-fx-records-moment-stage-2-3-boundary-helpers-task.md`

Today `SelectQueryBuilder` builds a `SelectQueryModel` and passes it to `IQueriesProvider.execute` as JSON. The model constructor copies `parameters` and `filters` into new objects. Dates in `parameter()` are detected with `instanceof Date` and immediately call `toLocalISO()`. `toLocalISO()` (`src/dateExtensions.ts`) already writes `YYYY-MM-DDTHH:mm:ss` in local time and drops milliseconds. The build is Rollup from `src/index.ts` into `dist/basys-fx.{esm,umd,iife}.js` and `dist/index.d.ts`, with the bundle name `BaSYSFX`. Tests are Jest. The sample is `tests/selectQueryBuilder.withFilters.spec.ts`: `new SelectQueryBuilder(null as any)` and an assertion on `builder.model`.

`package.json` is `1.0.6`. In `package-lock.json` the package's own version (the root and `packages[""]`) is still `1.0.3`. The `1.0.6` entries in the lockfile belong to other packages, `@types/estree` and `inflight`.

## Goals / Non-Goals

**Goals:**

- Build the `boundaries` field so that the JSON matches the stage 2.2 `QueryBoundaryDto`: camelCase, `kind` as a number, and missing values as `null`.
- Accept a `Date` from another engine context, and do not store a reference to the header inside a moment.
- Leave `where`, `parameters`, and `filters` untouched.

**Non-Goals:**

- SQL, `p_bnd_*` parameters, register column selection, and the default value of `excludeOwn`. Those belong to the server, D6, and stage 2.2.
- The short form `moment($h)` and form context. That is stage 2.4. Using `globalThis` for context was rejected in D8.
- Changing `toLocalISO`, `endMonth`, or the other date extensions.
- Publishing the package to npm.

## Decisions

### 1. A separate module, `src/query/queryBoundary.ts`

It holds `BoundaryKind`, `Moment`, `BoundaryOptions`, `QueryBoundary`, `moment`, `isMoment`, and unexported date checks. `src/index.ts` adds `export * from './query/queryBoundary'`. A separate file does not inflate the model, and it is included in the d.ts and in the IIFE together with the rest of the public entry: `exports.moment` must appear in `dist/basys-fx.iife.js`.

The alternative is to describe a boundary inside `selectQueryModel.ts`. Rejected: `moment` and `isMoment` are not the query model, and server scripts receive `moment` as a package export.

### 2. A date is checked by `toString` and serialized from a local copy

The internal `toBoundaryDate(value)` equals `new Date(value.getTime()).toLocalISO()`. A date is valid when `Object.prototype.toString.call(value) === '[object Date]'` and `!isNaN(value.getTime())`. Extension methods of the passed date are not called: FX attaches them to `Date.prototype` of its own context.

`parameter()` still uses `instanceof`. It must not change: parameter dates already have the extensions, and that is a different contract.

The alternative is to call `value.toLocalISO()` directly. Rejected: a date from ClearScript or `vm.runInNewContext` does not have that method and throws `TypeError`.

### 3. Empty fields are `null`, and a zero kind is kept

The `QueryBoundary(params)` constructor copies the six fields and replaces only `undefined` with `null` (`?? null`). `kind: 0` (`Before`) and `excludeOwn: false` must be preserved, so `||` is not used. `JSON.stringify` then does not drop the fields.

An empty number (`undefined`, `null`, `''`, `0`) collapses to `null` in `moment` and when the builder reads a moment. The constructor itself does not treat a number of zero as empty: JSON for a new operation already contains `null`.

### 4. Four methods share one internal write

`beforeMoment`, `upToMoment`, `fromMoment`, and `afterMoment` return `this` and pass their `BoundaryKind` to a shared method. That method distinguishes a date from a moment, checks `options.column` before writing, and only then calls `push`. After an error, `model.boundaries` is the same array as before the call.

`excludeOwn` is stored as `true`, `false`, or `null`. A `column` name for a date is passed through as given.

The alternative is to assemble the boundary inside `where`. Rejected by parent D6: the server builds the condition and the parameters.

### 5. `moment` does not close over the header

A new object is returned. `date` is `new Date(header.date.getTime())` for a date object, and the result of `new Date(value)` for a string. Neither `header` nor the original date object is placed in the moment. Without a string `metaObject`, or without a header object, the function throws the errors from the specification and does not read form context.

`isMoment` is true for a non-`Date` object with a valid date and a non-empty `metaObject` string. The builder uses it, so a moment can also be assembled by hand.

### 6. The model always has a boundary array

`SelectQueryModel.boundaries` in the constructor is `[]`, or `data.boundaries.map(item => new QueryBoundary(item))`. A missing field yields an empty list, so old JSON without `boundaries` is restored. Element order is call order.

### 7. Version `1.1.0` applies only to this package

`package.json` `version` changes, and so do the two identity entries of `@basysteam/basys-fx` in `package-lock.json` (the root and `packages[""]`, currently `1.0.3`). Dependency entries at version `1.0.6` are left alone. The bump is minor: public members are only added.

### 8. The README describes scenarios, not the server algorithm

A new section, `Границы запроса к регистру`, in `README.md`: an opening balance through `beforeMoment(moment(...))`, a month-end balance through `upToMoment(d.endMonth())`, turnover through `fromMoment` and `upToMoment`, `excludeOwn`, and `column`. Separately, state that a date boundary is a whole second, and that in a form the second `moment` argument may be omitted (stage 2.4 does that), while in shared modules and on the server it must not. The rest of the README is left as it is.

## Risks / Trade-offs

- [Package `1.1.0` reaches a server without stage 2.2] → `System.Text.Json` drops the unknown `boundaries`, and the query silently returns rows without boundaries. The owner publishes after `BaSys.Back` is released. This stage only records the version, the revision, and the SHA-256 of `dist/basys-fx.iife.js` in section 8 of the task.
- [A date string without a zone depends on the engine] → for `'2026-10-22T12:37:59'`, the test fixes the local components of `new Date(2026, 9, 22, 12, 37, 59)`, as the task requires. There is no separate time-zone parse.
- [Both the client and the server drop milliseconds] → the library does not truncate the date itself. `toLocalISO()` already drops fractional seconds, and the server truncates again. Date extensions do not change, and the result does not depend on the client.
- [The lockfile already lags `package.json`] → edit only the two package-identity fields, without `npm update`.

## Migration Plan

1. Add the types, methods, and tests without changing existing builder calls.
2. Raise the package version to `1.1.0`.
3. Run `npm test` and `npm run build` from the BaSYS.FX root.
4. Record version `1.1.0`, the BaSYS.FX revision, and the SHA-256 of `dist/basys-fx.iife.js` in section 8 of the source task. The implementer sets the task status and the stage 2.3 mark in the parent `tasks.md` according to the readiness criteria.
5. Before publication, rollback means not releasing the package. After publication, old scripts that do not use boundaries stay unchanged: a missing field becomes an empty list on the server. Consumers roll back by staying on `1.0.6`.

Publishing to npm and editing `BaSys.Front` / `jsSource.resx` are not part of this step.
