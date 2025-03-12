import { DataTable } from './dataTable';

export class UnionProcessor {
    primaryTable: DataTable;
    tableToUnion: DataTable;

    constructor(dataTable: DataTable, tableToUnion: DataTable) {
        this.primaryTable = dataTable;
        this.tableToUnion = tableToUnion;
    }

    process(unionAll: boolean): DataTable {
        if (!(this.primaryTable instanceof DataTable)) {
            throw new Error('UnionProcessor. primaryTable must be DataTable');
        }

        if (!(this.tableToUnion instanceof DataTable)) {
            throw new Error('UnionProcessor. tableToUnion must be DataTable');
        }

        if (unionAll) {
            return this.unionAll();
        }

        return this.union();
    }

    unionAll(): DataTable {
        const resultTable = new DataTable();

        this.createColumns(resultTable);

        // Fill rows from primary table.
        this.primaryTable.rows.forEach((row: any) => {
            this.createFillNewRow(resultTable, row, true);
        });

        // Fill rows from tableToUnion.
        this.tableToUnion.rows.forEach((row: any) => {
            this.createFillNewRow(resultTable, row, true);
        });

        return resultTable;
    }

    union(): DataTable {
        const resultTable = new DataTable();

        this.createColumns(resultTable);

        // Map to find existing rows.
        const mapRows = new Map<string, boolean>();

        // Fill rows from primary table.
        this.primaryTable.rows.forEach((row: any) => {
            const newRow = this.createFillNewRow(resultTable, row, false);

            const rowKey = this.buildCompositeKey(newRow);

            const existingRow = mapRows.get(rowKey);
            if (!existingRow) {
                mapRows.set(rowKey, true);
                resultTable.addRow(newRow);
            }
        });

        // Fill rows from tableToUnion.
        this.tableToUnion.rows.forEach((row: any) => {
            const newRow = this.createFillNewRow(resultTable, row, false);

            const rowKey = this.buildCompositeKey(newRow);

            const existingRow = mapRows.get(rowKey);
            if (!existingRow) {
                mapRows.set(rowKey, true);
                resultTable.addRow(newRow);
            }
        });

        return resultTable;
    }

    private createColumns(resultTable: DataTable): void {
        this.primaryTable.columns.forEach((column) => {
            resultTable.addColumn(column);
        });

        this.tableToUnion.columns.forEach((column: any) => {
            const existingColumn = resultTable.getColumn(column.name);
            if (!existingColumn) {
                resultTable.addColumn(column);
            }
        });
    }

    private buildCompositeKey(row: any): string {
        let rowKey = '';
        Object.entries(row).forEach(([key, value]) => {
            rowKey += `${key}:${value}|`;
        });
        return rowKey;
    }

    private createFillNewRow(resultTable: DataTable, sourceRow: any, pushNewRow: boolean): any {
        const newRow = resultTable.newRow(pushNewRow);
        Object.entries(sourceRow).forEach(([key, value]) => {
            newRow[key] = value;
        });

        return newRow;
    }
}
