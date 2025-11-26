import { QueryParameter } from './queryParameter';
import { DbType } from './dbTypes';
import { SelectQueryModel } from './selectQueryModel';
import { DataTable } from '../table/dataTable';
import { IQueriesProvider } from './queriesProvider';

export class SelectQueryBuilder {
    model: SelectQueryModel;
    provider : IQueriesProvider;

    constructor(provider : IQueriesProvider) {
        this.model = new SelectQueryModel(null);
        this.provider = provider;
    }

    from(fromExpression: string): SelectQueryBuilder {
        this.model.fromExpression = fromExpression;
        return this;
    }

    top(topValue: number): SelectQueryBuilder {
        this.model.top = topValue;
        return this;
    }

    getDisplays(flag = true): SelectQueryBuilder {
        this.model.getDisplays = flag;
        return this;
    }

    select(expressions: string[]): SelectQueryBuilder {
        expressions.forEach((expression) => {
            this.model.selectExpressions.push(expression);
        });
        return this;
    }

    where(whereExpression: string): SelectQueryBuilder {
        this.model.whereExpression = whereExpression;
        return this;
    }

    orderBy(orderByExpression: string): SelectQueryBuilder {
        this.model.orderByExpression = orderByExpression;
        return this;
    }

    parameter(name: string, value: any): SelectQueryBuilder;
    parameter(name: string, value: any, dbType: DbType): SelectQueryBuilder;

    parameter(name: string, value: any, dbType?: DbType): SelectQueryBuilder {
        let actualValue = value;
        let actualDbType = dbType;

        // If value is a Date, convert it to string and set DbType.DateTime
        if (value instanceof Date) {
            actualValue = value.toLocalISO();
            actualDbType = DbType.DateTime; // 6
        }

        // If value is a number and dbType is not explicitly set, infer the numeric type
        if (typeof value === 'number' && !dbType) {
            if (Number.isInteger(value)) {
                // Integer value
                const INT32_MIN = -2147483648;
                const INT32_MAX = 2147483647;
                if (value >= INT32_MIN && value <= INT32_MAX) {
                    actualDbType = DbType.Int32; // 11
                } else {
                    actualDbType = DbType.Int64; // 12
                }
            } else {
                actualDbType = DbType.Decimal; // 7
            }
        }

        // If value is a boolean and dbType is not explicitly set, set DbType.Boolean
        if (typeof value === 'boolean' && !dbType) {
            actualDbType = DbType.Boolean; // 3
        }

        const newParameter = new QueryParameter(
            actualDbType ? {
                    name,
                    value: actualValue,
                    dbType: actualDbType,
                }
                : {
                    name,
                    value: actualValue,
                },
        );

        this.model.parameters.push(newParameter);
        return this;
    }

    async query(): Promise<DataTable> {

        if (!this.provider) {
            throw new Error('Queries provider is required');
        }

        const result = await this.provider.execute(this.model);

        const tableResult = new DataTable();
        if (result.isOK) {
            if (result.data.columns) {
                result.data.columns.forEach((column: any) => {
                    tableResult.addColumn(column);
                });
                if (result.data.rows) {
                    result.data.rows.forEach((row: any) => {
                        tableResult.addRow(row);
                    });
                }
            } else {
                console.error('No columns in result table');
            }
        } else {
            console.error(result.presentation);
        }

        return tableResult;
    }
}
