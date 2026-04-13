# Formatting Functions

Functions for formatting numbers, dates, and boolean values into human-readable strings.

All functions are pure JavaScript — no `Intl`, no browser or Node.js-specific APIs — and work identically in any environment.

## Quick Start

```typescript
import { format, formatNumber, formatDate, formatBoolean } from '@basysteam/basys-fx';

formatNumber(1234.5);                           // "1 234.50"
formatDate(new Date(2026, 2, 19));              // "19.03.2026"
formatBoolean(true);                            // "true"

// Unified dispatcher (auto-detects type)
format(1234.5);                                 // "1 234.50"
format(new Date());                             // "19.03.2026"
format(true);                                   // "true"
```

---

## formatNumber

```typescript
function formatNumber(value: number, format?: string | NumberFormatOptions): string;
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `value` | `number` | The number to format. |
| `format` | `string \| NumberFormatOptions` | Optional. A format string or an options object. |

### NumberFormatOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `decimals` | `number` | `2` | Number of digits after the decimal point. |
| `decimalSeparator` | `string` | `"."` | Character used as the decimal separator. |
| `groupSeparator` | `string` | `" "` (space) | Character used as the thousands group separator. Pass `""` to disable grouping. |

### Format Strings (ICU/CLDR-style)

Number format strings use the following symbols:

| Symbol | Meaning |
|--------|---------|
| `0` | Required digit (shows `0` if no digit present). |
| `#` | Optional digit (omitted if no digit present). |
| `.` | Decimal separator position. Digits after `.` define the number of decimal places. |
| `,` | Enables grouping (thousands separator). |

The actual separator characters used in output are the library defaults (`"."` for decimal, `" "` for groups).

### Examples

```typescript
// Default: 2 decimals, "." decimal, " " group separator
formatNumber(1234.5);                              // "1 234.50"
formatNumber(0);                                   // "0.00"
formatNumber(-9876.54);                            // "-9 876.54"

// Options object
formatNumber(1234.5678, { decimals: 3 });          // "1 234.568"
formatNumber(1234.5, { decimals: 0 });             // "1 235"
formatNumber(1234.5, {
    decimals: 1,
    decimalSeparator: ',',
    groupSeparator: '.',
});                                                 // "1.234,5"
formatNumber(1234567, { groupSeparator: '' });     // "1234567.00"

// Format string
formatNumber(1234.5, '#,##0.00');                  // "1 234.50"
formatNumber(1234.5, '#,##0.000');                 // "1 234.500"
formatNumber(1234.5, '0.0');                       // "1234.5"  (no grouping)
formatNumber(1234.5, '#,##0');                     // "1 235"   (no decimals)
formatNumber(1234.5, '0');                         // "1235"    (no grouping, no decimals)
```

---

## formatDate

```typescript
function formatDate(value: Date, format?: string): string;
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `value` | `Date` | — | The date to format. |
| `format` | `string` | `"dd.MM.yyyy"` | A format string using Unicode CLDR tokens. |

### Supported Tokens

| Token | Output | Description |
|-------|--------|-------------|
| `yyyy` | `2026` | 4-digit year |
| `yy` | `26` | 2-digit year |
| `MM` | `03` | Month, zero-padded (01–12) |
| `M` | `3` | Month (1–12) |
| `dd` | `05` | Day of month, zero-padded (01–31) |
| `d` | `5` | Day of month (1–31) |
| `HH` | `09` | Hour (24h), zero-padded (00–23) |
| `H` | `9` | Hour (24h) (0–23) |
| `hh` | `02` | Hour (12h), zero-padded (01–12) |
| `h` | `2` | Hour (12h) (1–12) |
| `mm` | `05` | Minute, zero-padded (00–59) |
| `m` | `5` | Minute (0–59) |
| `ss` | `09` | Second, zero-padded (00–59) |
| `s` | `9` | Second (0–59) |
| `SSS` | `042` | Milliseconds, 3 digits |

> **Note:** Uppercase `M` is month, lowercase `m` is minute — following the Unicode CLDR convention.

Any characters not matching a token are kept as-is (e.g., `"."`, `"-"`, `":"`, `" "`).

### Examples

```typescript
const date = new Date(2026, 2, 19, 14, 5, 9, 42);

formatDate(date);                                  // "19.03.2026"
formatDate(date, 'yyyy-MM-dd');                    // "2026-03-19"
formatDate(date, 'dd/MM/yy');                      // "19/03/26"
formatDate(date, 'd.M.yyyy');                      // "19.3.2026"
formatDate(date, 'yyyy-MM-dd HH:mm:ss');           // "2026-03-19 14:05:09"
formatDate(date, 'HH:mm');                         // "14:05"
formatDate(date, 'hh:mm:ss');                      // "02:05:09"
formatDate(date, 'yyyy-MM-dd HH:mm:ss.SSS');       // "2026-03-19 14:05:09.042"
```

---

## formatBoolean

```typescript
function formatBoolean(value: boolean, options?: BooleanFormatOptions): string;
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `value` | `boolean` | The boolean to format. |
| `options` | `BooleanFormatOptions` | Optional. Custom labels for `true`/`false`. |

### BooleanFormatOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `trueValue` | `string` | `"true"` | String representation for `true`. |
| `falseValue` | `string` | `"false"` | String representation for `false`. |

### Examples

```typescript
formatBoolean(true);                                        // "true"
formatBoolean(false);                                       // "false"
formatBoolean(true, { trueValue: 'Yes', falseValue: 'No' }); // "Yes"
formatBoolean(false, { trueValue: 'Да', falseValue: 'Нет' }); // "Нет"
```

---

## format (unified)

```typescript
function format(
    value: number | Date | boolean,
    formatOrOptions?: string | NumberFormatOptions | BooleanFormatOptions,
): string;
```

A unified dispatcher that auto-detects the type of `value` and delegates to the appropriate specialized function:

- `number` → `formatNumber`
- `Date` → `formatDate`
- `boolean` → `formatBoolean`

Throws `Error` for unsupported types.

### Examples

```typescript
format(1234.5);                                    // "1 234.50"
format(1234.5, { decimals: 1, decimalSeparator: ',' }); // "1 234,5"
format(1234.5, '#,##0.000');                       // "1 234.500"

format(new Date(2026, 2, 19));                     // "19.03.2026"
format(new Date(2026, 2, 19), 'yyyy-MM-dd');       // "2026-03-19"

format(true);                                      // "true"
format(false, { trueValue: '1', falseValue: '0' }); // "0"
```
