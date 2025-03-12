// eslint-disable-next-line import/no-cycle
import { DataTable } from './dataTable';
import { ColumnDescription } from './columnDescription';

export class DistributionProcessor {
    distributionKind: string;
    primaryTable: DataTable;
    secondaryTable: DataTable;
    predicate: (primaryRow: any, joinedRow: any) => boolean;
    sortColumn: string;
    distributionColumn: string;
    distributionColumnAlias: string;
    columnsSettings: ColumnDescription[];

    constructor(
        distributionKind: string,
        primaryTable: DataTable,
        secondaryTable: DataTable,
        predicate: (primaryRow: any, joinedRow: any) => boolean,
        sortColumn: string,
        distributionColumn: string,
        columnSettings: any[],
    ) {
        this.distributionKind = distributionKind;
        this.primaryTable = primaryTable;
        this.secondaryTable = secondaryTable;
        this.predicate = predicate;
        this.sortColumn = sortColumn;
        this.distributionColumn = distributionColumn;

        this.columnsSettings = [];
        if (columnSettings && columnSettings.length > 0) {
            columnSettings.forEach((column) => {
                this.columnsSettings.push(new ColumnDescription(column));
            });
        }

        this.distributionColumnAlias = this.distributionColumn;
        if (this.columnsSettings.length) {
            const distributionColumnSettings = this.columnsSettings.find(
                (column) => column.name === this.distributionColumn,
            );
            if (distributionColumnSettings) {
                this.distributionColumnAlias = distributionColumnSettings.alias;
            }
        }
    }

    process(): DataTable {
        if (!(this.primaryTable instanceof DataTable)) {
            throw new Error('DistributionProcessor. primaryTable must be DataTable');
        }

        if (!(this.secondaryTable instanceof DataTable)) {
            throw new Error('DistributionProcessor. secondaryTable must be DataTable');
        }

        if (!Array.isArray(this.columnsSettings)) {
            throw new Error('DistributionProcessor. columnSettings must be an Array');
        }

        const resultTable = new DataTable();

        this.createColumns(resultTable, this.columnsSettings);

        // Order by period column.
        const sortOrder = this.distributionKind === 'fifo' ? 'asc' : 'desc';
        this.secondaryTable.rows.sort(
            (a, b): number => this.sortFunction(a, b, this.sortColumn, sortOrder),
        );

        // Fill result table.
        this.primaryTable.rows.forEach((primaryRow) => {
            const filterResult = this.secondaryTable.rows.filter(
                (secondaryRow) => this.predicate(primaryRow, secondaryRow),
            );

            if (filterResult.length) {
                let check = primaryRow[this.distributionColumn];
                filterResult.forEach((secondaryRow: any) => {
                    if (check > 0) {
                        const newRow = resultTable.newRow(true);
                        if (this.columnsSettings.length) {
                            this.columnsSettings.forEach((column: ColumnDescription) => {
                                if (column.isPrimaryTable) {
                                    newRow[column.alias] = primaryRow[column.name];
                                } else if (column.isSecondaryTable) {
                                    newRow[column.alias] = secondaryRow[column.name];
                                }
                            });
                        } else {
                            Object.entries(secondaryRow).forEach(([key, value]) => {
                                newRow[key] = value;
                            });
                            Object.entries(primaryRow).forEach(([key, value]) => {
                                newRow[key] = value;
                            });
                        }

                        const distributionValue = Math.min(check, secondaryRow[this.distributionColumn]);
                        newRow[this.distributionColumnAlias] = distributionValue;
                        check -= distributionValue;
                    }
                });

                // Add undistributed data.
                if (check > 0) {
                    this.addUndistributedData(
                        resultTable,
                        primaryRow,
                        check,
                        this.distributionColumnAlias,
                        this.columnsSettings,
                    );
                }
            }
        });

        return resultTable;
    }

    private addUndistributedData(
        resultTable: DataTable,
        primaryRow: any,
        check: number,
        distributionColumnAlias: string,
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
        newRow[distributionColumnAlias] = check;
    }

    private sortFunction(a: any, b: any, sortColumn: string, sortOrder: string): number {
        const valueA = a[sortColumn];
        const valueB = b[sortColumn];

        let comparison = 0;

        if (typeof valueA === 'string' && typeof valueB === 'string') {
            comparison = valueA.localeCompare(valueB);
        } else if (valueA instanceof Date && valueB instanceof Date) {
            comparison = valueA.getTime() - valueB.getTime();
        } else if (typeof valueA === 'number' && typeof valueB === 'number') {
            comparison = valueA - valueB;
        } else if (typeof valueA === 'boolean' && typeof valueB === 'boolean') {
            comparison = Number(valueA) - Number(valueB);
        }

        // Adjust comparison for descending order
        return sortOrder === 'asc' ? comparison : -comparison;
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
                const sourceColumn = this.secondaryTable.getColumn(column.name);
                if (!sourceColumn) {
                    throw new Error(`Column secondary.${column.name} not found.`);
                }
                resultTable.addColumn({ name: column.alias, dataType: sourceColumn.dataType });
            } else {
                throw new Error(`DistributionProcessor. Unknown table name: ${column.table}`);
            }
        });
    }

    private autoCreateColumns(resultTable: DataTable): void {
        this.primaryTable.columns.forEach((column) => {
            resultTable.addColumn(column);
        });

        this.secondaryTable.columns.forEach((column: any) => {
            const existingColumn = resultTable.getColumn(column.name);
            if (!existingColumn) {
                resultTable.addColumn(column);
            }
        });
    }
}
