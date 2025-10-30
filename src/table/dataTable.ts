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

    filter(predicate: (row: any) => boolean): DataTable {
        this._rows = this._rows.filter((row) => predicate(row));
        return this;
    }

    orderBy(sortFunction: (a: any, b: any) => number): DataTable {
        this._rows.sort(sortFunction);
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
