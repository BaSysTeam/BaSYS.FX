import { ColumnDescription } from './columnDescription';
import { DistributionProcessor } from './distributionProcessor';
import { UnionProcessor } from './unionProcessor';
import { GroupByProcessor } from './groupByProcessor';
import { JoinProcessor } from './joinProcessor';
import { DataTableColumn } from './dataTableColumn';

export class DataTable {
    private _name = "DataTable";
    private _columns: DataTableColumn[];
    private _rows: any[];


    constructor() {
        this._columns = [];
        this._rows = [];
    }

    public get columns(): DataTableColumn[] {
        return this._columns;
    }

    public get rows(): any[] {
        return this._rows;
    }

    getColumn(columnName: string): DataTableColumn | undefined {
        return this._columns.find((x) => x.name === columnName);
    }

    addColumn(input: any): DataTable {
        let column: DataTableColumn;
        if (typeof input === 'string') {
            column = DataTableColumn.parse(input);
        } else if (typeof input === 'object' && input instanceof Object) {
            column = new DataTableColumn(input);
        } else {
            throw new Error('Wrong column description');
        }

        const existingColumn = this.getColumn(column.name);

        if (existingColumn) {
            throw new Error(`Column ${column.name} already exists`);
        }

        this._columns.push(column);

        // Add default values of new column to existing rows.
        if (this._rows.length) {
            this._rows.forEach((row: any) => {
                row[column.name] = row[column.defaultValue];
            });
        }

        return this;
    }

    addColumns(input: any): DataTable {
        if (Array.isArray(input)) {
            if (input != null && input.length) {
                input.forEach((column: any) => {
                    if (typeof column === 'string') {
                        this.addColumn(column.trim());
                    } else if (typeof input === 'object' && input instanceof Object) {
                        this.addColumn(column);
                    } else {
                        throw new Error('Wrong column description');
                    }
                });
            }
        } else if (typeof input === 'string') {
            const parts = input.split(',');
            this.addColumns(parts);
        }

        return this;
    }

    clone(): DataTable {
        const newTable = new DataTable();

        this.columns.forEach((column: DataTableColumn) => newTable.addColumn(column));
        this.rows.forEach((row: any) => {
            const newRow = newTable.newRow();

            Object.entries(row).forEach(([key, value]) => {
                newRow[key] = value;
            });
        });

        return newTable;
    }

    deleteColumn(columnName: string): DataTable {
        const currentColumn = this.getColumn(columnName);
        if (!currentColumn) {
            return this;
        }
        const ind = this._columns.indexOf(currentColumn);
        this._columns.splice(ind, 1);

        // Remove column from existing rows.
        if (this._rows.length) {
            this._rows.forEach((row: any) => {
                delete row[columnName];
            });
        }
        return this;
    }

    deleteColumns(input: any): DataTable {
        if (Array.isArray(input)) {
            if (input != null && input.length) {
                input.forEach((column: any) => {
                    if (typeof column === 'string') {
                        this.deleteColumn(column.trim());
                    } else {
                        throw new Error('Wrong column description');
                    }
                });
            }
        } else if (typeof input === 'string') {
            const parts = input.split(',');
            this.deleteColumns(parts);
        }

        return this;
    }

    newRow(pushNewRow = true): any {
        if (!this._columns.length) {
            throw new Error('Add columns to DataTable before add rows');
        }

        const newRow: any = {};
        this._columns.forEach((column: any) => {
            newRow[column.name] = column.defaultValue;
        });
        if (pushNewRow) {
            this._rows.push(newRow);
        }

        return newRow;
    }

