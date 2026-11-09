# Design

## Context

See `proposal.md` for motivation and scope. `DataTable.orderBy` currently calls `this._rows.sort(sortFunction)` and returns `this`. `rows` exposes the actual array, so replacing it would break existing references. `getColumn` and `checkExistingColumn` provide exact-name lookup and the established `Column <name> not found` error. Nearby `select` and column methods accept strings and arrays. There are no existing ordering tests in `tests/dataTable.spec.ts`.

`DataTableColumn` supports string, number, boolean, and date metadata, but `addRow`, `load`, and direct access to `rows` do not enforce value types. Date columns default to undefined. The library targets ES6 and is also used in embedded runtimes; stable native sort cannot be assumed from the compile target alone. `src/index.ts` already exports DataTable, and Rollup emits declarations and multiple JavaScript bundles. The separate query builder simply forwards an order expression to the server.

## Goals / Non-Goals

**Goals:**

- Add a small declarative parser and comparator without changing the custom comparator path.
- Parse and validate once per call, preserve reference identity, and guarantee stable ties in the declarative path across supported runtimes.
- Make ordinary comparisons predictable without inferring values from column metadata.

**Non-Goals:**

- Introduce an SQL parser, shared query-builder sorting machinery, or a public ordering descriptor hierarchy.
- Add table-wide type enforcement or normalize stored row values.

## Decisions

### 1. Overloads retain the existing method name

Expose comparator, string, and `string[]` overloads, backed by one implementation that dispatches by function/string/array. Keep the function branch as the existing native sort call and return the same table from all successful branches. Keep parsing/comparison helpers private to `dataTable.ts`; no new public exports or dependencies are needed.

Alternatives: a new method would split a single concept across APIs; public `asc`/`desc` helpers would depart from the requested string/array convention. Drizzle's [Order By examples](https://orm.drizzle.team/docs/select#order-by) use column references and direction helpers; adopt multiple-key priority only, not its public syntax.

### 2. Use a deliberately small criterion grammar

Split only the top-level string on commas. An array element represents exactly one criterion, so embedded commas in an array element are invalid. Trim each criterion, then recognize a column token plus an optional direction token separated by whitespace. A column token is a non-empty literal name without whitespace or commas; it is resolved against the current table, not treated as a property path. Do not restrict names to ASCII identifiers: existing metadata can contain Unicode or punctuation. Reject SQL quote delimiters and expression syntax instead of interpreting them. A column literally named `desc` is usable as the single token `desc`.

Treat only an entirely blank string or `[]` as a no-op. Reject blank entries in a non-empty list, non-string elements, unsupported directions, and unsupported argument types. Resolve every column before sorting, even for zero/one row. Use the existing unknown-column message; other validation errors start with `orderBy:` and identify the invalid argument or criterion. Exact suffix wording need not be a public contract.

Alternatives: silently filtering empty criteria would hide errors such as a trailing comma; splitting array elements again would create two list grammars. SQL quoted identifiers and expressions require a larger parser and remain outside scope.

### 3. Compare values without metadata coercion

For the supported homogeneous runtime types, compare numbers numerically, strings with JavaScript relational operators, booleans as false/true, and dates by epoch time. Detect dates without `instanceof` so dates from other execution contexts work; no library-specific date extension is required. Do not parse date strings or convert numeric strings based on metadata.

Treat null, undefined, NaN, and invalid dates as one missing-value class. Compare missingness before applying direction, keeping missing values last for both ascending and descending. Equal missing values proceed to the next key. The spec deliberately does not promise ordering for mixed runtime types or arbitrary objects; users retain the comparator form for those values. Do not add a new pass enforcing declared column types.

These missing-value rules, no-op behavior, and string collation are proposed defaults for review, not pre-existing behavior. There is no existing declarative ordering contract to preserve. JavaScript relational string order is deterministic across locale settings; automatic locale/numeric collation would change results between hosts. SQL databases also vary in null placement, so this API documents its own fixed policy rather than claiming a particular dialect.

### 4. Sort decorated rows, then copy references back

After validation, decorate rows with their original index, then sort the temporary entries with the criteria comparator. Use the original index as the final ascending tie-breaker, independent of criterion direction. Write sorted row references back into the existing `_rows` array by index. This preserves the array and row objects without relying on native stable sort, copying row values, replacing `_rows`, or spreading an arbitrarily large array into `splice`.

Use one lexicographic sort rather than repeated sorts for individual fields. Complexity is O(k * n log n) comparisons for n rows and k criteria, plus O(n) temporary entries. The callback path keeps its existing behavior, including its native stability/error characteristics.

Alternatives: sorting `_rows` directly is shorter but depends on stable sort support; successive per-column sorts have the same dependency and can mishandle priority. A generic processor abstraction would add more machinery than this localized feature needs.

## Risks / Trade-offs

- A SQL-looking API can imply support for full SQL expressions or quoted names. Mitigation: document the exact grammar and show the comparator escape hatch.
- Row values are untyped at runtime and can disagree with metadata. Mitigation: explicitly limit declarative comparison to supported homogeneous runtime types and avoid silent metadata conversions.
- Stable sorting needs O(n) temporary storage. Mitigation: store row references and indices only; avoid table cloning and preserve the existing array.
- Other changes already modify README.md and unrelated sources in the working tree. Mitigation: apply future documentation edits narrowly and preserve those changes; this proposal changes only its own OpenSpec directory.

## Migration Plan

This is an additive API change. Existing comparator callers need no migration. The apply workflow will add focused Jest tests, update README examples, run the existing suite and build, and inspect generated declarations for all three call forms and contextual typing of comparator parameters. No package-version change or deployment is part of this change. Rolling back removes the overloads and documentation; scripts adopting declarative calls would need to revert to comparator calls.
