# Spec Delta

## Purpose

Gives a script four query-boundary methods and a `moment` function. The library fills the model's `boundaries` field, and the server builds the condition by moment or by date.

## ADDED Requirements

### Requirement: Query builder offers four boundary methods

The query builder SHALL provide `beforeMoment`, `upToMoment`, `fromMoment`, and `afterMoment` with the signature `(value, options?)`. A call SHALL add one boundary and SHALL return the same builder. The boundary kind SHALL be a number: 0, 1, 2, and 3, in that method order.

#### Scenario: Each method adds one boundary and returns the builder

- **WHEN** a script calls any of the four methods with a valid date
- **THEN** the method returns the same builder
- **AND** the boundary list gains one entry with that method's kind

### Requirement: Boundary methods leave the rest of the query unchanged

Boundary methods SHALL NOT change the user condition, parameters, or filters, and SHALL NOT add `p_bnd_*` parameters or SQL text.

#### Scenario: Where parameters and filters stay as they were

- **GIVEN** the query already has a condition, a parameter, and a filter
- **WHEN** a script adds a boundary
- **THEN** the condition, parameters, and filters stay as they were

### Requirement: A date argument becomes a date boundary

A valid date SHALL produce a boundary whose date is local time `YYYY-MM-DDTHH:mm:ss`, without fractional seconds and without a time zone. The meta object and the number SHALL be `null`. The library SHALL drop fractional seconds through the existing local serialization and SHALL NOT truncate the date separately.

#### Scenario: End of month drops milliseconds

- **WHEN** a script calls `upToMoment` with the end of November 2026, `23:59:59.999`
- **THEN** the boundary date equals `2026-11-30T23:59:59`
- **AND** the meta object and the number equal `null`

### Requirement: A date from another engine context is accepted

A date SHALL be accepted when `Object.prototype.toString` yields `[object Date]` and the time is finite, including when the object was created in another engine context and has none of the library's date extensions. The check SHALL NOT use `instanceof`.

#### Scenario: Foreign date serializes without a type error

- **GIVEN** the date `2026-11-30 23:59:59` from another context, without local serialization
- **WHEN** a script passes it to `upToMoment`
- **THEN** the call finishes without a type error
- **AND** the boundary date equals `2026-11-30T23:59:59`

### Requirement: An operation moment becomes an operation boundary

A moment SHALL be an object that is not a date, with a valid date and a non-empty meta-object string. The boundary SHALL carry the meta object and the number, and SHALL serialize the date the same way as a date boundary, through a local copy.

#### Scenario: Moment fields are copied

- **WHEN** a script calls `beforeMoment` with the moment `2026-10-22 12:37:59`, the meta object `operation.su_supplier_order`, and number 7
- **THEN** the boundary date equals `2026-10-22T12:37:59`, and the meta object and the number match the moment

#### Scenario: Hand-built moment with a foreign date

- **GIVEN** a moment built by hand, whose date was created in another context
- **WHEN** a script passes it to `beforeMoment`
- **THEN** the call finishes without a type error
- **AND** the date is serialized from a local copy

### Requirement: An invalid boundary argument fails before the request

A string, a number, `null`, `undefined`, an object without a date or a meta object, and an invalid date SHALL produce the error `<method>: argument must be a Date or a moment.` The request SHALL NOT be sent. The boundary list SHALL stay as it was.

#### Scenario: Rejected values do not change the list

- **WHEN** a script passes `'2026-11-01'`, `null`, `{}`, or `new Date(NaN)`
- **THEN** the method fails with that error
- **AND** the boundary list does not change

### Requirement: excludeOwn is forwarded unchanged

`options.excludeOwn` SHALL be stored as `true` or `false`. If the option is omitted, the field SHALL be `null`. The library MUST NOT choose a default: the server chooses it.

#### Scenario: Explicit false is kept

- **WHEN** a script passes `{ excludeOwn: false }`
- **THEN** the boundary field `excludeOwn` equals `false`

#### Scenario: Omitted options become null

- **WHEN** a script does not pass `options`
- **THEN** `excludeOwn` equals `null`

### Requirement: column is allowed for date boundaries only

