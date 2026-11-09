# Proposal

## Why

`DataTable.orderBy` currently requires a comparator even for routine sorting by one or more columns. A SQL-like list of column names and directions makes these calls shorter and offers similar string/array input forms to `DataTable.select` and column methods. Unlike `select`, `orderBy` rejects trailing commas and other empty list segments.

## What Changes

- Add `orderBy('number, period desc ')` and `orderBy(['number', 'period desc'])` alongside the existing comparator form; accept mutable/readonly arrays and string/array union values in TypeScript.
- Interpret criteria in priority order, with ascending order by default, optional case-insensitive `asc`/`desc`, and JavaScript `\s` whitespace. Resolve column tokens literally, including Unicode and punctuation, without SQL interpretation.
- Preserve in-place sorting, the existing row-array identity, row objects, and fluent return of the same table; preserve the input order of complete ties.
- Validate all criteria and column names before sorting; describe deterministic comparison of supported scalar/date values and missing values.
- Document the three call forms and their limits. No direction helper functions or dependencies are introduced.

## Capabilities

### New Capabilities

- `datatable-ordering`: Sorting an in-memory DataTable using a comparator or an ordered string/array of column criteria, including parsing, validation, comparison, and fluent mutation behavior.

### Modified Capabilities

None. The existing `query-boundaries` capability is unrelated to in-memory table sorting.

## Impact

- Public API: additive overloads of `DataTable.orderBy` in `src/table/dataTable.ts`, already exported through `src/index.ts`.
- Tests: focused ordering cases in a new `tests/dataTable.orderBy.spec.ts`, following the existing Jest/ts-jest setup.
- Documentation: a DataTable ordering example and behavior notes in `README.md`.
- No package additions, model/wire changes, or changes to `SelectQueryBuilder.orderBy`.
- Out of scope: SQL execution, evaluation of expressions or nested property paths, SQL identifier unquoting, locale options, `NULLS FIRST/LAST`, variadic or object criteria, and changes to other table methods, including the existing ordering in `distributeFifo`/`distributeLifo`. Punctuation in a token is part of its literal column name. Unusual comparisons remain available through the comparator overload.
