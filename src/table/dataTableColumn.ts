export class DataTableColumn {
    name: string;
    dataType: string;
    defaultValue: any;

    constructor(params: any) {
      this.name = params.name;
      if (!this.name) {
        throw new Error('Name of DataTableColumn cannot be empty.');
      }

      this.dataType = params.dataType || 'string';
      this.checkDataType();

      this.defaultValue = params.defaultValue || this.defaultValueOfType(this.dataType);
    }

    static parse(input:string): DataTableColumn {
      if (!input) {
        throw new Error('Column description cannot be empty.');
      }

      const parts = input.trim().split(' ');

      const columnData = {
        name: parts[0],
        dataType: parts.length > 1 ? parts[1].trim().toLowerCase() : 'string',
      };

      return new DataTableColumn(columnData);
    }

    private checkDataType(): void {
      const availableTypes = ['string', 'number', 'boolean', 'date'];

      if (availableTypes.indexOf(this.dataType) === -1) {
        throw new Error(`Data type ${this.dataType} not supported in DataTable.`);
      }
    }

    private defaultValueOfType(dataType: string): any {
      switch (dataType) {
        case 'string':
          return '';
        case 'number':
          return 0;
        case 'boolean':
          return false;
        case 'date':
          return undefined;
        default:
          throw new Error(`Data type ${dataType} not supported in DataTable.`);
      }
    }
  }
