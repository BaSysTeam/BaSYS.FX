import { QueryParameter } from './queryParameter';
import { FilterItem } from './filterItem';

export class SelectQueryModel {
    dbName: string;
    top: number;
    offset: number;
    take: number;
    getDisplays: boolean;
    fromExpression: string;
    whereExpression: string;
    orderByExpression: string;
    groupByExpresssion: string;
    havingExpression: string;
    selectExpressions: string[];
    parameters: QueryParameter[];
    filters: FilterItem[];

    constructor(params: any) {
        let data: any = {};
        if (params != null) {
            data = params;
        }

        this.dbName = data.dbName || globalThis.DB_NAME;
        this.top = data.top || 0;
        this.offset = data.offset || 0;
        this.take = data.take || 0;
        this.getDisplays = data.getDisplays || false;
        this.fromExpression = data.fromExpression || '';
        this.whereExpression = data.whereExpression || '';
        this.orderByExpression = data.orderByExpression || '';
        this.groupByExpresssion = data.groupByExpresssion || '';
        this.havingExpression = data.havingExpression || '';

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

        this.filters = [];
        if (data.filters) {
            data.filters.forEach((item: any) => {
                this.filters.push(new FilterItem(item));
            });
        }
    }
}
