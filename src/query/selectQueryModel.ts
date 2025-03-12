import { QueryParameter } from './queryParameter';

export class SelectQueryModel {
    dbName: string;
    top: number;
    fromExpression: string;
    whereExpression: string;
    orderByExpression: string;
    selectExpressions: string[];
    parameters: QueryParameter[];

    constructor(params: any) {
        let data: any = {};
        if (params != null) {
            data = params;
        }

        this.dbName = data.dbName || globalThis.DB_NAME;
        this.top = data.top || 0;
        this.fromExpression = data.fromExpression || '';
        this.whereExpression = data.whereExpression || '';
        this.orderByExpression = data.orderByExpression || '';

        this.selectExpressions = [];
        if (data.selectExpressions) {
            data.selectExpressions.forEach((item: any) => {
                this.selectExpressions.push(item);
            });
        }

        this.parameters = [];
        if (data.parameters) {
            data.parameters.forEach((item: any) => {
                this.parameters.push(new QueryParameter(item));
            });
        }
    }
}
