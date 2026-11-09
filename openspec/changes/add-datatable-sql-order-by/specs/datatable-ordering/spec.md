# Spec Delta

## Purpose

Allows scripts to sort an in-memory DataTable by a concise ordered list of column criteria while retaining the existing custom comparator API and fluent mutation behavior.

## ADDED Requirements

### Requirement: Three ordering call forms

`DataTable.orderBy` SHALL accept a comparator `(a: any, b: any) => number`, a comma-separated string of criteria, or an array of criterion strings. The comparator form SHALL retain its existing native array-sort behavior. Declarative sorting SHALL NOT require direction helper functions.

#### Scenario: Equivalent string and array

- **GIVEN** separate tables containing rows `(number, period)` of `(2, 10)`, `(1, 10)`, and `(1, 20)`
- **WHEN** one calls `orderBy('number, period desc ')` and the other calls `orderBy(['number', 'period desc'])`
- **THEN** both contain `(1, 20)`, `(1, 10)`, and `(2, 10)` in that order

#### Scenario: Custom comparator remains usable

- **WHEN** a script passes `(a, b) => b.quantity - a.quantity`
- **THEN** rows are sorted using that comparator with the same behavior as the existing API

### Requirement: Criterion grammar and name resolution

Each criterion SHALL be a single column-name token optionally followed by whitespace and `asc` or `desc`. Direction SHALL be case-insensitive and default to ascending. Leading/trailing whitespace and repeated whitespace between tokens SHALL be accepted. Column names SHALL match the current table's column names exactly, including case. Names containing whitespace or commas and SQL quoting/expressions SHALL be outside this grammar.

#### Scenario: Whitespace and direction casing

- **WHEN** a script calls `orderBy('  number  ASC ,\tperiod   DeSc  ')` with the escape representing a tab
- **THEN** number is sorted ascending and period descending within equal numbers

#### Scenario: A selected alias is a current column name

- **WHEN** a script calls `table.select('product as item, quantity').orderBy('item desc')`
- **THEN** ordering uses the selected table's `item` column

#### Scenario: Column names remain case-sensitive

- **GIVEN** a table with column `number` and no column `Number`
- **WHEN** a script calls `orderBy('Number')`
- **THEN** it fails with `Column Number not found`

### Requirement: Criteria have ordered priority and stable ties

Declarative sorting SHALL compare criteria from left to right, using the next criterion only when the current values compare equal. Ascending and descending SHALL apply independently per criterion. Rows equal on every criterion SHALL retain their relative order from immediately before the call. Repeated columns SHALL be accepted and processed in their supplied order.

#### Scenario: Secondary direction does not reverse primary order

- **GIVEN** rows identified A, B, C, D with keys `(1, 10)`, `(1, 20)`, `(2, 30)`, `(1, 20)`
- **WHEN** a script orders by `number, period desc`
- **THEN** the row identifiers are B, D, A, C

#### Scenario: Repeated column is redundant

- **WHEN** a script orders by `number asc, number desc`
- **THEN** the result is the same as ordering by `number asc`, including stable ties

### Requirement: Scalar and date comparison

Declarative sorting SHALL support homogeneous non-missing values in each column: numbers, strings, booleans, or valid Date objects. Numbers SHALL compare numerically, strings by case-sensitive JavaScript relational order without locale collation, booleans with false before true, and dates by epoch milliseconds, including dates from another execution context. Values SHALL NOT be converted to a column's declared type. Mixed types and other objects are outside the declarative comparison contract.

#### Scenario: Numeric values do not sort as text

- **WHEN** numeric values `10`, `2`, and `1` are sorted ascending
- **THEN** the result is `1`, `2`, `10`

#### Scenario: Strings and booleans have explicit order

- **WHEN** separate columns containing strings `b`, `A`, `a` and booleans `true`, `false` are sorted ascending
- **THEN** their respective orders are `A`, `a`, `b` and `false`, `true`

#### Scenario: Equal dates compare by instant

- **GIVEN** two distinct valid Date objects representing the same instant, including a Date created in another execution context
- **WHEN** their rows are sorted by the date and a secondary column
- **THEN** the secondary column determines their order

### Requirement: Missing values have deterministic placement

For declarative sorting, `null`, `undefined`, numeric `NaN`, and invalid Date objects SHALL compare equal as missing values. Missing values SHALL follow all non-missing values for both ascending and descending directions. Two missing values SHALL allow comparison to proceed to the next criterion. Empty strings, zero, and false SHALL remain ordinary values.

#### Scenario: Missing dates stay last in either direction

- **GIVEN** rows with valid dates, `null`, `undefined`, and invalid Date objects
- **WHEN** sorted by the date ascending or descending
- **THEN** all rows with valid dates precede all rows with missing dates
- **AND** missing-date rows retain their relative order unless a secondary criterion distinguishes them

#### Scenario: Zero is not missing

- **WHEN** values `null`, `0`, `NaN`, and `2` are sorted descending
- **THEN** the result is `2`, `0`, `null`, `NaN`

### Requirement: Fluent in-place sorting

Every successful call SHALL return the same DataTable and preserve its row-array identity, row object identities, column definitions, and row values. Only row order SHALL change. Each declarative call SHALL apply its own criteria to the table's current order without accumulating criteria from previous calls.

#### Scenario: Existing references observe the result

- **GIVEN** a saved reference to the table's rows array and its row objects
- **WHEN** a script calls a valid declarative ordering
- **THEN** the returned object is the same table and the saved array shows the sorted order of the same row objects

#### Scenario: Successive calls use their own criteria

- **WHEN** a script calls `orderBy('number').orderBy('period desc')`
- **THEN** period descending is the final primary order, and equal periods retain their order from the first call

### Requirement: Empty criteria leave order unchanged

An empty or whitespace-only string and an empty array SHALL be successful no-ops returning the same table. An empty criterion within a non-empty list SHALL be rejected. Valid non-empty criteria SHALL be validated even when the table has zero or one row.

#### Scenario: Explicit empty list

- **WHEN** a script calls `orderBy('')`, `orderBy('   ')`, or `orderBy([])`
- **THEN** the row order and array identity stay unchanged and the same table is returned

#### Scenario: Empty segments are invalid

- **WHEN** a script passes `'number,'`, `',number'`, `'number,,period'`, `['']`, or `['number', '  ']`
- **THEN** the call fails before changing any row order

### Requirement: Validate criteria before mutation

Declarative ordering SHALL validate the entire input and all referenced columns before reordering rows. Unsupported argument types, non-string array elements, malformed criteria, or unsupported direction tokens SHALL throw Error with a message prefixed `orderBy:`. Unknown columns SHALL throw `Column <name> not found`. Failures in this validation SHALL leave the table unchanged.

#### Scenario: Invalid secondary criterion does not partially sort

- **WHEN** a script passes `'number, period sideways'`, `['number', 42]`, or `['number, period desc']`
- **THEN** the call fails with an `orderBy:` error and leaves rows, row-array identity, and columns unchanged

#### Scenario: Unknown column fails on an empty table

- **GIVEN** an empty table with column `number`
- **WHEN** a script calls `orderBy('number, absent desc')`
- **THEN** it fails with `Column absent not found`

#### Scenario: Unsupported argument type

- **WHEN** JavaScript code passes `null`, `undefined`, a number, or an object as the argument
- **THEN** the call fails with an `orderBy:` error before changing any rows
