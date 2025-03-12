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
        const newParameter = new QueryParameter(dbType ? { name, value, dbType } : { name, value });

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
