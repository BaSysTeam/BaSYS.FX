# Spec Delta

## Purpose

Provide consistent decimal rounding for numeric calculations and formatted numeric text in BaSYS applications, with predictable tie behavior and explicit limits of numeric output and display precision.

## ADDED Requirements

### Requirement: Public numeric rounding function

The package SHALL export a synchronous function `round(value: number, digits?: number): number`. A missing second argument, or an explicit `undefined`, SHALL mean `digits = 0`. A positive precision sets digits after the decimal point. A negative precision sets places before the decimal point. The function SHALL return a number without appending trailing zeros.

#### Scenario: Package access and default precision

- **WHEN** a consumer imports `round` from the package and calls `round(12.6)` or `round(12.6, undefined)`
- **THEN** each call returns the number `13`

#### Scenario: Positive and negative precision

- **WHEN** `round(1234.567, 2)`, `round(1234.567, -2)`, and `round(1.2, 2)` are called
- **THEN** the results equal `1234.57`, `1200`, and the number `1.2` respectively

### Requirement: Nearest value, with ties away from zero

The function SHALL choose the nearest multiple of `10^(-digits)` in decimal arithmetic. When the distances are equal, the function SHALL choose the value with the larger absolute value. The rule SHALL be symmetric with respect to sign.

#### Scenario: Rounding to an integer on both sides of a tie

- **WHEN** `1.49`, `1.5`, `1.51`, `-1.49`, `-1.5`, and `-1.51` are rounded with precision `0`
- **THEN** the results equal `1`, `2`, `2`, `-1`, `-2`, and `-2` respectively

#### Scenario: Ties in the fractional and integer parts

- **WHEN** `round(1.25, 1)`, `round(-1.25, 1)`, `round(1250, -2)`, and `round(-1250, -2)` are called
- **THEN** the results equal `1.3`, `-1.3`, `1300`, and `-1300` respectively

#### Scenario: Ties between zero and one rounding unit

- **WHEN** `round(5, -1)` and `round(-5, -1)` are called
- **THEN** the results equal `10` and `-10` respectively

#### Scenario: Values below and above half a rounding unit

- **WHEN** `round(4.9, -1)`, `round(-4.9, -1)`, `round(5.1, -1)`, and `round(-5.1, -1)` are called
- **THEN** the first two results are positive zero, and the remaining results equal `10` and `-10` respectively

#### Scenario: Subnormal ties between zero and one rounding unit

- **WHEN** `round(5e-323, 322)` and `round(-5e-323, 322)` are called
- **THEN** the results equal `1e-322` and `-1e-322` respectively

#### Scenario: Subnormal values below and above half a rounding unit

- **WHEN** `round(4e-323, 322)`, `round(-4e-323, 322)`, `round(6e-323, 322)`, and `round(-6e-323, 322)` are called
- **THEN** the first two results are positive zero, and the remaining results equal `1e-322` and `-1e-322` respectively

### Requirement: Decimal interpretation of Number

The function SHALL round the decimal value of the canonical `String(value)` of a finite input, including exponential notation. The resulting decimal value SHALL be converted to the nearest representable `number` by ECMAScript rules. An input that already matches the precision SHALL be preserved, except for zero normalization.

#### Scenario: Typical decimal ties

- **WHEN** `round(1.005, 2)`, `round(2.675, 2)`, `round(1.255, 2)`, and `round(10.075, 2)` are called, and the same calls are made with negative arguments
- **THEN** the positive results equal `1.01`, `2.68`, `1.26`, and `10.08`, and the negative results equal the corresponding numbers with a minus sign

#### Scenario: Value immediately below a tie

- **WHEN** `round(1.4999999999999998)` is called
- **THEN** the result equals `1`, with no artificial pull toward the tie

#### Scenario: Exponential notation and digit carry

- **WHEN** `round(1.25e-7, 8)`, `round(-1.25e-7, 8)`, and `round(9.995, 2)` are called
- **THEN** the results equal `1.3e-7`, `-1.3e-7`, and `10`

### Requirement: Argument type checks

The function SHALL accept only a primitive `number` for `value` and `digits`, except `undefined` for the default precision. Any other argument type SHALL cause a `TypeError`, with no implicit conversion and no substitution by zero. A missing `value` SHALL cause a `TypeError`.

#### Scenario: Non-numeric JavaScript input

- **WHEN** the string `'1.25'`, `null`, `undefined`, `true`, an object, an array, `new Number(1)`, or `Symbol()` is passed as `value`, or the function is called with no arguments
- **THEN** each call throws `TypeError`

#### Scenario: Non-numeric precision

- **WHEN** the string `'2'`, `null`, `false`, or an object is passed as `digits` for a numeric `value`
- **THEN** each call throws `TypeError`

### Requirement: Allowed precision

