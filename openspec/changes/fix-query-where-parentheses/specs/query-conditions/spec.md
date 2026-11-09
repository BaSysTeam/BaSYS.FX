# Spec Delta

## Purpose

Defines how scripts replace and combine SELECT WHERE fragments while preserving operand grouping and forwarding the composed condition to the query provider.

## Scope

The composition guarantees below apply to non-empty SQL fragment strings. Empty incoming fragments (`''`), `null`, and `undefined` are outside this composition contract; no skip policy or usable SQL output is promised for them. The explicit `where('')` reset described below remains supported. This change does not add input validation.

## ADDED Requirements

### Requirement: Concatenation groups both operands

When the accumulated WHERE expression is non-empty, `whereAnd(fragment)` SHALL produce `(<accumulated>) and (<fragment>)`, and `whereOr(fragment)` SHALL produce `(<accumulated>) or (<fragment>)`. Both operands SHALL retain their original text inside the added parentheses, including existing parentheses and whitespace.

#### Scenario: AND applies to the entire existing disjunction

- **WHEN** a script calls `where('rd_code = 65 OR rd_code = 66').whereAnd('project = @project')`
- **THEN** the WHERE expression equals `(rd_code = 65 OR rd_code = 66) and (project = @project)`

#### Scenario: AND groups a newly added disjunction

- **WHEN** a script calls `where('project = @project').whereAnd('rd_code = 65 OR rd_code = 66')`
- **THEN** the WHERE expression equals `(project = @project) and (rd_code = 65 OR rd_code = 66)`

#### Scenario: OR groups both compound operands

- **WHEN** a script calls `where('a = 1 AND b = 2').whereOr('c = 3 AND d = 4')`
- **THEN** the WHERE expression equals `(a = 1 AND b = 2) or (c = 3 AND d = 4)`

#### Scenario: Existing formatting is retained

- **WHEN** a script calls `where(' (a = 1 OR b = 2) ').whereAnd(' c = 3 ')`
- **THEN** the WHERE expression equals `( (a = 1 OR b = 2) ) and ( c = 3 )`

### Requirement: Successive calls combine the accumulated result in call order

Each `whereAnd` or `whereOr` call SHALL treat the entire result of previous calls as its left operand. Mixed chains SHALL therefore use left-associated grouping, without reordering fragments according to SQL operator precedence.

#### Scenario: OR followed by AND

- **WHEN** a script calls `where('a = 1').whereOr('b = 2').whereAnd('c = 3')`
- **THEN** the WHERE expression equals `((a = 1) or (b = 2)) and (c = 3)`

#### Scenario: AND followed by OR

- **WHEN** a script calls `where('a = 1').whereAnd('b = 2').whereOr('c = 3')`
- **THEN** the WHERE expression equals `((a = 1) and (b = 2)) or (c = 3)`

#### Scenario: Repeated AND keeps every operand

- **WHEN** a script calls `where('a = 1').whereAnd('b = 2').whereAnd('c = 3')`
- **THEN** the WHERE expression equals `((a = 1) and (b = 2)) and (c = 3)`

### Requirement: The first condition is stored verbatim

When the accumulated WHERE expression is empty, `whereAnd(fragment)` and `whereOr(fragment)` SHALL store the fragment verbatim without a leading operator or additional parentheses.

#### Scenario: Either method starts a condition

- **WHEN** a script calls either method with `a = 1 OR b = 2` on a new query
- **THEN** the WHERE expression equals `a = 1 OR b = 2`

#### Scenario: An explicitly cleared condition can be restarted

- **WHEN** a script calls `where('a = 1').where('').whereOr('b = 2')`
- **THEN** the WHERE expression equals `b = 2`

### Requirement: where replaces the accumulated condition

`where(fragment)` SHALL replace the entire accumulated WHERE expression with the supplied text, without additional parentheses. A later concatenation SHALL use that replacement as its left operand.

#### Scenario: Replacement discards the earlier chain

- **WHEN** a script calls `where('a = 1').whereOr('b = 2').where('c = 3 OR d = 4').whereAnd('e = 5')`
- **THEN** the WHERE expression equals `(c = 3 OR d = 4) and (e = 5)`

### Requirement: Condition methods preserve fluent query state

`where`, `whereAnd`, and `whereOr` SHALL return the same query builder and SHALL change only its WHERE expression. Existing parameters, filters, boundaries, and other query fields SHALL remain unchanged.

#### Scenario: Composition leaves other query fields intact

- **GIVEN** a query with a source, selected fields, a parameter, a filter, and a boundary
- **WHEN** a script calls `where`, `whereAnd`, and `whereOr`
- **THEN** each call returns the same builder
- **AND** the source, selected fields, parameter, filter, and boundary retain their values

### Requirement: Execution forwards the grouped condition

`query()` SHALL forward the composed WHERE expression as the existing string field `whereExpression` in the query model passed to the provider. No new request fields SHALL be required for condition grouping.

#### Scenario: Provider receives the same grouped expression

- **WHEN** a script calls `where('a = 1 OR b = 2').whereAnd('c = @c').query()` with a configured provider
- **THEN** the provider receives `whereExpression` equal to `(a = 1 OR b = 2) and (c = @c)`
- **AND** serialization of the forwarded model retains that string unchanged
