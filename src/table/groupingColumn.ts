export class GroupingColumn {
    name: string;
    alias: string;
    aggregate: string;

    constructor(params: any) {
        let data: any = {};
        if (params != null) {
            data = params;
        }

        this.name = data.name || '';
        this.alias = data.alias || this.name;
        this.aggregate = data.aggregate || 'sum';
    }
}
