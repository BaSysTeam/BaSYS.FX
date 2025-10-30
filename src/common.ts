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
            parsedObject.columns.forEach((column: any) => {
                tableResult.addColumn(column);
            });
            if (parsedObject.rows) {
                parsedObject.rows.forEach((row: any) => {
                    tableResult.addRow(row);
                });
            }
            return tableResult;
        }
    }

    return parsedObject;

}
