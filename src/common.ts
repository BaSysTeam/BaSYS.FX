import { DataTableColumn } from './table/dataTableColumn';
import { DataTable } from './table/dataTable';
import { SelectQueryBuilder } from './query/selectQueryBuilder'

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

    const isNegative = value < 0;
    const absValue = Math.abs(value);
    const fixed = absValue.toFixed(decimals);

    let integerPart: string;
    let fractionalPart: string | undefined;

    const pointIndex = fixed.indexOf('.');
    if (pointIndex !== -1) {
        integerPart = fixed.substring(0, pointIndex);
        fractionalPart = fixed.substring(pointIndex + 1);
    } else {
        integerPart = fixed;
    }

    if (useGrouping) {
        integerPart = applyGrouping(integerPart, groupSeparator);
    }

    let result = integerPart;
    if (fractionalPart !== undefined) {
        result += decimalSeparator + fractionalPart;
    }

    if (isNegative) {
        result = '-' + result;
    }

    return result;
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