`options.column` SHALL be copied as given only for a date boundary. Together with a moment, the method SHALL fail with `<method>: options.column is allowed for date boundaries only.` and SHALL NOT change the boundary list. The library MUST NOT check that the column exists or check its type.

#### Scenario: Date boundary keeps the column name

- **WHEN** a script calls a date boundary with `{ column: 'delivery_date' }`
- **THEN** the boundary `column` equals `delivery_date`

#### Scenario: Moment with column is rejected

- **WHEN** a script passes a moment and `{ column: 'delivery_date' }`
- **THEN** the method fails with that error
- **AND** the boundary list does not change

### Requirement: Several boundaries stay in call order

Each successful call SHALL append a boundary to the list. Every boundary SHALL be kept, and the server SHALL apply them together.

#### Scenario: Lower and upper bounds

- **WHEN** a script calls `fromMoment` with date A, then `upToMoment` with date B
- **THEN** the list contains two boundaries in that order, with kinds 2 and 1

### Requirement: moment builds a detached operation moment

`moment(header, metaObject)` SHALL return a new object `{ date, metaObject, number }`. `date` SHALL be a local copy. A later change to the header, including a change to the time of the original date, MUST NOT change the moment. The moment SHALL NOT store a reference to the header or to its date object.

#### Scenario: Header date and number are copied

- **WHEN** a script calls `moment({ date: new Date(2026, 9, 22, 12, 37, 59), number: 7 }, 'operation.su_supplier_order')`
- **THEN** the moment contains that date, the meta object `operation.su_supplier_order`, and number 7
- **AND** the moment's date object is not the header's date

#### Scenario: Header string date is local

- **WHEN** `header.date` equals `'2026-10-22T12:37:59'`
- **THEN** the moment contains the same local date as `new Date(2026, 9, 22, 12, 37, 59)`

#### Scenario: Later header edits do not change the moment

- **WHEN** the header number, the time of the original date, or `header.date` itself changes after the call
- **THEN** the moment's time and number stay as they were

#### Scenario: Foreign header date becomes a local date

- **GIVEN** `header.date` was created in another context and has none of the library's date extensions
- **WHEN** a script calls `moment`
- **THEN** the moment's date has the same time and is a local date with the library extensions

### Requirement: moment requires a meta object and a valid header

An empty or non-string `metaObject` SHALL produce `Error('moment: operation meta object is not specified.')`. A header that is not an object SHALL produce `Error('moment: header is required.')`. A missing or invalid `header.date` SHALL produce `Error('moment: header.date is not a valid date.')`. The date SHALL be a `Date` object or a string that `new Date` can parse. The library MUST NOT substitute the form's meta object.

#### Scenario: Missing meta object

- **WHEN** the second argument is missing, is not a string, or equals `''`
- **THEN** the call fails with the error that the meta object is not specified

#### Scenario: Missing or invalid header

- **WHEN** the header equals `null`, has no date, or the date equals `'abc'`
- **THEN** the call fails with the corresponding error

### Requirement: An empty operation number is null

The number SHALL be taken from `header.number`. The values `undefined`, `null`, `''`, and `0` SHALL be stored as `null` and SHALL mean a new operation for the server.

#### Scenario: Empty numbers collapse to null

- **WHEN** the header number equals `undefined`, `null`, `''`, or `0`
- **THEN** the moment number equals `null`

### Requirement: The query body sends every boundary field

The model JSON SHALL include `kind`, `date`, `metaObject`, `number`, `excludeOwn`, and `column` on every boundary. `kind` SHALL be a number. A missing value SHALL be `null`, not an omitted field.

#### Scenario: Date boundary matches the server contract

- **WHEN** a model with `upToMoment` at `2026-11-30T23:59:59` is serialized to JSON
- **THEN** the `boundaries` element equals `{"kind":1,"date":"2026-11-30T23:59:59","metaObject":null,"number":null,"excludeOwn":null,"column":null}`

### Requirement: A plain object restores boundary entries

The model constructor SHALL copy `boundaries` into new boundary objects, replacing `undefined` with `null`. A missing field SHALL yield an empty list.

#### Scenario: Round trip restores the same fields

- **WHEN** a model is serialized to JSON and a new model is created from that object
- **THEN** the boundaries are restored with the same six fields
