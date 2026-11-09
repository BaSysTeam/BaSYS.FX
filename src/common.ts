import { DataTableColumn } from './table/dataTableColumn';
import { DataTable } from './table/dataTable';
import { SelectQueryBuilder } from './query/selectQueryBuilder'
import { DecimalRecord, roundDecimal } from './numberRounding';

export function isEmpty(value: any): boolean {
    if (value) {
        return false;
    }
    return true;
}

export function isNotEmpty(value: any): boolean {
    return !isEmpty(value);
}

export function iif(
    condition: boolean,
    valueTrue: any,
    valueFalse: any,
): any {
    if (condition) {
        return valueTrue;
    }

    return valueFalse;
}

export function ifs(...args: any[]): any {
    for (let i = 0; i < args.length; i += 2) {
        const expressionResult = args[i];

        if (expressionResult) {
            if (i + 1 < args.length) {
                return args[i + 1];
            }
            return null;
        }
    }
    return null;
}

export function createTable(input: any):DataTable {
    let dataTable = new DataTable();

    if (Array.isArray(input)) {
        if (input != null && input.length) {
            input.forEach((column: any) => {
                if (typeof column === 'object' && column instanceof Object) {
                    dataTable.addColumn(column);
                } else if (typeof column === 'string') {
                    const newColumn = DataTableColumn.parse(column);
                    dataTable.addColumn(newColumn);
                } else {
                    throw new Error('Wrong column description');
                }
            });
        }
    } else if (typeof input === 'string') {
        const parts = input.split(',');
        dataTable = createTable(parts);
    }

    return dataTable;
}

export function parseNumber(input: string): number {
    const num = Number(input);
    return Number.isNaN(num) ? 0 : num;
}

export function dateTimeNow(): Date {
    return new Date();
}

export function dateDifference(startDate: Date, endDate: Date, kind: 'year' | 'month' | 'quarter' | 'day'): number {
    const diffInMilliseconds = endDate.getTime() - startDate.getTime();

    switch (kind) {
        case 'year':
            return endDate.getFullYear() - startDate.getFullYear();

        case 'month':
            return (endDate.getFullYear() - startDate.getFullYear())
                * 12 + (endDate.getMonth() - startDate.getMonth());

        case 'quarter':
            // eslint-disable-next-line no-case-declarations
            const startQuarter = Math.floor(startDate.getMonth() / 3);
            // eslint-disable-next-line no-case-declarations
            const endQuarter = Math.floor(endDate.getMonth() / 3);
            return (endDate.getFullYear() - startDate.getFullYear()) * 4 + (endQuarter - startQuarter);

        case 'day':
            return Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24));

        default:
            throw new Error('dateDifference. Invalid interval kind.');
    }
}

export function from(fromExpression: string): SelectQueryBuilder {
    if (!globalThis.QueriesProvider) {
        throw new Error("QueriesProvider is not defined. You must provide an implementation.");
    }
    const provider = new globalThis.QueriesProvider();

    const builder = new SelectQueryBuilder(provider);
    builder.from(fromExpression);

    return builder;
}

export function parse(json: string): any {
    if (!json) {
        return null;
    }

    const parsedObject = JSON.parse(json);

    if (parsedObject && typeof parsedObject === 'object' && '_name' in parsedObject) {

        if (parsedObject._name === "DataTable"){
            // Create DataTable.
            const tableResult = new DataTable();
            const columns = parsedObject.columns || parsedObject._columns;
            if (columns) {
                columns.forEach((column: any) => {
                    tableResult.addColumn(column);
                });
            }
            const rows = parsedObject.rows || parsedObject._rows;
            if (rows) {
                rows.forEach((row: any) => {
                    tableResult.addRow(row);
                });
            }
            return tableResult;
        }
    }

    return parsedObject;

}

// ── Rounding ────────────────────────────────────────────────────────────

/**
 * Rounds `value` to the nearest decimal place, with ties away from zero.
 *
 * The decision uses the canonical decimal digits of a finite input
 * (`String(value)`), including exponential notation. A positive `digits`
 * counts places after the decimal point, and a negative `digits` counts
 * places before it. An omitted or `undefined` precision means `0`.
 * The returned number does not keep trailing zeros.
 *
 * Only primitive numbers are accepted. Any other `value` or `digits`
 * throws `TypeError`, including a missing `value`. `digits` must be an
 * integer from `-308` through `324`. A fractional, non-finite, or
 * out-of-range precision throws `RangeError`. Type and precision checks
 * run before `NaN`, `Infinity`, and `-Infinity`, which are returned
 * unchanged. Every zero result is `+0`.
 *
 * `formatNumber` applies this same decimal rule and can pad the rounded
 * digits for display. Display precision is a separate range. The number
 * returned here is still an IEEE 754 binary value, so later arithmetic
 * is not exact decimal arithmetic.
 *
 * @param value Primitive number to round.
 * @param digits Decimal places, from `-308` to `324`. Defaults to `0`.
 * @returns The rounded number, or the original non-finite value.
 */
