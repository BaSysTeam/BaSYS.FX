import { DbType } from './dbTypes';

export class QueryParameter {
    name: string;
    value: any;
    dbType: DbType | undefined;

    constructor(params: any) {
        let data: any = {};
        if (params != null) {
            data = params;
        }

        this.name = data.name || '';
        this.value = data.value;
        this.dbType = data.dbType || undefined;
    }
}