A numeric `digits` argument SHALL be an integer in the inclusive range from `-308` to `324`. A fractional, non-finite, or out-of-range precision SHALL cause a `RangeError`. Type and precision checks SHALL run before special numeric values of `value` are handled.

#### Scenario: Invalid numeric precision

- **WHEN** `digits` is `1.5`, `NaN`, `Infinity`, `-Infinity`, `-309`, or `325`
- **THEN** the call throws `RangeError`, including when `value` is `NaN` or `Infinity`

#### Scenario: Both bounds are allowed

- **WHEN** `round(1, -308)` and `round(1, 324)` are called
- **THEN** the results equal `0` and `1` respectively

### Requirement: Special values and zero normalization

For an allowed precision, the function SHALL preserve `NaN`, `Infinity`, and `-Infinity`. Any zero result, including an input of `-0` and rounding a small negative magnitude, SHALL be positive zero.

#### Scenario: Non-finite values are preserved

- **WHEN** `NaN`, `Infinity`, and `-Infinity` are rounded with an allowed precision
- **THEN** the results equal `NaN`, `Infinity`, and `-Infinity` respectively

#### Scenario: Negative zero is removed

- **WHEN** `round(-0)`, `round(0)`, and `round(-0.004, 2)` are called
- **THEN** each result satisfies `Object.is(result, 0) === true`

### Requirement: Extreme values of the Number range

The function SHALL apply the same decimal contract to finite numbers across the whole `Number` range, without a false overflow caused by intermediate scaling. If the final rounded result is not representable as a finite `Number`, the function SHALL return infinity of the corresponding sign.

#### Scenario: A large number does not overflow when precision is kept

- **WHEN** `round(Number.MAX_VALUE, 2)`, `round(-Number.MAX_VALUE, 324)`, and `round(1e308, -308)` are called
- **THEN** the results equal `Number.MAX_VALUE`, `-Number.MAX_VALUE`, and `1e308` respectively

#### Scenario: The final result overflows

- **WHEN** `round(Number.MAX_VALUE, -308)` and `round(-Number.MAX_VALUE, -308)` are called
- **THEN** the results equal `Infinity` and `-Infinity` respectively

#### Scenario: Subnormal numbers

- **WHEN** `round(Number.MIN_VALUE, 324)`, `round(Number.MIN_VALUE, 323)`, and `round(-Number.MIN_VALUE, 322)` are called
- **THEN** the results equal `Number.MIN_VALUE`, `1e-323`, and positive zero respectively

### Requirement: Consistent rounding for calculations and numeric formatting

For finite numeric input, `formatNumber` SHALL apply the same canonical-decimal interpretation and nearest-with-ties-away-from-zero rule as `round` at the effective display precision. It SHALL render the rounded decimal value directly, without rounding an intermediate binary `number` again. The numeric branch of `format` SHALL produce the same text as `formatNumber` for the same arguments.

#### Scenario: Decimal ties agree across all entry points

- **WHEN** `round(1.005, 2)`, `formatNumber(1.005)`, and `format(1.005)` are called
- **THEN** their results equal `1.01`, `"1.01"`, and `"1.01"` respectively

#### Scenario: Negative decimal ties are symmetric

- **WHEN** `formatNumber(-1.005)`, `formatNumber(2.675)`, `formatNumber(-2.675)`, and `format(-1.005, '0.00')` are called
- **THEN** their results equal `"-1.01"`, `"2.68"`, `"-2.68"`, and `"-1.01"` respectively

#### Scenario: Ties between zero and one display unit

- **WHEN** `formatNumber(0.005)`, `formatNumber(-0.005)`, `formatNumber(0.5, '0')`, and `formatNumber(-0.5, '0')` are called
- **THEN** their results equal `"0.01"`, `"-0.01"`, `"1"`, and `"-1"` respectively

### Requirement: Fixed decimal text retains decimal digits

For a finite input, numeric formatting SHALL return plain decimal text with exactly the effective number of fractional digits, padding zeros as necessary. It SHALL retain the canonical decimal digits selected by the rounding rule, including at high display precision and for inputs written in exponential notation. Formatting SHALL NOT expose binary expansion tails or use exponential notation.

#### Scenario: High precision pads a canonical decimal

- **WHEN** `round(0.1, 20)`, `formatNumber(0.1, { decimals: 20, groupSeparator: '' })`, and `format(0.1, { decimals: 20, groupSeparator: '' })` are called
- **THEN** the numeric result is `0.1` and both strings equal `"0.10000000000000000000"`

#### Scenario: Carry keeps the requested fractional width

- **WHEN** `formatNumber(9.995)` and `formatNumber(1.2)` are called
- **THEN** their results equal `"10.00"` and `"1.20"` respectively

#### Scenario: Large exponential input uses plain decimal text