    addRow(data: any): DataTable {
        if (!this._columns.length) {
            throw new Error('Add columns to DataTable before add rows');
        }
        if (Array.isArray(data)) {
            this.fillRowFromArray(data);
        } else if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
            this.fillRowFromObject(data);
        } else {
            throw new Error('Data must be an array or an object');
        }
        return this;
    }

    load(data: any[]): DataTable {
        if (!this._columns.length) {
            throw new Error('Add columns to DataTable before add rows');
        }

        data.forEach((row: any) => {
            this.addRow(row);
        });

        return this;
    }

    clear(): DataTable {
        this._rows = [];

        return this;
    }

    select(input: any[] | string): DataTable {
        const resultTable = new DataTable();
        // If no specific columns provided, clone the whole table
        if (!input || (Array.isArray(input) && input.length === 0) || (typeof input === 'string' && input.trim().length === 0)) {
            return this.clone();
        }

        // Normalize input to ColumnDescription and create columns with aliases
        const toColumnDescription = (item: any): ColumnDescription => {
            if (typeof item === 'string') {
                const raw = item.trim();
                // Support patterns like: "product" or "product as item" (case-insensitive)
                const parts = raw.split(/\s+as\s+/i);
                const name = (parts[0] || '').trim();
                const alias = (parts[1] || name).trim();
                return new ColumnDescription({ name, alias });
            }
            return new ColumnDescription(item);
        };

        // If input is a single string with comma-separated items, split it first
        const items: any[] = typeof input === 'string'
            ? input.split(',').map((s) => s.trim()).filter((s) => s.length > 0)
            : input;

        const columns: ColumnDescription[] = items.map((c: any) => toColumnDescription(c));

        columns.forEach((col: ColumnDescription) => {
            const sourceColumn = this.getColumn(col.name);
            if (!sourceColumn) {
                throw new Error(`Column ${col.name} not found`);
            }
            resultTable.addColumn({ name: col.alias, dataType: sourceColumn.dataType });
        });

        // Copy rows mapping source values to aliases
        this._rows.forEach((row: any) => {
            const newRow = resultTable.newRow(true);
            columns.forEach((col: ColumnDescription) => {
                newRow[col.alias] = row[col.name];
            });
        });

        return resultTable;
    }

    filter(predicate: (row: any) => boolean): DataTable {
        this._rows = this._rows.filter((row) => predicate(row));
        return this;
    }

    orderBy(sortFunction: (a: any, b: any) => number): DataTable;
    orderBy(criteria: string | readonly string[]): DataTable;
    orderBy(criteria: any): DataTable {
        if (typeof criteria === 'function') {
            this._rows.sort(criteria);
            return this;
        }

        const parsed = parseOrderByCriteria(criteria);
        if (parsed === null) {
            return this;
        }

        parsed.forEach((criterion) => {
            this.checkExistingColumn(criterion.column);
        });
        sortRowsByOrderCriteria(this._rows, parsed);
        return this;
    }

    sum(columnName: string): number {
        this.checkExistingColumn(columnName);

        let result = 0;
        this._rows.forEach((row: any) => {
            result += row[columnName];
        });
        return result;
    }

    cumSum(cumColumn: string, baseColumn: string): DataTable {
        this.checkExistingColumn(cumColumn);
        this.checkExistingColumn(baseColumn);

        let cumSum = 0;
        this.rows.forEach((row) => {
            cumSum += row[baseColumn];
            row[cumColumn] = cumSum;
        });

        return this;
    }

    min(columnName: string): any {
        this.checkExistingColumn(columnName);

        let minValue:any;
        this._rows.forEach((row: any) => {
            const value = row[columnName];
            if (minValue === undefined || value < minValue) {
                minValue = value;
            }
        });

        return minValue;
    }

    max(columnName: string): any {
        this.checkExistingColumn(columnName);

        let maxValue: any;
        this._rows.forEach((row: any) => {
            const value = row[columnName];
            if (maxValue === undefined || value > maxValue) {
                maxValue = value;
            }
        });

        return maxValue;
    }

    avg(columnName: string): number {
        this.checkExistingColumn(columnName);

        if (!this._rows.length) {
            throw new Error('No rows found');
        }

        let sum = 0;
        let count = 0;
        this._rows.forEach((row: any) => {
            sum += row[columnName];
            count += 1;
        });

        return sum / count;
    }

    count(columnName = ''): number {
        if (!columnName) {
            return this._rows.length;
        }

        this.checkExistingColumn(columnName);

        let count = 0;
        this._rows.forEach((row: any) => {
            if (row[columnName]) {
                count += 1;
            }
        });

        return count;
    }

    toArray(columnName: string, distinctOnly: boolean = true): any[] {
        this.checkExistingColumn(columnName);

        const values: any[] = [];
        
        this._rows.forEach((row: any) => {
            values.push(row[columnName]);
        });

        if (distinctOnly) {
            // Return only distinct values using Set
            return Array.from(new Set(values));
        }

        return values;
    }

    process(predicate: (row: any) => void): DataTable {
        this._rows.forEach((row: any) => predicate(row));
        return this;
    }

    groupBy(keyColumns: string[], groupingColumns: any[]): DataTable {
        const processor = new GroupByProcessor(this, keyColumns, groupingColumns);

        return processor.process();
    }

    unionAll(tableToUnion: DataTable): DataTable {
        const processor = new UnionProcessor(this, tableToUnion);

        return processor.process(true);
    }

    union(tableToUnion: DataTable): DataTable {
        const processor = new UnionProcessor(this, tableToUnion);

        return processor.process(false);
    }

    innerJoin(
        tableToJoin:DataTable,
        predicate: (primaryRow:any, joinedRow:any)=>boolean,
        columnSettings: any[] = [],
    ): DataTable {
        return (new JoinProcessor('inner', this, tableToJoin, predicate, columnSettings)).process();
    }

    leftJoin(
        tableToJoin:DataTable,
        predicate: (primaryRow:any, joinedRow:any)=>boolean,
        columnSettings: any[] = [],
    ): DataTable {
        return (new JoinProcessor('left', this, tableToJoin, predicate, columnSettings)).process();
    }

    rightJoin(
        tableToJoin:DataTable,
        predicate: (primaryRow:any, joinedRow:any)=>boolean,
        columnSettings: any[] = [],
    ): DataTable {
        return (new JoinProcessor('left', tableToJoin, this, predicate, columnSettings)).process();
    }

    fullJoin(
        tableToJoin:DataTable,
        predicate: (primaryRow:any, joinedRow:any)=>boolean,
        columnSettings: any[] = [],
    ): DataTable {
        return (new JoinProcessor('full', this, tableToJoin, predicate, columnSettings)).process();
    }

    distributeFifo(
        distributionTable: DataTable,
        predicate: (primaryRow:any, joinedRow:any)=>boolean,
        sortColumn: string,
        distributionColumn: string,
        columnSettings: any[] = [],
    ): DataTable {
        return (new DistributionProcessor(
            'fifo',
            this,
            distributionTable,
            predicate,
            sortColumn,
            distributionColumn,
            columnSettings,
        )).process();
    }

    distributeLifo(
        distributionTable: DataTable,
        predicate: (primaryRow:any, joinedRow:any)=>boolean,
        sortColumn: string,
        distributionColumn: string,
        columnSettings: any[] = [],
    ): DataTable {
        return (new DistributionProcessor(
            'Lifo',
            this,
            distributionTable,
            predicate,
            sortColumn,
            distributionColumn,
            columnSettings,
        )).process();
    }

    unpivot(
        resultColumnConfig: any,
        pivotColumnNames: string[],
        userDefinedNumberColumnName: string | null = null,
        userDefinedNameColumnName: string | null = null,
    ) :DataTable {
        const resultTable = new DataTable();
        resultTable.addColumn(resultColumnConfig);

        const resultColumn = resultTable.columns[0];
        const numberColumnName = userDefinedNumberColumnName || `${resultColumn.name}_unpivot_number`;
        const nameColumnName = userDefinedNameColumnName || `${resultColumn.name}_unpivot_name`;

        resultTable.addColumn({ name: numberColumnName, dataType: 'number' });
        resultTable.addColumn({ name: nameColumnName });

        const sourceColumnNames: string[] = [];
        this._columns.forEach((column: any) => {
            if (!pivotColumnNames.includes(column.name)) {
                resultTable.addColumn(column);
                sourceColumnNames.push(column.name);
            }
        });

        this._rows.forEach((row: any) => {
            let columnNumber = 1;
            pivotColumnNames.forEach((pivotName: any) => {
                const newRow = resultTable.newRow(true);
                sourceColumnNames.forEach((sourceName: string) => {
                    newRow[sourceName] = row[sourceName];
                });
                newRow[numberColumnName] = columnNumber;
                newRow[nameColumnName] = pivotName;
                newRow[resultColumn.name] = row[pivotName];
                columnNumber += 1;
            });
        });

        return resultTable;
    }

    private fillRowFromArray(data: any[]): void {
        const newRow = this.newRow();
        this._columns.forEach((column: any, index: number) => {
            if (index <= data.length - 1) {
                newRow[column.name] = data[index];
            }
        });
    }

    private fillRowFromObject(data: any): void {
        const newRow = this.newRow();
        this._columns.forEach((column: any) => {
            if (Object.prototype.hasOwnProperty.call(data, column.name)) {
                newRow[column.name] = data[column.name];
            }
        });
    }

    private checkExistingColumn(columnName: string): boolean {
        const currentColumn = this.getColumn(columnName);
        if (!currentColumn) {
            throw new Error(`Column ${columnName} not found`);
        }

        return true;
    }
}