export function round(value: number, digits: number = 0): number {
    if (typeof value !== 'number') {
        throw new TypeError('round: value must be a number');
    }
    if (typeof digits !== 'number') {
        throw new TypeError('round: digits must be a number');
    }
    if (!Number.isInteger(digits) || digits < -308 || digits > 324) {
        throw new RangeError('round: digits must be an integer from -308 to 324');
    }
    if (!Number.isFinite(value)) {
        return value;
    }

    const record = roundDecimal(value, digits);
    if (record.coefficient === '0') {
        return 0;
    }
    if (record.unchanged) {
        return value;
    }

    const sign = record.negative ? '-' : '';
    return Number(sign + record.coefficient + 'e' + record.exponent);
}

// ── Formatting ──────────────────────────────────────────────────────────

export interface NumberFormatOptions {
    decimals?: number;
    decimalSeparator?: string;
    groupSeparator?: string;
}

export interface BooleanFormatOptions {
    trueValue?: string;
    falseValue?: string;
}

function parseNumberFormatString(fmt: string): { decimals: number; useGrouping: boolean } {
    const dotIndex = fmt.lastIndexOf('.');
    let decimals = 2;
    let useGrouping = false;

    if (dotIndex !== -1) {
        decimals = fmt.length - dotIndex - 1;
    } else {
        decimals = 0;
    }

    if (fmt.indexOf(',') !== -1) {
        useGrouping = true;
    }

    return { decimals, useGrouping };
}

function pad(n: number, width: number): string {
    const s = String(n);
    return s.length >= width ? s : '0'.repeat(width - s.length) + s;
}

function applyGrouping(integerStr: string, separator: string): string {
    if (separator === '' || integerStr.length <= 3) {
        return integerStr;
    }

    const parts: string[] = [];
    let i = integerStr.length;
    while (i > 3) {
        parts.unshift(integerStr.substring(i - 3, i));
        i -= 3;
    }
    parts.unshift(integerStr.substring(0, i));
    return parts.join(separator);
}

function normalizeDisplayDecimals(decimals: number): number {
    // ToNumber, matching Number#toFixed. Number() would accept a bigint.
    const numeric = +decimals;
    let truncated: number;
    if (Number.isNaN(numeric)) {
        truncated = 0;
    } else if (!Number.isFinite(numeric)) {
        truncated = numeric;
    } else {
        truncated = Math.trunc(numeric);
    }
    if (Object.is(truncated, -0)) {
        truncated = 0;
    }
    if (truncated < 0 || truncated > 100) {
        throw new RangeError('formatNumber: decimals must be between 0 and 100');
    }
    return truncated;
}

function renderRoundedDecimal(
    record: DecimalRecord,
    decimals: number,
    decimalSeparator: string,
    groupSeparator: string,
    useGrouping: boolean,
): string {
    let integerPart: string;
    let fractionalPart = '';

    if (record.coefficient === '0') {
        integerPart = '0';
    } else if (record.exponent >= 0) {
        integerPart = record.coefficient + '0'.repeat(record.exponent);
    } else {
        const fractionalDigits = -record.exponent;
        if (record.coefficient.length > fractionalDigits) {
            integerPart = record.coefficient.substring(0, record.coefficient.length - fractionalDigits);
            fractionalPart = record.coefficient.substring(record.coefficient.length - fractionalDigits);
        } else {
            integerPart = '0';
            fractionalPart = '0'.repeat(fractionalDigits - record.coefficient.length) + record.coefficient;
        }
    }

    if (fractionalPart.length < decimals) {
        fractionalPart += '0'.repeat(decimals - fractionalPart.length);
    }

    if (useGrouping) {
        integerPart = applyGrouping(integerPart, groupSeparator);
    }

    let result = integerPart;
    if (decimals > 0) {
        result += decimalSeparator + fractionalPart;
    }

    if (record.negative && record.coefficient !== '0') {
        result = '-' + result;
    }

    return result;
}

