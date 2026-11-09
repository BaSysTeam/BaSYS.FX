# Rounding

`round` rounds a primitive number to a decimal place. Ties move away from zero. Finite values are read from their canonical decimal digits, the same digits `String(value)` shows, including exponential notation.

`formatNumber` uses this same decision for numeric text. `formatNumber(1.005)` is `"1.01"`, matching `round(1.005, 2)`. Display text can pad zeros; the number returned by `round` does not. See [format.md](format.md) for masks, separators, padding, and the formatting changes.

```typescript
import { round } from '@basysteam/basys-fx';

function round(value: number, digits: number = 0): number;
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `value` | `number` | — | Primitive number to round. Strings, `null`, booleans, objects, arrays, boxed numbers, and symbols are rejected. |
| `digits` | `number` | `0` | Integer precision from `-308` to `324`. A positive value counts digits after the decimal point. A negative value counts places before it. An omitted or explicit `undefined` argument means `0`. |

## Results

The return value is a `number`. It has no trailing zeros: `round(1.2, 2)` is `1.2`, not a string such as `"1.20"`.

For an allowed precision, `NaN`, `Infinity`, and `-Infinity` are returned unchanged. Every zero result is positive zero, including `round(-0)` and a negative magnitude that rounds to zero.

A non-number `value` or `digits` throws `TypeError`. A missing `value` throws `TypeError`. A fractional, non-finite, or out-of-range `digits` throws `RangeError`. Those checks run before a non-finite `value` is returned.

## Precision

`digits` selects the numeric result. It is not display precision.

| API | Precision | Text |
|-----|-----------|------|
| `round` | Integer from `-308` to `324`. Default `0`. | None. The result is a number, so trailing zeros are not kept. |
| `formatNumber` | Integer from `0` to `100` after the existing normalization. Default `2`. | Plain decimal text padded to that width. |

Later arithmetic on the returned number follows IEEE 754 binary floating point. It is not exact decimal arithmetic, and it cannot restore digits the `number` never held. Formatting keeps the rounded decimal digits as text, including zeros added only for display.

## Examples

```typescript
round(12.6);                 // 13
round(12.6, undefined);      // 13
round(1234.567, 2);          // 1234.57
round(1234.567, -2);         // 1200
round(1.2, 2);               // 1.2

round(1.5);                  // 2
round(-1.5);                 // -2
round(1.25, 1);              // 1.3
round(-1.25, 1);             // -1.3
round(1.005, 2);             // 1.01
round(-1.005, 2);            // -1.01
round(5, -1);                // 10
round(-5, -1);               // -10

round(9.995, 2);             // 10
round(1.25e-7, 8);           // 1.3e-7
round(1.4999999999999998);   // 1

round(NaN);                  // NaN
round(Infinity, 2);          // Infinity
round(-Infinity);            // -Infinity
Object.is(round(-0), 0);     // true
Object.is(round(-0.004, 2), 0); // true

round(Number.MAX_VALUE, 2);      // Number.MAX_VALUE
round(Number.MAX_VALUE, -308);   // Infinity
round(1, -308);                  // 0
round(1, 324);                   // 1
```

```typescript
round('1.25');    // TypeError
round(1, '2');    // TypeError
round(1, 1.5);    // RangeError
round(1, 325);    // RangeError
round(NaN, -309); // RangeError
```
