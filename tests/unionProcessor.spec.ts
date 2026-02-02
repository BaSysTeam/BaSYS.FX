/* eslint-disable no-return-assign */
import { DataTable } from '../src/table/dataTable';

describe('UnionProcessor', () => {
  let columns: any[];
  let mainTable: DataTable;
  let tableToUnion: DataTable;

  beforeEach(() => {
    columns = [{ name: 'product' }, { name: 'quantity', dataType: 'number' }, { name: 'amount', dataType: 'number' }];
    mainTable = new DataTable();
    tableToUnion = new DataTable();

    columns.forEach((column) => {
      mainTable.addColumn(column);
      tableToUnion.addColumn(column);
    });

    mainTable.addRow(['product_1', 10, 100])
      .addRow(['product_2', 5, 2000]);

    tableToUnion.addRow(['product_1', 10, 100])
      .addRow(['product_3', 20, 4000]);
  });

  it('Error if tableToUnion not DataTable', () => {
    expect(() => {
      const fakeTable: any = {};
      mainTable.unionAll(fakeTable);
    }).toThrow();
  });

  it('UnionAll', () => {
    tableToUnion.addColumn({ name: 'price', dataType: 'number' })
      .process((row) => row.price = row.amount / row.quantity);

    const resultTable = mainTable.unionAll(tableToUnion);

    expect(resultTable.rows.length).toBe(4);
  });

  it('Union', () => {
    const resultTable = mainTable.union(tableToUnion);

    expect(resultTable.rows.length).toBe(3);
  });
});
