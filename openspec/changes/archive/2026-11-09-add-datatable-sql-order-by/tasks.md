# Tasks

## 1. Declarative DataTable ordering

- [x] 1.1 Add separate comparator and `string | readonly string[]` criteria overloads to `DataTable.orderBy` in `src/table/dataTable.ts`, retaining the native comparator branch. Add regression cases in `tests/dataTable.orderBy.spec.ts`; verify descending numeric callback sorting and return/array/row identity with `npm test -- --runInBand tests/dataTable.orderBy.spec.ts`.
- [x] 1.2 Add private criterion normalization and validation for comma-separated strings and one-criterion-per-array-element inputs. Cover default/explicit directions, direction casing, JavaScript `\s` whitespace (tabs, repeated spaces, NBSP, and newline), Unicode column names, columns named `desc` and `asc`, selected aliases with concrete expected rows, and exact-case column lookup; verify the focused Jest suite passes for equivalent string/array results.
- [x] 1.3 Implement argument-shape and full-list syntax validation before left-to-right column lookup, blank-string/empty-array no-ops, and the specified errors. Verify focused tests reject empty segments, invalid directions, embedded array-element commas, non-string elements (including sparse-array holes), unsupported argument types, and unknown columns on zero/one-row tables. Cover `absent, period sideways` and `absent sideways` yielding `orderBy:`, and `absent, otherAbsent` yielding `Column absent not found`. Test literal punctuation tokens (quotes, brackets, backticks, dots, hyphens, parentheses) against present and absent exact-name columns, including `qty(kg)` and `"number"`; assert the specified unknown-column message and no SQL interpretation. Assert no mutation on every validation failure.
- [x] 1.4 Implement lexicographic comparison for homogeneous numbers, strings, booleans, and Date objects without metadata coercion. Add focused tests for numeric versus textual ordering, case-sensitive string order, false/true ordering, chronological dates, equal instants, and dates from another execution context; verify all cases pass in the focused suite.
- [x] 1.5 Handle null, undefined, NaN, and invalid dates as equal missing values placed last independently of direction. Verify focused tests cover both directions, secondary-key comparison of missing values, all-missing columns, and ordinary zero/false/empty-string values.
- [x] 1.6 Sort decorated row references using the original index for complete ties and copy references back into the existing rows array. Verify focused tests exercise mixed-direction keys, stable ties, repeated criteria, successive independent calls, unchanged column/value data, preserved table/array/row identities, and unchanged/frozen criteria arrays.
- [x] 1.7 Add a concise DataTable ordering section to `README.md` with comparator, string, and array examples, priority/default direction, missing-value policy, no-op/error rules, supported runtime values, and grammar limits (JavaScript `\s`, Unicode, literal punctuation with no SQL interpretation). State that `orderBy` rejects trailing commas/empty segments unlike `select`, accepts readonly/union criteria in TypeScript, and deliberately differs from `distributeFifo`/`distributeLifo` ordering. Verify its examples against the focused tests and distinguish in-memory ordering from `SelectQueryBuilder.orderBy`; preserve unrelated existing README edits.

## 2. Integration verification

- [x] 2.1 Run `npm test -- --runInBand` and record the result; verify existing DataTable, query-builder, and other library tests still pass without changing unrelated behavior.
- [x] 2.2 Run `npm run build` and inspect `dist/table/dataTable.d.ts` for the comparator and `string | readonly string[]` overloads. Run the strict consumer check defined below against generated declarations, require exit code zero with no diagnostics, record the command/result, and delete the temporary consumer file. Verify contextual comparator typing, strings, mutable/readonly arrays, `as const` tuples, and string/array unions are accepted while unsupported argument types are rejected; confirm ESM, UMD, and IIFE outputs build successfully.
- [x] 2.3 Run `openspec validate add-datatable-sql-order-by --strict` and review the final diff against every scenario in `specs/datatable-ordering/spec.md`; verify no dependency, query-model, wire-format, package-version, or unrelated source changes were introduced by this change.

## Strict consumer check for task 2.2

After `npm run build`, create the temporary file `.order-by-consumer-check.ts` at the repository root (do not overwrite a pre-existing file; use an unused temporary name and adjust the command if necessary):

```ts
import { DataTable } from './dist/index';

const table = new DataTable();
const callbackResult: DataTable = table.orderBy((a, b) => b.quantity - a.quantity);
const stringResult: DataTable = table.orderBy('number, period desc');
const mutable: string[] = ['number', 'period desc'];
table.orderBy(mutable);
const readonlyCriteria: readonly string[] = Object.freeze(['number', 'period desc']);
table.orderBy(readonlyCriteria);
const tuple = ['number', 'period desc'] as const;
table.orderBy(tuple);
function checkUnions(mutableSetting: string | string[], readonlySetting: string | readonly string[]): void {
    table.orderBy(mutableSetting);
    table.orderBy(readonlySetting);
}

// @ts-expect-error Numbers are unsupported criteria.
table.orderBy(42);
// @ts-expect-error Null is not a no-op.
table.orderBy(null);
// @ts-expect-error Undefined is not a no-op.
table.orderBy(undefined);
// @ts-expect-error Objects are unsupported criteria.
table.orderBy({});
// @ts-expect-error Every array element must be a string.
table.orderBy(['number', 42]);
```

Run from the repository root using the installed compiler (no network or new package script):

```sh
node node_modules/typescript/bin/tsc --noEmit --strict --target ES6 --lib ES2017,DOM --module commonjs --moduleResolution node .order-by-consumer-check.ts
```

Compile only; do not execute this consumer. `--strict` includes `noImplicitAny`, so the unannotated comparator parameters verify contextual typing. An unsupported call that becomes accepted produces an unused `@ts-expect-error` diagnostic. Keep the command and result in the implementation verification record, then discard the temporary file; it is not a committed fixture.
