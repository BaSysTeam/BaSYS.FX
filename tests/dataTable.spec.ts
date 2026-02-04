import { DataTable } from '../src/table/dataTable';
// import FunctionLibrary from '@/evalEngine/functionLibrary';

describe('DataTable', () => {
  let tableProducts: DataTable;

  beforeEach(() => {
    tableProducts = new DataTable()
      .addColumn({ name: 'period', dataType: 'date' })
      .addColumn({ name: 'product', dataType: 'string' })
      .addColumn({ name: 'quantity', dataType: 'number' })
      .addColumn({ name: 'price', dataType: 'number' })
      .addColumn({ name: 'amount', dataType: 'number' })
      .addRow([new Date('2024-09-01'), 'product_1', 5, 100, 0])
      .addRow([new Date('2024-09-02'), 'product_2', 10, 200])
      .addRow([new Date('2024-09-03'), 'product_3', 1, 1000]);
  });

  it('Add column', () => {
    const dataTable = new DataTable();
    dataTable.addColumn({ name: 'product' });

    expect(dataTable.columns.length).toBe(1);
    expect(dataTable.columns[0].name).toEqual('product');
  });

  it('Error if add duplicate column', () => {
    expect(() => {
      const dataTable = new DataTable();
      dataTable.addColumn({ name: 'product' })
        .addColumn({ name: 'product' });
    }).toThrow();
  });

  it('Error if add row to DataTable without columns', () => {
    expect(() => {
      const dataTable = new DataTable();
      dataTable.addRow(['product_1', 5, 100, 0]);
    }).toThrow();
  });

  it('Build dataTable', () => {
    expect(tableProducts.columns.length).toBe(5);
    expect(tableProducts.rows.length).toBe(3);
  });

  it('Delete column', () => {
    tableProducts.deleteColumn('amount');

    expect(tableProducts.columns.length).toBe(4);
    expect(tableProducts.rows[0].amount).toBe(undefined);
  });

  it('Clear table', () => {
    tableProducts.clear();
    expect(tableProducts.columns.length).toBe(5);
    expect(tableProducts.rows.length).toBe(0);
  });

  it('Filter table', () => {
    tableProducts.filter((row:any) => row.quantity <= 5);

    expect(tableProducts.rows.length).toBe(2);
    expect(tableProducts.rows[0].product).toEqual('product_1');
    expect(tableProducts.rows[1].product).toEqual('product_3');
  });

  it('Sum', () => {
    expect(tableProducts.sum('quantity')).toBe(16);
  });

  it('Sum of non existing column. Throw Error', () => {
    expect(() => {
      tableProducts.sum('wrong');
    }).toThrow();
  });

  it('Max', () => {
    tableProducts.addColumn({
      name: 'status',
      dataType: 'number',
    });
    tableProducts.rows[0].status = -1;
    tableProducts.rows[1].status = 1;

    expect(tableProducts.max('status')).toBe(1);
  });

  it('Max date', () => {
    expect(tableProducts.max('period')).toEqual(new Date('2024-09-03'));
  });

  it('Min', () => {
    tableProducts.addColumn({
      name: 'status',
      dataType: 'number',
    });
    tableProducts.rows[0].status = -1;
    tableProducts.rows[1].status = 1;

    expect(tableProducts.min('status')).toBe(-1);
  });

  it('Min date', () => {
    expect(tableProducts.min('period')).toEqual(new Date('2024-09-01'));
  });

  it('Avg', () => {
    expect(tableProducts.avg('quantity')).toBeCloseTo(5.333333, 6);
  });

  it('Count all rows', () => {
    expect(tableProducts.count()).toEqual(3);
  });

  it('Count(quantity)', () => {
    expect(tableProducts.count('quantity')).toEqual(3);
  });

  it('Count(amount)', () => {
    tableProducts.rows[0].amount = 1;
    expect(tableProducts.count('amount')).toEqual(1);
  });

  it('Calculate amount by processRows method', () => {
    const amountTotal = tableProducts
      // eslint-disable-next-line no-return-assign
      .process((row:any) => row.amount = row.quantity * row.price)
      .sum('amount');

    expect(amountTotal).toBeCloseTo(3500, 6);
  });

  describe('Unpivot method', () => {
    let salesTable: DataTable;

    beforeEach(() => {
      // Create a table with monthly sales data
      salesTable = new DataTable()
        .addColumn({ name: 'product', dataType: 'string' })
        .addColumn({ name: 'region', dataType: 'string' })
        .addColumn({ name: 'jan', dataType: 'number' })
        .addColumn({ name: 'feb', dataType: 'number' })
        .addColumn({ name: 'mar', dataType: 'number' })
        .addRow(['Product A', 'North', 100, 150, 200])
        .addRow(['Product B', 'South', 200, 250, 300])
        .addRow(['Product C', 'East', 50, 75, 100]);
    });

    it('Should unpivot columns into rows', () => {
      const result = salesTable.unpivot(
        { name: 'sales', dataType: 'number' },
        ['jan', 'feb', 'mar'],
      );

      // Each of 3 source rows should become 3 rows (one per month)
      expect(result.rows.length).toBe(9);
    });

    it('Should create correct column structure', () => {
      const result = salesTable.unpivot(
        { name: 'sales', dataType: 'number' },
        ['jan', 'feb', 'mar'],
      );

      // Should have: sales, sales_unpivot_number, sales_unpivot_name, product, region
      expect(result.columns.length).toBe(5);
      expect(result.columns[0].name).toBe('sales');
      expect(result.columns[1].name).toBe('sales_unpivot_number');
      expect(result.columns[2].name).toBe('sales_unpivot_name');
      expect(result.columns[3].name).toBe('product');
      expect(result.columns[4].name).toBe('region');
    });

    it('Should create correct column structure with user defined columns', () => {
      const result = salesTable.unpivot(
        { name: 'sales', dataType: 'number' },
        ['jan', 'feb', 'mar'],
        'unpivot_number',
        'unpivot_name',
      );

      // Should have: sales, sales_unpivot_number, sales_unpivot_name, product, region
      expect(result.columns.length).toBe(5);
      expect(result.columns[0].name).toBe('sales');
      expect(result.columns[1].name).toBe('unpivot_number');
      expect(result.columns[2].name).toBe('unpivot_name');
      expect(result.columns[3].name).toBe('product');
      expect(result.columns[4].name).toBe('region');
    });

    it('Should preserve non-pivot column values', () => {
      const result = salesTable.unpivot(
        { name: 'sales', dataType: 'number' },
        ['jan', 'feb', 'mar'],
      );

      // Check that product and region are preserved for first product
      const productARows = result.rows.filter((row: any) => row.product === 'Product A');
      expect(productARows.length).toBe(3);
      productARows.forEach((row: any) => {
        expect(row.region).toBe('North');
      });
    });

    it('Should set correct unpivot column numbers', () => {
      const result = salesTable.unpivot(
        { name: 'sales', dataType: 'number' },
        ['jan', 'feb', 'mar'],
      );

      // Check first product's rows
      const productARows = result.rows.filter((row: any) => row.product === 'Product A');
      expect(productARows[0].sales_unpivot_number).toBe(1);
      expect(productARows[1].sales_unpivot_number).toBe(2);
      expect(productARows[2].sales_unpivot_number).toBe(3);
    });

    it('Should set correct unpivot column names', () => {
      const result = salesTable.unpivot(
        { name: 'sales', dataType: 'number' },
        ['jan', 'feb', 'mar'],
      );

      // Check first product's rows
      const productARows = result.rows.filter((row: any) => row.product === 'Product A');
      expect(productARows[0].sales_unpivot_name).toBe('jan');
      expect(productARows[1].sales_unpivot_name).toBe('feb');
      expect(productARows[2].sales_unpivot_name).toBe('mar');
    });

    it('Should correctly map pivot column values to result column', () => {
      const result = salesTable.unpivot(
        { name: 'sales', dataType: 'number' },
        ['jan', 'feb', 'mar'],
      );

      // Check Product A's sales values
      const productARows = result.rows.filter((row: any) => row.product === 'Product A');
      expect(productARows[0].sales).toBe(100); // jan
      expect(productARows[1].sales).toBe(150); // feb
      expect(productARows[2].sales).toBe(200); // mar
    });

    it('Should work with subset of columns', () => {
      const result = salesTable.unpivot(
        { name: 'value', dataType: 'number' },
        ['jan', 'feb'], // Only unpivot jan and feb
      );

      // Each of 3 source rows should become 2 rows (one per month)
      expect(result.rows.length).toBe(6);
    });

    it('Should work with different data types', () => {
      const statusTable = new DataTable()
        .addColumn({ name: 'id', dataType: 'number' })
        .addColumn({ name: 'status_q1', dataType: 'string' })
        .addColumn({ name: 'status_q2', dataType: 'string' })
        .addRow([1, 'active', 'pending'])
        .addRow([2, 'pending', 'active']);

      const result = statusTable.unpivot(
        { name: 'status', dataType: 'string' },
        ['status_q1', 'status_q2'],
      );

      expect(result.rows.length).toBe(4);
      expect(result.rows[0].status).toBe('active');
      expect(result.rows[1].status).toBe('pending');
    });

    it('Should work with single pivot column', () => {
      const result = salesTable.unpivot(
        { name: 'amount', dataType: 'number' },
        ['jan'], // Only one column to unpivot
      );

      // Same number of rows as source since only one column is unpivoted
      expect(result.rows.length).toBe(3);
      expect(result.rows[0].amount_unpivot_number).toBe(1);
      expect(result.rows[0].amount_unpivot_name).toBe('jan');
    });

    it('Should handle empty table', () => {
      const emptyTable = new DataTable()
        .addColumn({ name: 'product', dataType: 'string' })
        .addColumn({ name: 'jan', dataType: 'number' })
        .addColumn({ name: 'feb', dataType: 'number' });

      const result = emptyTable.unpivot(
        { name: 'sales', dataType: 'number' },
        ['jan', 'feb'],
      );

      expect(result.rows.length).toBe(0);
      // sales, sales_unpivot_number, sales_unpivot_name, product
      expect(result.columns.length).toBe(4);
    });

    it('Should verify complete data transformation', () => {
      const result = salesTable.unpivot(
        { name: 'amount', dataType: 'number' },
        ['jan', 'feb', 'mar'],
      );

      // Verify all Product B data
      const productBRows = result.rows.filter((row: any) => row.product === 'Product B');
      expect(productBRows.length).toBe(3);
      expect(productBRows[0].product).toBe('Product B');
      expect(productBRows[0].region).toBe('South');
      expect(productBRows[0].amount).toBe(200);
      expect(productBRows[0].amount_unpivot_name).toBe('jan');
      expect(productBRows[0].amount_unpivot_number).toBe(1);

      expect(productBRows[1].amount).toBe(250);
      expect(productBRows[1].amount_unpivot_name).toBe('feb');

      expect(productBRows[2].amount).toBe(300);
      expect(productBRows[2].amount_unpivot_name).toBe('mar');
    });
  });

  /*
  it('Create table', () => {
    const dataTable = FunctionLibrary.createTable([
      { name: 'product', dataType: 'string' },
      { name: 'quantity', dataType: 'number' },
    ]);

    expect(dataTable.columns.length).toBe(2);
  });
  */

  describe('toArray method', () => {
    it('Should return all values from column', () => {
      const products = tableProducts.toArray('product', false);

      expect(products.length).toBe(3);
      expect(products[0]).toBe('product_1');
      expect(products[1]).toBe('product_2');
      expect(products[2]).toBe('product_3');
    });

    it('Should return distinct values when distinctOnly = true', () => {
      // Add duplicate values
      tableProducts
        .addRow([new Date('2024-09-04'), 'product_1', 5, 100, 0])
        .addRow([new Date('2024-09-05'), 'product_2', 10, 200, 0]);

      const products = tableProducts.toArray('product', true);

      expect(products.length).toBe(3);
      expect(products).toContain('product_1');
      expect(products).toContain('product_2');
      expect(products).toContain('product_3');
    });

    it('Should return all values including duplicates when distinctOnly = false', () => {
      tableProducts
        .addRow([new Date('2024-09-04'), 'product_1', 5, 100, 0])
        .addRow([new Date('2024-09-05'), 'product_2', 10, 200, 0]);

      const products = tableProducts.toArray('product', false);

      expect(products.length).toBe(5);
      expect(products.filter((p: string) => p === 'product_1').length).toBe(2);
      expect(products.filter((p: string) => p === 'product_2').length).toBe(2);
    });

    it('Should work with numeric columns', () => {
      const quantities = tableProducts.toArray('quantity', false);

      expect(quantities.length).toBe(3);
      expect(quantities[0]).toBe(5);
      expect(quantities[1]).toBe(10);
      expect(quantities[2]).toBe(1);
    });

    it('Should work with date columns', () => {
      const periods = tableProducts.toArray('period', false);

      expect(periods.length).toBe(3);
      expect(periods[0]).toEqual(new Date('2024-09-01'));
      expect(periods[1]).toEqual(new Date('2024-09-02'));
      expect(periods[2]).toEqual(new Date('2024-09-03'));
    });

    it('Should return empty array for empty table', () => {
      const emptyTable = new DataTable()
        .addColumn({ name: 'product', dataType: 'string' });

      const products = emptyTable.toArray('product', false);

      expect(products.length).toBe(0);
    });

    it('Should throw error for non-existing column', () => {
      expect(() => {
        tableProducts.toArray('nonExistingColumn', false);
      }).toThrow('Column nonExistingColumn not found');
    });

    it('Should handle null and undefined values', () => {
      const testTable = new DataTable()
        .addColumn({ name: 'value', dataType: 'string' })
        .addRow([null])
        .addRow([undefined])
        .addRow(['test']);

      const values = testTable.toArray('value', false);

      expect(values.length).toBe(3);
      expect(values[0]).toBe(null);
      expect(values[1]).toBe(undefined);
      expect(values[2]).toBe('test');
    });

    it('Should handle distinct values with null and undefined', () => {
      const testTable = new DataTable()
        .addColumn({ name: 'value', dataType: 'string' })
        .addRow([null])
        .addRow([null])
        .addRow([undefined])
        .addRow(['test'])
        .addRow(['test']);

      const values = testTable.toArray('value', true);

      expect(values.length).toBe(3);
      expect(values).toContain(null);
      expect(values).toContain(undefined);
      expect(values).toContain('test');
    });
  });

  describe('Select method', () => {
    it('Should select by array of column names', () => {
      const result = tableProducts.select(['product', 'quantity']);

      expect(result.columns.length).toBe(2);
      expect(result.columns[0].name).toBe('product');
      expect(result.columns[1].name).toBe('quantity');

      expect(result.rows.length).toBe(3);
      expect(result.rows[0].product).toBe('product_1');
      expect(result.rows[0].quantity).toBe(5);
    });

    it('Should select with aliases in string array ("as")', () => {
      const result = tableProducts.select(['product as item', 'quantity']);

      expect(result.columns.length).toBe(2);
      expect(result.columns[0].name).toBe('item');
      expect(result.columns[1].name).toBe('quantity');

      expect(result.rows.length).toBe(3);
      expect(result.rows[0].item).toBe('product_1');
      expect(result.rows[0].quantity).toBe(5);
    });

    it('Should select by object descriptions (name, alias)', () => {
      const result = tableProducts.select([
        { name: 'product', alias: 'item' },
        { name: 'amount' },
      ]);

      expect(result.columns.length).toBe(2);
      expect(result.columns[0].name).toBe('item');
      expect(result.columns[1].name).toBe('amount');

      expect(result.rows.length).toBe(3);
      expect(result.rows[0].item).toBe('product_1');
      expect(result.rows[0].amount).toBe(0);
    });

    it('Should accept comma separated string with aliases', () => {
      const result = tableProducts.select('product as item, quantity, amount');

      expect(result.columns.length).toBe(3);
      expect(result.columns[0].name).toBe('item');
      expect(result.columns[1].name).toBe('quantity');
      expect(result.columns[2].name).toBe('amount');

      expect(result.rows.length).toBe(3);
      expect(result.rows[0].item).toBe('product_1');
      expect(result.rows[0].quantity).toBe(5);
      expect(result.rows[0].amount).toBe(0);
    });

    it('Should throw on non-existing column', () => {
      expect(() => tableProducts.select(['wrong'])).toThrow();
    });
  });
});
