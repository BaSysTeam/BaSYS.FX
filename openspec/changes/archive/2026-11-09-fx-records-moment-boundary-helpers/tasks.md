# Tasks

## 1. Moment and boundary types

- [x] 1.1 Add `src/query/queryBoundary.ts` per the design, decisions 1–3 and 5: `BoundaryKind` (`Before = 0`, `UpTo = 1`, `From = 2`, `After = 3`), `Moment`, `BoundaryOptions`, `QueryBoundary`, `moment`, and `isMoment`. The constructor copies the six fields and changes only `undefined` to `null` (`??`, not `||`). A date is checked with `Object.prototype.toString` and `getTime()`. Serialization is the internal `toBoundaryDate` = `new Date(value.getTime()).toLocalISO()`. `moment` copies the date, collapses an empty number (`undefined`, `null`, `''`, `0`) to `null`, and without a string `metaObject` throws `Error('moment: operation meta object is not specified.')`. Check: `tests/queryBoundary.spec.ts` from task 1.2 passes.

- [x] 1.2 Add `tests/queryBoundary.spec.ts` for items 2.3.20–2.3.25 of the source task: a successful moment, the string `'2026-10-22T12:37:59'` as a local date, empty numbers, errors without `metaObject`, with `''`, with `header = null`, without a date, and with `'abc'`, isolation from later header edits, a date from `vm.runInNewContext` receiving local `toLocalISO`, and `isMoment` true only for a complete moment. Check: `npx jest tests/queryBoundary.spec.ts` finishes without errors.

## 2. Model and builder methods

- [x] 2.1 In `src/query/selectQueryModel.ts`, add `boundaries: QueryBoundary[]`: an empty array, or `data.boundaries.map(item => new QueryBoundary(item))`. In `src/query/selectQueryBuilder.ts`, add `beforeMoment`, `upToMoment`, `fromMoment`, and `afterMoment` through one internal write (design, decisions 4 and 6). A date yields `metaObject` and `number` equal to `null`. A moment carries the meta object and the number; an empty number is `null`. `excludeOwn` without a value is `null`. `column` is allowed only on a date boundary; otherwise throw `Error('<method>: options.column is allowed for date boundaries only.')` before `push`. Any other argument throws `Error('<method>: argument must be a Date or a moment.')`. `where`, `parameters`, and `filters` do not change, and `p_bnd_*` parameters are not added. Check: `tests/selectQueryBuilder.boundaries.spec.ts` from task 2.2 passes.

- [x] 2.2 Add `tests/selectQueryBuilder.boundaries.spec.ts`, following `tests/selectQueryBuilder.withFilters.spec.ts` (`new SelectQueryBuilder(null as any)`), for items 2.3.26–2.3.34: the four methods with a date and kinds 0–3, a `vm` date for `upToMoment` yielding `2026-11-30T23:59:59`, `endMonth()` of November 2026 yielding the same string, a moment and a hand-built moment with a foreign date, `excludeOwn: false` and `column: 'delivery_date'`, two boundaries in call order, errors 2.3.11 and 2.3.13 leaving the list unchanged, stable `where`/`parameters`/`filters`, `JSON.stringify` matching the body `{"kind":1,"date":"2026-11-30T23:59:59","metaObject":null,"number":null,"excludeOwn":null,"column":null}`, and restoration through `new SelectQueryModel` producing `QueryBoundary` instances. Check: `npx jest tests/selectQueryBuilder.boundaries.spec.ts` finishes without errors.

## 3. Export, version, and README

- [x] 3.1 In `src/index.ts`, add `export * from './query/queryBoundary'`. Check: the file contains this export, and the existing exports remain.

- [x] 3.2 Raise this package's own version to `1.1.0` in `package.json` and in the two identity fields of `package-lock.json` (the root and `packages[""]`, currently `1.0.3`). Do not change the `@types/estree` and `inflight` entries at version `1.0.6`. Check: the three identity fields equal `1.1.0`, and `node_modules/@types/estree` and `node_modules/inflight` in the lockfile stay `1.0.6`.

- [x] 3.3 Add the README section `Границы запроса к регистру` (design, decision 8): an opening balance through `beforeMoment(moment(...))`, a month-end balance through `upToMoment(d.endMonth())`, turnover through `fromMoment` and `upToMoment`, examples of `excludeOwn` and `column`, the note that a date boundary is a whole second, and the rule that in a form the second `moment` argument may be omitted, while in shared modules and on the server it must not. Do not rewrite the rest of the README. Check: the section contains every listed example and both notes.

## 4. Build and record the result

- [x] 4.1 From the BaSYS.FX root, run `npm test` and `npm run build`. Check: both commands finish without errors; `dist/index.d.ts` contains `moment`, `BoundaryKind`, `QueryBoundary`, and the signatures of the four methods; `dist/basys-fx.iife.js` contains `exports.moment`. Existing tests pass without changes to expectations (2.3.35).

- [x] 4.2 Record the result in section 8 of the source task `D:\_WORK\BaSysProject\REPO\BaSysApp\BaSYS.DevDocs\openspec\changes\add-records-moment-boundaries\tasks\2026-11-07-2155-fx-records-moment-stage-2-3-boundary-helpers-task.md`: what changed, the outcomes of `npm test` and `npm run build`, version `1.1.0`, the revision from `git rev-parse HEAD`, and the SHA-256 of `dist/basys-fx.iife.js`. Mark items 2.3.1–2.3.36 and set the file status to `done`. In the parent `tasks.md`, mark stage 2.3. For acceptance criterion 6, mark only the library part (methods and Jest tests); do not fill in the publication row in §4. For criterion 7, check the `moment` error when the second argument is missing. Check: section 8 contains the version, the revision, and the hash, the task status is `done`, and stage 2.3 is marked. Do not publish to npm.

## Workflow follow-up

- The owner publishes `@basysteam/basys-fx@1.1.0` after `BaSys.Back` is released with stage 2.2, from the revision recorded in section 8. Confirmation is written in the publication table of §4 of the parent `tasks.md`, not in this change.
- Archive the change `fx-records-moment-boundary-helpers` after review, once the implementation is closed. The parent change `add-records-moment-boundaries` is archived separately.
