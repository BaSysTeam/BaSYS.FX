# Tasks

## 1. Declarative DataTable ordering

- [ ] 1.1 Add comparator, string, and string-array overloads to `DataTable.orderBy` in `src/table/dataTable.ts`, retaining the native comparator branch. Add regression cases in `tests/dataTable.orderBy.spec.ts`; verify descending numeric callback sorting and return/array/row identity with `npm test -- --runInBand tests/dataTable.orderBy.spec.ts`.
- [ ] 1.2 Add private criterion normalization and validation for comma-separated strings and one-criterion-per-array-element inputs. Cover default/explicit directions, direction casing, tabs and repeated whitespace, Unicode column names, a column named `desc`, selected aliases, and exact-case column lookup; verify the focused Jest suite passes for equivalent string/array results.
- [ ] 1.3 Implement full-list validation before sorting, blank-string/empty-array no-ops, and the specified errors. Verify focused tests reject empty segments, invalid directions, SQL syntax, embedded array-element commas, non-string elements, unsupported argument types, and unknown columns on zero/one-row tables; assert no mutation on validation failure and the specified error messages/prefixes.
- [ ] 1.4 Implement lexicographic comparison for homogeneous numbers, strings, booleans, and Date objects without metadata coercion. Add focused tests for numeric versus textual ordering, case-sensitive string order, false/true ordering, chronological dates, equal instants, and dates from another execution context; verify all cases pass in the focused suite.
- [ ] 1.5 Handle null, undefined, NaN, and invalid dates as equal missing values placed last independently of direction. Verify focused tests cover both directions, secondary-key comparison of missing values, all-missing columns, and ordinary zero/false/empty-string values.
- [ ] 1.6 Sort decorated row references using the original index for complete ties and copy references back into the existing rows array. Verify focused tests exercise mixed-direction keys, stable ties, repeated criteria, successive independent calls, unchanged column/value data, and preserved table/array/row identities.
- [ ] 1.7 Add a concise DataTable ordering section to `README.md` with comparator, string, and array examples, priority/default direction, missing-value policy, no-op/error rules, supported runtime values, and grammar limits. Verify its examples against the focused tests and distinguish in-memory ordering from `SelectQueryBuilder.orderBy`; preserve unrelated existing README edits.

## 2. Integration verification

- [ ] 2.1 Run `npm test -- --runInBand` and record the result; verify existing DataTable, query-builder, and other library tests still pass without changing unrelated behavior.
- [ ] 2.2 Run `npm run build` and inspect `dist/table/dataTable.d.ts`. Verify all three call forms are available and strict TypeScript consumer checks accept contextual comparator parameters and string/array inputs while rejecting unsupported argument types; confirm ESM, UMD, and IIFE outputs build successfully.
- [ ] 2.3 Run `openspec validate add-datatable-sql-order-by --strict` and review the final diff against every scenario in `specs/datatable-ordering/spec.md`; verify no dependency, query-model, wire-format, package-version, or unrelated source changes were introduced by this change.
