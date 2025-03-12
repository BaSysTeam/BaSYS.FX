const PRIMARY_TABLE_NAME = 'primary';
const SECONDARY_TABLE_NAME = 'secondary';

export class ColumnDescription {
    table: string;
    name: string;
    alias: string;

    constructor(params: any) {
        let data: any = {};
        if (params != null) {
            data = params;
        }

        this.table = data.table || '';
        this.name = data.name || '';
        this.alias = data.alias || this.name;
    }

    get isPrimaryTable(): boolean {
        return this.table.toLowerCase() === PRIMARY_TABLE_NAME;
    }

    get isSecondaryTable(): boolean {
        return this.table.toLowerCase() === SECONDARY_TABLE_NAME;
    }
}
