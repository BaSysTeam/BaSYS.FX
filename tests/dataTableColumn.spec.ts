import { DataTableColumn } from '../src/table/dataTableColumn';

describe('DataTableColumn', () => {
  it('Empty name throw exception', () => {
    expect(() => {
      // eslint-disable-next-line no-new
      new DataTableColumn({});
    }).toThrow();
  });

  it('Wrong type throw exception', () => {
    expect(() => {
      // eslint-disable-next-line no-new
      new DataTableColumn(
        { name: 'quantity', dataType: 'wrong' },
      );
    }).toThrow();
  });

  it('Default value for string', async () => {
    const newColumn = new DataTableColumn(
      {
        name: 'message',
        dataType: 'string',
      },
    );
    expect(newColumn.defaultValue).toEqual('');
  });

  it('Default value for number', async () => {
    const newColumn = new DataTableColumn(
      {
        name: 'quantity',
        dataType: 'number',
      },
    );
    expect(newColumn.defaultValue).toEqual(0);
  });

  it('Default value for boolean', async () => {
    const newColumn = new DataTableColumn(
      {
        name: 'flag',
        dataType: 'boolean',
      },
    );
    expect(newColumn.defaultValue).toEqual(false);
  });
  it('Default value for date', async () => {
    const newColumn = new DataTableColumn(
      {
        name: 'deadLine',
        dataType: 'date',
      },
    );
    expect(newColumn.defaultValue).toEqual(undefined);
  });

  it('Parse empty column throw exception', () => {
    expect(() => {
      // eslint-disable-next-line no-new
      DataTableColumn.parse(' ');
    }).toThrow();
  });
  it('Parse column description with name', () => {
    const newColumn = DataTableColumn.parse('Product ');
    expect(newColumn.name).toEqual('Product');
  });

  it('Parse column description with name and dataType', () => {
    const newColumn = DataTableColumn.parse('amount number ');
    expect(newColumn.name).toEqual('amount');
    expect(newColumn.dataType).toEqual('number');
  });

  it('Parse column ignore all words after second', () => {
    const newColumn = DataTableColumn.parse('amount number something');
    expect(newColumn.name).toEqual('amount');
    expect(newColumn.dataType).toEqual('number');
  });
});