type OrderDirection = 'asc' | 'desc';

interface OrderCriterion {
    column: string;
    direction: OrderDirection;
}

function parseOrderByCriteria(criteria: any): OrderCriterion[] | null {
    if (typeof criteria === 'string') {
        if (/^\s*$/.test(criteria)) {
            return null;
        }
        return criteria.split(',').map((part) => parseOrderByCriterion(part));
    }

    if (Array.isArray(criteria)) {
        if (criteria.length === 0) {
            return null;
        }

        const parsed: OrderCriterion[] = [];
        for (let index = 0; index < criteria.length; index += 1) {
            if (!Object.prototype.hasOwnProperty.call(criteria, index) || typeof criteria[index] !== 'string') {
                throw new Error('orderBy: array element is not a string');
            }
            if (criteria[index].includes(',')) {
                throw new Error(`orderBy: invalid criterion '${criteria[index]}'`);
            }
            parsed.push(parseOrderByCriterion(criteria[index]));
        }
        return parsed;
    }

    throw new Error('orderBy: unsupported argument');
}

function parseOrderByCriterion(raw: string): OrderCriterion {
    const trimmed = raw.trim();
    if (trimmed.length === 0) {
        throw new Error('orderBy: empty criterion');
    }

    const tokens = trimmed.split(/\s+/);
    if (tokens.length === 1) {
        return { column: tokens[0], direction: 'asc' };
    }

    if (tokens.length === 2) {
        const direction = tokens[1].toLowerCase();
        if (direction === 'asc' || direction === 'desc') {
            return { column: tokens[0], direction };
        }
        throw new Error(`orderBy: unsupported direction '${tokens[1]}'`);
    }

    throw new Error(`orderBy: invalid criterion '${trimmed}'`);
}