- **WHEN** `formatNumber(1e21, { groupSeparator: '' })` is called
- **THEN** the result equals `"1000000000000000000000.00"`

### Requirement: Formatted zero has no negative sign

Numeric formatting SHALL normalize a rounded zero to unsigned text, including negative zero input and negative inputs whose decimal rounding produces zero. Fractional padding, decimal separators, and masks SHALL still apply to that zero.

#### Scenario: Negative magnitudes round to unsigned zero

- **WHEN** `formatNumber(-0)`, `formatNumber(-0.004)`, `format(-0.004)`, and `formatNumber(-0.49, '0')` are called
- **THEN** their results equal `"0.00"`, `"0.00"`, `"0.00"`, and `"0"` respectively

#### Scenario: Zero uses the selected decimal separator

- **WHEN** `formatNumber(-0.004, { decimalSeparator: ',' })` is called
- **THEN** the result equals `"0,00"`

### Requirement: Formatting masks and separators remain supported

`formatNumber` and the numeric branch of `format` SHALL retain existing public signatures, mask parsing, option defaults, grouping, and separator customization. Rounding SHALL be applied at the precision selected by those existing inputs before presentation separators are inserted.

#### Scenario: A mask selects precision and grouping

- **WHEN** `formatNumber(1000.005, '#,##0.00')`, `format(1000.005, '#,##0.00')`, and `formatNumber(1.005, '0.00')` are called
- **THEN** their results equal `"1 000.01"`, `"1 000.01"`, and `"1.01"` respectively

#### Scenario: Custom separators use the same rounding rule

- **WHEN** `formatNumber(1234.565, { decimalSeparator: ',', groupSeparator: '.' })` and `formatNumber(1234.565, { groupSeparator: '' })` are called
- **THEN** their results equal `"1.234,57"` and `"1234.57"` respectively

### Requirement: Formatting precision preserves its existing normalization

Formatting SHALL retain its default precision of two and existing `toFixed`-compatible precision coercion, truncation, and range checking: numeric `NaN` means zero, finite fractions truncate toward zero, and the normalized precision MUST be in `0..100`. Nullish option precision SHALL select the default. Invalid normalized precision SHALL throw `RangeError`, including for non-finite input values. The wider `round` precision range SHALL NOT widen formatting precision.

#### Scenario: Formatting normalizes fractional precision

- **WHEN** `formatNumber(1.005, { decimals: 2.9 })`, `formatNumber(1.005, { decimals: -0.9 })`, and `formatNumber(1.005, { decimals: NaN })` are called
- **THEN** their results equal `"1.01"`, `"1"`, and `"1"` respectively

#### Scenario: Formatting keeps default and upper-bound precision

- **WHEN** `formatNumber(1.2, { decimals: undefined })` and `formatNumber(1, { decimals: 100 })` are called
- **THEN** the first result is `"1.20"` and the second is `"1."` followed by exactly 100 zero digits

#### Scenario: Formatting rejects precision outside its own range

- **WHEN** numeric formatting is called with option `decimals` equal to `-1`, `101`, `Infinity`, or `-Infinity`
- **THEN** each call throws `RangeError`, also when the input value is `NaN` or infinite

### Requirement: Non-finite numbers are formatted as literal tokens

For valid display precision, `formatNumber` and the numeric branch of `format` SHALL render `NaN`, `Infinity`, and `-Infinity` as the exact tokens `"NaN"`, `"Infinity"`, and `"-Infinity"`. Grouping, separators, and fractional padding SHALL NOT modify these tokens.

#### Scenario: Default formatting preserves whole tokens

- **WHEN** `formatNumber(NaN)`, `formatNumber(Infinity)`, and `format(-Infinity)` are called
- **THEN** the results equal `"NaN"`, `"Infinity"`, and `"-Infinity"` respectively

#### Scenario: Custom presentation does not split a special token

- **WHEN** `formatNumber(-Infinity, { decimals: 3, decimalSeparator: ',', groupSeparator: '.' })` is called
- **THEN** the result equals `"-Infinity"`

### Requirement: Non-numeric utilities retain their existing behavior

The rounding integration SHALL preserve the behavior of `parseNumber`, `formatDate`, `formatBoolean`, the date and boolean branches of `format`, and its error for unsupported types. No new rounding or format option SHALL be added to those APIs.

#### Scenario: Date and boolean formatting still dispatch normally

- **WHEN** `format(new Date(2026, 0, 5), 'dd.MM.yyyy')` and `format(true, { trueValue: 'Yes', falseValue: 'No' })` are called
- **THEN** the results equal `"05.01.2026"` and `"Yes"` respectively

#### Scenario: Unsupported formatting input still fails

- **WHEN** JavaScript calls `format('hello')`
- **THEN** it throws the existing unsupported-type error
