// eslint-disable-next-line import/no-cycle
import { DataTable } from './dataTable';
import { ColumnDescription } from './columnDescription';

const PROCESSED_COLUMN_NAME = '__processed';

export class JoinProcessor {
    joinKind: string;
    primaryTable: DataTable;
    tableToJoin: DataTable;
    predicate: (primaryRow: any, joinedRow: any) => boolean
    columnsSettings: ColumnDescription[];

    constructor(
        joinKind: string,
        primaryTable: DataTable,
        tableToJoin: DataTable,
        predicate: (primaryRow: any, joinedRow: any) => boolean,
        columnSettings: any[],
    ) {
        this.joinKind = joinKind;
        this.primaryTable = primaryTable;
        this.tableToJoin = tableToJoin;
        this.predicate = predicate;

        this.columnsSettings = [];
        if (columnSettings && columnSettings.length > 0) {
            columnSettings.forEach((column) => {
                this.columnsSettings.push(new ColumnDescription(column));
            });
        }
    }

    process(): DataTable {
        if (!(this.primaryTable instanceof DataTable)) {
            throw new Error('JoinProcessor. primaryTable must be DataTable');
        }

        if (!(this.tableToJoin instanceof DataTable)) {
            throw new Error('JoinProcessor. tableToJoin must be DataTable');
        }

        if (!Array.isArray(this.columnsSettings)) {
            throw new Error('JoinProcessor. columnSettings must be an Array');
        }

        switch (this.joinKind) {
            case 'inner':
            case 'left':
            case 'full':
                return this.performJoin(this.joinKind, this.columnsSettings);
            default:
                throw new Error(`JoinProcessor. Unknown joinKind: ${this.joinKind}`);
        }
    }

    private performJoin(joinKind: string, columnsSettings: ColumnDescription[]): DataTable {
        const resultTable = new DataTable();
        const isFullJoin = joinKind === 'full';
        const isInnerJoin = joinKind === 'inner';

        this.createColumns(resultTable, columnsSettings);

        this.tableToJoin.addColumn({ name: PROCESSED_COLUMN_NAME });

        this.primaryTable.rows.forEach((primaryRow: any) => {
            const filterResult = this.tableToJoin.rows.filter(
                (joinedRow: any) => this.predicate(primaryRow, joinedRow),
            );

            if (filterResult.length) {
                // InnerJoin.
                filterResult.forEach((joinedRow: any) => {
                    joinedRow[PROCESSED_COLUMN_NAME] = true;
                    this.createFillNewRow(resultTable, primaryRow, joinedRow, columnsSettings);
                });
            } else if (!isInnerJoin) {
                // LeftJoin and FullJoin. Add unprocessed rows from primaryTable.
                this.addUnprocessedRowsFromPrimaryTable(resultTable, primaryRow, columnsSettings);
            }
        });

        if (isFullJoin) {
            // FullJoin. Add unprocessed rows from tableToJoin.
            this.addUnprocessedRowsFromJoinedTable(resultTable, columnsSettings);
        }

        return resultTable;
    }

    private createFillNewRow(
        resultTable: DataTable,
        primaryRow: any,
        joinedRow: any,
        columnsSettings: ColumnDescription[],
    ): void {
        const newRow = resultTable.newRow(true);
        if (columnsSettings.length) {
            columnsSettings.forEach((column: ColumnDescription) => {
                if (column.isPrimaryTable) {
                    newRow[column.alias] = primaryRow[column.name];
                } else if (column.isSecondaryTable) {
                    newRow[column.alias] = joinedRow[column.name];
                }
            });
        } else {
            Object.entries(primaryRow).forEach(([key, value]) => {
                newRow[key] = value;
            });
            Object.entries(joinedRow).forEach(([key, value]) => {
                newRow[key] = value;
            });
        }
    }

    private addUnprocessedRowsFromPrimaryTable(
        resultTable: DataTable,
        primaryRow: any,
        columnsSettings: ColumnDescription[],
    ): void {
        const newRow = resultTable.newRow(true);
        if (columnsSettings.length) {
            columnsSettings.forEach((column: ColumnDescription) => {
                if (column.isPrimaryTable) {
                    newRow[column.alias] = primaryRow[column.name];
                }
            });
        } else {
            Object.entries(primaryRow).forEach(([key, value]) => {
                newRow[key] = value;
            });
        }
    }

    private addUnprocessedRowsFromJoinedTable(
        resultTable: DataTable,
        columnsSettings: ColumnDescription[],
    ): void {
        const unprocessedRows = this.tableToJoin.rows.filter(
            (joinedRow: any) => joinedRow[PROCESSED_COLUMN_NAME] !== true,
        );

        unprocessedRows.forEach((unprocessedRow: any) => {
            const newRow = resultTable.newRow(true);
            if (columnsSettings.length) {
                columnsSettings.forEach((column: ColumnDescription) => {
                    if (column.isSecondaryTable) {
                        newRow[column.alias] = unprocessedRow[column.name];
                    }
                });
            } else {
                Object.entries(unprocessedRow).forEach(([key, value]) => {
                    newRow[key] = value;
                });
            }
        });
    }

    private createColumns(resultTable: DataTable, columnSettings: ColumnDescription[]): void {
        if (columnSettings.length) {
            this.createColumnsBySettings(resultTable, columnSettings);
        } else {
            // Auto-create columns in result table.
            this.autoCreateColumns(resultTable);
        }
    }

    private createColumnsBySettings(
        resultTable: DataTable,
        columnSettings: ColumnDescription[],
    ): void {
        columnSettings.forEach((column) => {
            if (column.isPrimaryTable) {
                // Take column from primary table.
                const sourceColumn = this.primaryTable.getColumn(column.name);
                if (!sourceColumn) {
                    throw new Error(`Column primary.${column.name} not found.`);
                }
                resultTable.addColumn({ name: column.alias, dataType: sourceColumn.dataType });
            } else if (column.isSecondaryTable) {
                // Take column from secondary table.
                const sourceColumn = this.tableToJoin.getColumn(column.name);
                if (!sourceColumn) {
                    throw new Error(`Column secondary.${column.name} not found.`);
                }
                resultTable.addColumn({ name: column.alias, dataType: sourceColumn.dataType });
            } else {
                throw new Error(`JoinProcessor. Unknown table name: ${column.table}`);
            }
        });
    }

    private autoCreateColumns(resultTable: DataTable): void {
        this.primaryTable.columns.forEach((column) => {
            resultTable.addColumn(column);
        });

        this.tableToJoin.columns.forEach((column: any) => {
            const existingColumn = resultTable.getColumn(column.name);
            if (!existingColumn) {
                resultTable.addColumn(column);
            }
        });
    }
}