/**
 * Formats a number as plain decimal text.
 *
 * A finite value uses the same canonical-decimal rule as `round`, with ties
 * away from zero. The rounded digits are written out directly and padded to
 * the display precision. They are not converted back to a binary number and
 * they are not rounded a second time. A rounded zero has no minus sign.
 *
 * Display precision stays in `0..100`. The default is `2`. The value is
 * first coerced like `toFixed` (`ToNumber`): `NaN` means `0`, and a finite
 * fraction truncates toward zero. A value that cannot be converted throws.
 * A nullish option keeps the default. This is narrower than `round`, which
 * accepts integers from `-308` to `324`. Precision outside `0..100` throws
 * `RangeError` before a non-finite value is turned into a token.
 *
 * Finite inputs are plain decimal text, including values whose canonical
 * form uses an exponent. For a valid precision, `NaN`, `Infinity`, and
 * `-Infinity` are the whole tokens `"NaN"`, `"Infinity"`, and `"-Infinity"`.
 *
 * The rendered text follows this decimal rule. Earlier releases used
 * `toFixed` and returned different text at several boundaries:
 * `formatNumber(1.005)` is now `"1.01"`, high-precision `0.1` keeps the
 * digits `0.10000000000000000000`, and `formatNumber(-0.004)` is `"0.00"`.
 */
export function formatNumber(value: number, formatOrOptions?: string | NumberFormatOptions): string {
    let decimals = 2;
    let decimalSeparator = '.';
    let groupSeparator = ' ';
    let useGrouping = true;

    if (typeof formatOrOptions === 'string') {
        const parsed = parseNumberFormatString(formatOrOptions);
        decimals = parsed.decimals;
        useGrouping = parsed.useGrouping;
    } else if (formatOrOptions) {
        decimals = formatOrOptions.decimals ?? decimals;
        decimalSeparator = formatOrOptions.decimalSeparator ?? decimalSeparator;
        groupSeparator = formatOrOptions.groupSeparator ?? groupSeparator;
    }

    const displayDecimals = normalizeDisplayDecimals(decimals);
    if (!Number.isFinite(value)) {
        if (Number.isNaN(value)) {
            return 'NaN';
        }
        return value > 0 ? 'Infinity' : '-Infinity';
    }

    const record = roundDecimal(value, displayDecimals);
    return renderRoundedDecimal(
        record,
        displayDecimals,
        decimalSeparator,
        groupSeparator,
        useGrouping,
    );
}

export function formatDate(value: Date, fmt: string = 'dd.MM.yyyy'): string {
    const year = value.getFullYear();
    const month = value.getMonth() + 1;
    const day = value.getDate();
    const hours24 = value.getHours();
    const hours12 = hours24 % 12 || 12;
    const minutes = value.getMinutes();
    const seconds = value.getSeconds();
    const millis = value.getMilliseconds();

    const tokens: Array<[RegExp, string]> = [
        [/yyyy/g, String(year)],
        [/yy/g, String(year).slice(-2)],
        [/MM/g, pad(month, 2)],
        [/M/g, String(month)],
        [/dd/g, pad(day, 2)],
        [/d/g, String(day)],
        [/HH/g, pad(hours24, 2)],
        [/H/g, String(hours24)],
        [/hh/g, pad(hours12, 2)],
        [/h/g, String(hours12)],
        [/mm/g, pad(minutes, 2)],
        [/m/g, String(minutes)],
        [/ss/g, pad(seconds, 2)],
        [/s/g, String(seconds)],
        [/SSS/g, pad(millis, 3)],
    ];

    // Replace tokens from longest to shortest using placeholders
    // to prevent partial replacement conflicts.
    const placeholders: string[] = [];
    let result = fmt;

    for (let i = 0; i < tokens.length; i++) {
        const [regex, replacement] = tokens[i];
        const placeholder = `\x00${i}\x00`;
        placeholders.push(replacement);
        result = result.replace(regex, placeholder);
    }

    for (let i = 0; i < placeholders.length; i++) {
        const placeholder = `\x00${i}\x00`;
        result = result.split(placeholder).join(placeholders[i]);
    }

    return result;
}

export function formatBoolean(value: boolean, options?: BooleanFormatOptions): string {
    const trueValue = options?.trueValue ?? 'true';
    const falseValue = options?.falseValue ?? 'false';
    return value ? trueValue : falseValue;
}

/**
 * Formats a number, date, or boolean.
 * A number is passed to `formatNumber` and uses that function's decimal rule.
 */
export function format(
    value: number | Date | boolean,
    formatOrOptions?: string | NumberFormatOptions | BooleanFormatOptions,
): string {
    if (typeof value === 'number') {
        return formatNumber(value, formatOrOptions as string | NumberFormatOptions);
    }

    if (value instanceof Date) {
        return formatDate(value, formatOrOptions as string | undefined);
    }

    if (typeof value === 'boolean') {
        return formatBoolean(value, formatOrOptions as BooleanFormatOptions | undefined);
    }

    throw new Error('format: unsupported value type');
}
