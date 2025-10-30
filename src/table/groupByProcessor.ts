// eslint-disable-next-line import/no-cycle
import { DataTable } from './dataTable';
import { DataTableColumn } from './dataTableColumn';
import { GroupingColumn } from './groupingColumn';

export class GroupByProcessor {
    dataTable: DataTable;
    keyColumns: GroupingColumn[];
    groupingColumns: GroupingColumn[];

    constructor(dataTable: DataTable, keyColumns: any[], groupingColumns: any[]) {
        this.dataTable = dataTable;

        this.keyColumns = this.parseGroupingColumns(keyColumns);
        this.groupingColumns = this.parseGroupingColumns(groupingColumns);
    }

    process(): DataTable {
        // Result DataTable.
        const groupedTable = new DataTable();

        // Map for fast column search.
        const sourceColumnsMap = new Map<string, DataTableColumn>();
        this.dataTable.columns.forEach((column: any) => {
            sourceColumnsMap.set(column.name, column);
        });

        // Crete key columns in result DataTable.
        this.createKeyColumns(groupedTable, sourceColumnsMap);

        // Create temp column to store composite key.
        const keyColumnName = '__key';
        this.dataTable.addColumn({ name: keyColumnName });

        // Create grouping columns in result DataTable.
        this.createGroupingColumns(groupedTable, sourceColumnsMap);

        // Collect unique combinations of key columns.
        const keyMap = this.collectAllKeys(keyColumnName);

        // Filter rows by key columns.
        keyMap.forEach((keyObject: any, key: string) => {
            // Get all rows with the same composite key.
            const rowsFiltered = this.dataTable.rows.filter((row: any) => row[keyColumnName] === key);

            // Calculate totals.
            const totals = this.initTotals(sourceColumnsMap);
            this.performCalculations(rowsFiltered, totals);

            // Create new row in result DataTable and fill properties.
            this.createFillNewRow(groupedTable, keyObject, totals);
        });

        return groupedTable;
    }

    private parseGroupingColumns(source: any[]): GroupingColumn[] {
        const columns: GroupingColumn[] = [];

        if (!source) {
            return columns;
        }

        source.forEach((item) => {
            if (typeof item === 'string') {
                const gColumn = new GroupingColumn({ name: item });
                columns.push(gColumn);
            } else if (typeof item === 'object') {
                const gColumn = new GroupingColumn(item);
                columns.push(gColumn);
            }
        });

        return columns;
    }

    private createKeyColumns(
        groupedTable: DataTable,
        sourceColumnsMap: Map<string, DataTableColumn>,
    ): void {
        this.keyColumns.forEach((groupingColumn: GroupingColumn) => {
            const column = sourceColumnsMap.get(groupingColumn.name);

            if (!column) {
                throw new Error(`Column ${groupingColumn.name} not found`);
            }

            groupedTable.addColumn(column);
        });
    }

    private createGroupingColumns(
        groupedTable: DataTable,
        sourceColumnsMap: Map<string, DataTableColumn>,
    ): void {
        this.groupingColumns.forEach((gColumn: GroupingColumn) => {
            const column = sourceColumnsMap.get(gColumn.name);
            if (!column) {
                throw new Error(`Column ${gColumn.name} not found`);
            }

            groupedTable.addColumn({
                name: gColumn.alias,
                dataType: column.dataType,
                defaultValue: column.defaultValue,
            });
        });
    }

    private collectAllKeys(keyColumnName: string):Map<string, any> {
        const keyMap = new Map<string, any>();

        this.dataTable.rows.forEach((row: any) => {
            const keyObject: any = {};
            let key = '';
            this.keyColumns.forEach((gColumn: GroupingColumn) => {
                keyObject[gColumn.name] = row[gColumn.name];
                key += `${gColumn.name}:${row[gColumn.name]}|`;
            });
            if (!keyMap.has(key)) {
                keyMap.set(key, keyObject);
            }
            row[keyColumnName] = key;
        });

        return keyMap;
    }

    private initTotals(sourceColumnsMap: Map<string, any>): any {
        const totals: any = {};

        this.groupingColumns.forEach((gColumn: GroupingColumn) => {
            const sourceColumn = sourceColumnsMap.get(gColumn.name);
            if (!sourceColumn) {
                throw new Error(`Column ${gColumn.name} not found`);
            }

            totals[gColumn.alias] = sourceColumn.defaultValue;
            if (gColumn.aggregate === 'min' || gColumn.aggregate === 'max') {
                totals[gColumn.alias] = undefined;
            } else if (gColumn.aggregate === 'count') {
                totals[gColumn.alias] = 0;
            } else if (gColumn.aggregate === 'concat') {
                totals[gColumn.alias] = '';
            }
        });

        return totals;
    }

    private performCalculations(filterResult:any[], totals: any): any {
        filterResult.forEach((row: any) => {
            this.groupingColumns.forEach((gColumn: GroupingColumn) => {
                const value = row[gColumn.name];
                if (gColumn.aggregate === 'sum') {
                    totals[gColumn.alias] += value;
                } else if (gColumn.aggregate === 'avg') {
                    totals[gColumn.alias] += value;
                } else if (gColumn.aggregate === 'min') {
                    if (totals[gColumn.alias] === undefined || value < totals[gColumn.alias]) {
                        totals[gColumn.alias] = value;
                    }
                } else if (gColumn.aggregate === 'max') {
                    if (totals[gColumn.alias] === undefined || value > totals[gColumn.alias]) {
                        totals[gColumn.alias] = value;
                    }
                } else if (gColumn.aggregate === 'count') {
                    if (value) {
                        totals[gColumn.alias] += 1;
                    }
                } else if (gColumn.aggregate === 'concat') {
                    if (value != null && value !== undefined) {
                        totals[gColumn.alias] += (totals[gColumn.alias] ? gColumn.delimiter : '') + value.toString();
                    }
                } else {
                    throw new Error(`Unknown aggregate function ${gColumn.aggregate}`);
                }
            });
        });

        this.groupingColumns.forEach((gColumn: GroupingColumn) => {
            if (gColumn.aggregate === 'avg') {
                // eslint-disable-next-line operator-assignment
                totals[gColumn.alias] = totals[gColumn.alias] / filterResult.length;
            }
        });
    }

    private createFillNewRow(groupedTable: DataTable, keyObject: any, totals: any): void {
        const newRow = groupedTable.newRow();
        Object.entries(keyObject)
            .forEach(([key, value]) => {
                newRow[key] = value;
            });
        Object.entries(totals)
            .forEach(([key, value]) => {
                newRow[key] = value;
            });
    }
}
