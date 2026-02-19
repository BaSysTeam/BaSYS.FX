import { QueryParameter } from './queryParameter';
import { DbType } from './dbTypes';
import { SelectQueryModel } from './selectQueryModel';
import { DataTable } from '../table/dataTable';
import { IQueriesProvider } from './queriesProvider';
import { FilterItem } from './filterItem';

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

    whereAnd(whereExpression: string): SelectQueryBuilder {
        if (this.model.whereExpression) {
            this.model.whereExpression += ` and ${whereExpression}`;
        } else {
            this.model.whereExpression = whereExpression;
        }

        return this;
    }

    whereOr(whereExpression: string): SelectQueryBuilder {
        if (this.model.whereExpression) {
            this.model.whereExpression += ` or ${whereExpression}`;
        } else {
            this.model.whereExpression = whereExpression;
        }

        return this;
    }

    orderBy(orderByExpression: string): SelectQueryBuilder {
        this.model.orderByExpression = orderByExpression;
        return this;
    }

    offset(offsetValue: number): SelectQueryBuilder {
        this.model.offset = offsetValue;
        return this;
    }

    take(takeValue: number): SelectQueryBuilder {
        this.model.take = takeValue;
        return this;
    }

    groupBy(groupByExpression: string): SelectQueryBuilder;
    groupBy(fields: string[]): SelectQueryBuilder;

    groupBy(arg: string | string[]): SelectQueryBuilder {
        if (Array.isArray(arg)) {
            this.model.groupByExpresssion = arg.join(", ");
        } else {
            this.model.groupByExpresssion = arg;
        }
        return this;
    }

    having(havingExpression: string): SelectQueryBuilder {
        this.model.havingExpression = havingExpression;
        return this;
    }

    parameter(name: string, value: any): SelectQueryBuilder;
    parameter(name: string, value: any, dbType: DbType): SelectQueryBuilder;

    parameter(name: string, value: any, dbType?: DbType): SelectQueryBuilder {
        let actualValue = value;
        let actualDbType = dbType;

        // Determine the value to use for type inference
        // If value is an array, use the first element for type inference
        let valueForTypeInference = value;
        if (Array.isArray(value) && value.length > 0) {
            valueForTypeInference = value[0];
        }

        // If value is a Date, convert it to string and set DbType.DateTime
        if (valueForTypeInference instanceof Date) {
            if (Array.isArray(value)) {
                // Convert all dates in array
                actualValue = value.map(v => v instanceof Date ? v.toLocalISO() : v);
            } else {
                actualValue = valueForTypeInference.toLocalISO();
            }
            actualDbType = DbType.DateTime; // 6
        }

        // If value is a number and dbType is not explicitly set, infer the numeric type
        if (typeof valueForTypeInference === 'number' && !dbType) {
            if (Number.isInteger(valueForTypeInference)) {
                // Integer value
                const INT32_MIN = -2147483648;
                const INT32_MAX = 2147483647;
                if (valueForTypeInference >= INT32_MIN && valueForTypeInference <= INT32_MAX) {
                    actualDbType = DbType.Int32; // 11
                } else {
                    actualDbType = DbType.Int64; // 12
                }
            } else {
                actualDbType = DbType.Decimal; // 7
            }
        }

        // If value is a boolean and dbType is not explicitly set, set DbType.Boolean
        if (typeof valueForTypeInference === 'boolean' && !dbType) {
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

    withFilters(items: FilterItem[], exclude?: string[]): SelectQueryBuilder {
        const excludeSet = exclude ? new Set(exclude) : null;
        items.forEach((item) => {
            if (!excludeSet || !excludeSet.has(item.name)) {
                this.model.filters.push(item);
            }
        });
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
