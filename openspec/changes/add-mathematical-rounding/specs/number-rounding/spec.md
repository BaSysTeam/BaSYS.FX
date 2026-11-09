# Spec Delta

## Purpose

Provide one decimal rounding operation for numeric values used in BaSYS application calculations, with predictable tie behavior and explicit limits of the `Number` type.

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