function sortRowsByOrderCriteria(rows: any[], criteria: OrderCriterion[]): void {
    const decorated = rows.map((row, index) => ({ row, index }));
    decorated.sort((left, right) => {
        for (let index = 0; index < criteria.length; index += 1) {
            const criterion = criteria[index];
            const compared = compareOrderByValues(
                left.row[criterion.column],
                right.row[criterion.column],
                criterion.direction,
            );
            if (compared !== 0) {
                return compared;
            }
        }
        return left.index - right.index;
    });

    for (let index = 0; index < decorated.length; index += 1) {
        rows[index] = decorated[index].row;
    }
}

function compareOrderByValues(left: any, right: any, direction: OrderDirection): number {
    const leftMissing = isMissingOrderByValue(left);
    const rightMissing = isMissingOrderByValue(right);
    if (leftMissing || rightMissing) {
        if (leftMissing && rightMissing) {
            return 0;
        }
        return leftMissing ? 1 : -1;
    }

    const compared = comparePresentOrderByValues(left, right);
    return direction === 'desc' ? -compared : compared;
}

function isMissingOrderByValue(value: any): boolean {
    if (value === null || value === undefined) {
        return true;
    }
    if (typeof value === 'number') {
        return Number.isNaN(value);
    }
    if (isOrderByDate(value)) {
        return Number.isNaN(value.getTime());
    }
    return false;
}

function isOrderByDate(value: any): value is Date {
    return Object.prototype.toString.call(value) === '[object Date]';
}

function comparePresentOrderByValues(left: any, right: any): number {
    if (typeof left === 'number' && typeof right === 'number') {
        if (left < right) {
            return -1;
        }
        if (left > right) {
            return 1;
        }
        return 0;
    }

    if (typeof left === 'string' && typeof right === 'string') {
        if (left < right) {
            return -1;
        }
        if (left > right) {
            return 1;
        }
        return 0;
    }

    if (typeof left === 'boolean' && typeof right === 'boolean') {
        if (left === right) {
            return 0;
        }
        return left ? 1 : -1;
    }

    if (isOrderByDate(left) && isOrderByDate(right)) {
        const leftTime = left.getTime();
        const rightTime = right.getTime();
        if (leftTime < rightTime) {
            return -1;
        }
        if (leftTime > rightTime) {
            return 1;
        }
        return 0;
    }

    return 0;
}
