import * as vm from 'vm';
import { DataTable } from '../src/table/dataTable';

const ORDER_BY_ERROR = /^orderBy:/;

function makeTable(
  columns: { name: string; dataType?: string }[],
  rows: any[][],
): DataTable {
  const table = new DataTable();
  columns.forEach((column) => {
    table.addColumn({ name: column.name, dataType: column.dataType || 'string' });
  });
  rows.forEach((row) => {
    table.addRow(row);
  });
  return table;
}

function numberPeriodTable(rows: [number, number][] = [[2, 10], [1, 10], [1, 20]]): DataTable {
  return makeTable(
    [
      { name: 'number', dataType: 'number' },
      { name: 'period', dataType: 'number' },
    ],
    rows,
  );
}

function columnValues(table: DataTable, name: string): any[] {
  return table.rows.map((row) => row[name]);
}

function pairs(table: DataTable): [any, any][] {
  return table.rows.map((row) => [row.number, row.period]);
}

interface TableSnapshot {
  table: DataTable;
  rows: any[];
  rowObjects: any[];
  columns: any[];
  columnObjects: any[];
  values: any[][];
}

function snapshot(table: DataTable): TableSnapshot {
  return {
    table,
    rows: table.rows,
    rowObjects: table.rows.slice(),
    columns: table.columns,
    columnObjects: table.columns.slice(),
    values: table.rows.map((row) => table.columns.map((column) => row[column.name])),
  };
}

function expectSameState(table: DataTable, before: TableSnapshot): void {
  expect(table).toBe(before.table);
  expect(table.rows).toBe(before.rows);
  expect(table.columns).toBe(before.columns);
  expect(table.rows.length).toBe(before.rowObjects.length);
  before.rowObjects.forEach((row, index) => {
    expect(table.rows[index]).toBe(row);
  });
  before.columnObjects.forEach((column, index) => {
    expect(table.columns[index]).toBe(column);
  });
  const values = table.rows.map((row) => table.columns.map((column) => row[column.name]));
  expect(values).toEqual(before.values);
}

function expectOrderFailure(table: DataTable, criteria: any, message: string | RegExp): void {
  const before = snapshot(table);
  let thrown: unknown;
  try {
    table.orderBy(criteria);
  } catch (error) {
    thrown = error;
  }

  expect(thrown).toBeInstanceOf(Error);
  if (message instanceof RegExp) {
    expect((thrown as Error).message).toMatch(message);
  } else {
    expect((thrown as Error).message).toBe(message);
  }
  expectSameState(table, before);
}

describe('DataTable.orderBy', () => {
  const sortedPairs: [number, number][] = [[1, 20], [1, 10], [2, 10]];

  describe('call forms', () => {
    it('sorts with a comparator and preserves table, array, and row identity', () => {
      const table = makeTable(
        [{ name: 'quantity', dataType: 'number' }],
        [[1], [10], [2]],
      );
      const rows = table.rows;
      const originalRows = rows.slice();

      const returned = table.orderBy((a, b) => b.quantity - a.quantity);

      expect(returned).toBe(table);
      expect(table.rows).toBe(rows);
      expect(columnValues(table, 'quantity')).toEqual([10, 2, 1]);
      expect(table.rows[0]).toBe(originalRows[1]);
      expect(table.rows[1]).toBe(originalRows[2]);
      expect(table.rows[2]).toBe(originalRows[0]);
    });

    it('accepts equivalent string and array criteria', () => {
      const byString = numberPeriodTable();
      const byArray = numberPeriodTable();

      expect(byString.orderBy('number, period desc ')).toBe(byString);
      expect(byArray.orderBy(['number', 'period desc'])).toBe(byArray);

      expect(pairs(byString)).toEqual(sortedPairs);
      expect(pairs(byArray)).toEqual(sortedPairs);
    });

    it('accepts frozen arrays, readonly tuples, and string/array unions without mutating them', () => {
      const frozen = Object.freeze(['number', 'period desc']);
      const tuple = ['number', 'period desc'] as const;
      const mutableSetting: string | string[] = ['number', 'period desc'];
      const readonlySetting: string | readonly string[] = 'number, period desc ';

      const tables = [
        numberPeriodTable().orderBy(frozen),
        numberPeriodTable().orderBy(tuple),
        numberPeriodTable().orderBy(mutableSetting),
        numberPeriodTable().orderBy(readonlySetting),
      ];

      tables.forEach((table) => {
        expect(pairs(table)).toEqual(sortedPairs);
      });
      expect(frozen).toEqual(['number', 'period desc']);
      expect(Object.isFrozen(frozen)).toBe(true);
      expect(tuple).toEqual(['number', 'period desc']);
      expect(mutableSetting).toEqual(['number', 'period desc']);
      expect(readonlySetting).toBe('number, period desc ');
    });

    it('sorts by number ascending when direction is omitted or explicit', () => {
      const expected: [number, number][] = [[1, 10], [1, 20], [2, 10]];
      ['number', 'number asc', 'number ASC'].forEach((criteria) => {
        expect(pairs(numberPeriodTable().orderBy(criteria))).toEqual(expected);
      });
      expect(pairs(numberPeriodTable().orderBy(['number']))).toEqual(expected);
    });
  });

  describe('criterion grammar', () => {
    it('accepts JavaScript whitespace and case-insensitive directions', () => {
      const expected = sortedPairs;
      const spaced = '  number  ASC ,\tperiod   DeSc  ';
      const unicodeSpace = '\u00a0number\u00a0ASC,\nperiod\tdesc\u00a0';

      expect(pairs(numberPeriodTable().orderBy(spaced))).toEqual(expected);
      expect(pairs(numberPeriodTable().orderBy(unicodeSpace))).toEqual(expected);
      expect(pairs(numberPeriodTable().orderBy([spaced.split(',')[0], spaced.split(',')[1]]))).toEqual(expected);
    });

    it('sorts a selected alias as a current column name', () => {
      const selected = makeTable(
        [
          { name: 'product', dataType: 'string' },
          { name: 'quantity', dataType: 'number' },
        ],
        [['apple', 2], ['pear', 1], ['banana', 3]],
      ).select('product as item, quantity').orderBy('item desc');

      expect(selected.rows.map((row) => [row.item, row.quantity])).toEqual([
        ['pear', 1],
        ['banana', 3],
        ['apple', 2],
      ]);
    });

    it('looks up column names with exact case', () => {
      const table = makeTable([{ name: 'number', dataType: 'number' }], [[1], [2]]);
      expectOrderFailure(table, 'Number', 'Column Number not found');
    });

    it('sorts a Unicode column name', () => {
      const byString = makeTable(
        [{ name: 'количество', dataType: 'number' }],
        [[2], [1], [3]],
      );
      const byArray = makeTable(
        [{ name: 'количество', dataType: 'number' }],
        [[2], [1], [3]],
      );

      byString.orderBy('количество desc');
      byArray.orderBy(['количество desc']);

      expect(columnValues(byString, 'количество')).toEqual([3, 2, 1]);
      expect(columnValues(byArray, 'количество')).toEqual([3, 2, 1]);
    });

    it('treats asc and desc as column names unless they are a direction token', () => {
      const descName = makeTable([{ name: 'desc', dataType: 'number' }], [[2], [1], [3]]);
      const ascName = makeTable([{ name: 'asc', dataType: 'number' }], [[2], [1], [3]]);
      const descDirection = makeTable([{ name: 'desc', dataType: 'number' }], [[2], [1], [3]]);

      descName.orderBy('desc');
      ascName.orderBy(['asc']);
      descDirection.orderBy('desc desc');

      expect(columnValues(descName, 'desc')).toEqual([1, 2, 3]);
      expect(columnValues(ascName, 'asc')).toEqual([1, 2, 3]);
      expect(columnValues(descDirection, 'desc')).toEqual([3, 2, 1]);
    });
  });

  describe('literal punctuation', () => {
    const tokens = [
      '"number"',
      "'number'",
      '[number]',
      '`number`',
      't.number',
      'price-usd',
      'lower(name)',
      'qty(kg)',
    ];

    it('sorts columns whose names contain punctuation', () => {
      tokens.forEach((token) => {
        const table = makeTable([{ name: token, dataType: 'number' }], [[2], [1]]);
        table.orderBy(token);
        expect(columnValues(table, token)).toEqual([1, 2]);
      });

      const parenthesized = makeTable([{ name: 'qty(kg)', dataType: 'number' }], [[1], [2]]);
      parenthesized.orderBy(['qty(kg) desc']);
      expect(columnValues(parenthesized, 'qty(kg)')).toEqual([2, 1]);
    });

    it('does not interpret punctuation as SQL syntax', () => {
      tokens.forEach((token) => {
        const table = makeTable([{ name: 'number', dataType: 'number' }], [[2], [1]]);
        expectOrderFailure(table, token, `Column ${token} not found`);
        expect(columnValues(table, 'number')).toEqual([2, 1]);
      });
    });
  });

  describe('priority and stable ties', () => {
    it('applies a descending secondary key without reversing the primary key', () => {
      const table = makeTable(
        [
          { name: 'id', dataType: 'string' },
          { name: 'number', dataType: 'number' },
          { name: 'period', dataType: 'number' },
        ],
        [
          ['A', 1, 10],
          ['B', 1, 20],
          ['C', 2, 30],
          ['D', 1, 20],
        ],
      );

      table.orderBy('number, period desc');

      expect(columnValues(table, 'id')).toEqual(['B', 'D', 'A', 'C']);
    });

    it('treats a repeated column as redundant and keeps stable ties', () => {
      const rows: [string, number][] = [['a', 1], ['b', 2], ['c', 1]];
      const repeated = makeTable(
        [{ name: 'id', dataType: 'string' }, { name: 'number', dataType: 'number' }],
        rows,
      );
      const once = makeTable(
        [{ name: 'id', dataType: 'string' }, { name: 'number', dataType: 'number' }],
        rows,
      );

      repeated.orderBy('number asc, number desc');
      once.orderBy('number asc');

      expect(columnValues(repeated, 'id')).toEqual(['a', 'c', 'b']);
      expect(columnValues(once, 'id')).toEqual(columnValues(repeated, 'id'));
    });

    it('keeps complete ties in their original order for descending criteria', () => {
      const table = makeTable(
        [{ name: 'id', dataType: 'string' }, { name: 'number', dataType: 'number' }],
        [['a', 1], ['b', 1], ['c', 1]],
      );

      table.orderBy('number desc');

      expect(columnValues(table, 'id')).toEqual(['a', 'b', 'c']);
    });
  });

  describe('scalar and date comparison', () => {
    it('sorts numbers numerically and numeric strings as text, ignoring column metadata', () => {
      const numeric = makeTable([{ name: 'value', dataType: 'string' }], [[10], [2], [1]]);
      const textual = makeTable([{ name: 'value', dataType: 'number' }], [['10'], ['2'], ['1']]);

      numeric.orderBy('value');
      textual.orderBy(['value']);

      expect(columnValues(numeric, 'value')).toEqual([1, 2, 10]);
      expect(columnValues(textual, 'value')).toEqual(['1', '10', '2']);
    });

    it('sorts strings by code unit and booleans false then true', () => {
      const strings = makeTable([{ name: 'value', dataType: 'number' }], [['b'], ['A'], ['a']]);
      const flags = makeTable([{ name: 'value', dataType: 'string' }], [[true], [false]]);

      strings.orderBy('value asc');
      flags.orderBy('value');

      expect(columnValues(strings, 'value')).toEqual(['A', 'a', 'b']);
      expect(columnValues(flags, 'value')).toEqual([false, true]);
    });

    it('sorts dates chronologically, including a date from another execution context', () => {
      const early = new Date(2020, 0, 1, 0, 0, 0);
      const middle = vm.runInNewContext('new Date(2020, 0, 2, 0, 0, 0)') as Date;
      const late = new Date(2020, 0, 3, 0, 0, 0);

      expect(middle instanceof Date).toBe(false);
      expect(Object.prototype.toString.call(middle)).toBe('[object Date]');

      const table = makeTable(
        [{ name: 'when', dataType: 'string' }, { name: 'label', dataType: 'string' }],
        [[late, 'late'], [early, 'early'], [middle, 'middle']],
      );
      table.orderBy('when');

      expect(columnValues(table, 'label')).toEqual(['early', 'middle', 'late']);
    });

    it('uses a secondary column when dates represent the same instant', () => {
      const local = new Date(2020, 0, 2, 3, 4, 5);
      const foreign = vm.runInNewContext('new Date(2020, 0, 2, 3, 4, 5)') as Date;

      expect(foreign instanceof Date).toBe(false);
      expect(foreign.getTime()).toBe(local.getTime());

      const table = makeTable(
        [{ name: 'when', dataType: 'date' }, { name: 'seq', dataType: 'number' }],
        [[local, 2], [foreign, 1]],
      );
      table.orderBy(['when', 'seq']);

      expect(columnValues(table, 'seq')).toEqual([1, 2]);
    });
  });

  describe('missing values', () => {
    function missingDates(): DataTable {
      return makeTable(
        [{ name: 'when', dataType: 'date' }, { name: 'label', dataType: 'string' }],
        [
          [new Date(2020, 0, 3), 'late'],
          [null, 'null'],
          [new Date(2020, 0, 1), 'early'],
          [undefined, 'undefined'],
          [new Date('not-a-date'), 'invalid'],
        ],
      );
    }

    it('places missing dates last in both directions and keeps their relative order', () => {
      const ascending = missingDates();
      const descending = missingDates();

      ascending.orderBy('when');
      descending.orderBy('when desc');

      expect(columnValues(ascending, 'label')).toEqual(['early', 'late', 'null', 'undefined', 'invalid']);
      expect(columnValues(descending, 'label')).toEqual(['late', 'early', 'null', 'undefined', 'invalid']);
    });

    it('compares the next key when missing values are equal', () => {
      const rows = [
        [null, 1, 'null'],
        [new Date('not-a-date'), 3, 'invalid'],
        [new Date(2020, 0, 1), 0, 'valid'],
        [undefined, 2, 'undefined'],
      ];
      const columns = [
        { name: 'when', dataType: 'date' },
        { name: 'rank', dataType: 'number' },
        { name: 'label', dataType: 'string' },
      ];

      const ascending = makeTable(columns, rows);
      const descending = makeTable(columns, rows);
      ascending.orderBy('when, rank');
      descending.orderBy('when desc, rank desc');

      expect(columnValues(ascending, 'label')).toEqual(['valid', 'null', 'undefined', 'invalid']);
      expect(columnValues(descending, 'label')).toEqual(['valid', 'invalid', 'undefined', 'null']);
    });

    it('keeps an all-missing column in its original order for both directions', () => {
      const table = makeTable(
        [{ name: 'value', dataType: 'number' }, { name: 'label', dataType: 'string' }],
        [[null, 'null'], [undefined, 'undefined'], [NaN, 'nan'], [new Date('not-a-date'), 'invalid']],
      );

      table.orderBy('value');
      expect(columnValues(table, 'label')).toEqual(['null', 'undefined', 'nan', 'invalid']);
      table.orderBy('value desc');
      expect(columnValues(table, 'label')).toEqual(['null', 'undefined', 'nan', 'invalid']);
    });

    it('treats zero, false, and empty string as ordinary values', () => {
      const numbers = makeTable(
        [{ name: 'value', dataType: 'number' }],
        [[null], [0], [NaN], [2]],
      );
      numbers.orderBy('value desc');
      const numeric = columnValues(numbers, 'value');
      expect(numeric[0]).toBe(2);
      expect(numeric[1]).toBe(0);
      expect(numeric[2]).toBeNull();
      expect(Number.isNaN(numeric[3])).toBe(true);

      const withZero = makeTable(
        [{ name: 'value', dataType: 'number' }],
        [[null], [0], [-1], [2]],
      );
      withZero.orderBy('value');
      expect(columnValues(withZero, 'value')).toEqual([-1, 0, 2, null]);

      const flags = makeTable(
        [{ name: 'value', dataType: 'boolean' }],
        [[null], [false], [true]],
      );
      flags.orderBy('value desc');
      expect(columnValues(flags, 'value')).toEqual([true, false, null]);

      const text = makeTable([{ name: 'value', dataType: 'string' }], [[null], [''], ['a']]);
      text.orderBy('value');
      expect(columnValues(text, 'value')).toEqual(['', 'a', null]);
    });
  });

  describe('fluent in-place sorting', () => {
    it('reorders the existing row array and keeps row and column objects', () => {
      const table = numberPeriodTable();
      const before = snapshot(table);
      const criteria = ['number', 'period desc'];

      const returned = table.orderBy(criteria);

      expect(returned).toBe(table);
      expect(table.rows).toBe(before.rows);
      expect(table.columns).toBe(before.columns);
      before.columnObjects.forEach((column, index) => {
        expect(table.columns[index]).toBe(column);
      });
      expect(pairs(table)).toEqual(sortedPairs);
      before.rowObjects.forEach((row) => {
        expect(table.rows).toContain(row);
      });
      expect(before.rowObjects.map((row) => [row.number, row.period])).toEqual([
        [2, 10],
        [1, 10],
        [1, 20],
      ]);
      expect(criteria).toEqual(['number', 'period desc']);
    });

    it('applies each call to the current order and does not accumulate criteria', () => {
      const table = makeTable(
        [
          { name: 'id', dataType: 'string' },
          { name: 'number', dataType: 'number' },
          { name: 'period', dataType: 'number' },
        ],
        [
          ['A', 1, 5],
          ['B', 2, 30],
          ['C', 0, 30],
          ['D', 1, 10],
        ],
      );

      const returned = table.orderBy('number').orderBy('period desc');

      expect(returned).toBe(table);
      expect(columnValues(table, 'id')).toEqual(['C', 'B', 'D', 'A']);
    });

    it('sorts a valid criterion on an empty or single-row table without replacing the row array', () => {
      const empty = makeTable([{ name: 'number', dataType: 'number' }], []);
      const emptyRows = empty.rows;
      expect(empty.orderBy('number desc')).toBe(empty);
      expect(empty.rows).toBe(emptyRows);
      expect(empty.rows).toEqual([]);

      const single = numberPeriodTable([[2, 10]]);
      const row = single.rows[0];
      const rows = single.rows;
      expect(single.orderBy(['number', 'period desc'])).toBe(single);
      expect(single.rows).toBe(rows);
      expect(single.rows[0]).toBe(row);
    });
  });

  describe('validation before mutation', () => {
    it('treats a blank string or an empty array as a no-op', () => {
      ['', '   ', '\n\t \u00a0', []].forEach((criteria) => {
        const table = numberPeriodTable();
        const before = snapshot(table);
        const returned = table.orderBy(criteria as any);
        expect(returned).toBe(table);
        expectSameState(table, before);
      });
    });

    it('rejects empty segments in a non-empty list', () => {
      const samples: any[] = ['number,', ',number', 'number,,period', [''], ['number', '  ']];
      samples.forEach((criteria) => {
        expectOrderFailure(numberPeriodTable(), criteria, ORDER_BY_ERROR);
      });
    });

    it('rejects malformed criteria, non-strings, and embedded commas before sorting', () => {
      const table = numberPeriodTable([[2, 10], [1, 20]]);
      const embedded = ['number, period desc'];

      expectOrderFailure(table, 'number, period sideways', ORDER_BY_ERROR);
      expectOrderFailure(table, ['number', 42], ORDER_BY_ERROR);
      expectOrderFailure(table, embedded, ORDER_BY_ERROR);
      expect(embedded).toEqual(['number, period desc']);
      expect(pairs(table)).toEqual([[2, 10], [1, 20]]);
    });

    it('rejects an unknown column on an empty table and on a one-row table', () => {
      const empty = makeTable([{ name: 'number', dataType: 'number' }], []);
      expectOrderFailure(empty, 'number, absent desc', 'Column absent not found');

      const single = makeTable([{ name: 'number', dataType: 'number' }], [[4]]);
      expectOrderFailure(single, 'absent', 'Column absent not found');
    });

    it('rejects a sparse criteria array', () => {
      const hole: any = ['number', , 'period'];
      const emptySlot = new Array(1);
      const table = numberPeriodTable([[2, 10], [1, 20]]);

      expectOrderFailure(table, hole, ORDER_BY_ERROR);
      expectOrderFailure(table, emptySlot, ORDER_BY_ERROR);
      expect(hole.length).toBe(3);
      expect(Object.prototype.hasOwnProperty.call(hole, 1)).toBe(false);
      expect(emptySlot.length).toBe(1);
    });

    it('rejects unsupported argument types', () => {
      [null, undefined, 42, { column: 'number' }].forEach((criteria) => {
        expectOrderFailure(numberPeriodTable(), criteria, ORDER_BY_ERROR);
      });
    });

    it('reports malformed syntax before an unknown column', () => {
      const table = makeTable([{ name: 'period', dataType: 'number' }], [[10], [20]]);

      expectOrderFailure(table, 'absent, period sideways', ORDER_BY_ERROR);
      expectOrderFailure(table, 'absent sideways', ORDER_BY_ERROR);
    });

    it('reports the first unknown column after the whole list is syntactically valid', () => {
      const table = makeTable([{ name: 'period', dataType: 'number' }], [[10]]);
      const criteria = Object.freeze(['absent', 'otherAbsent desc']);

      expectOrderFailure(table, 'absent, otherAbsent desc', 'Column absent not found');
      expectOrderFailure(table, criteria, 'Column absent not found');
      expect(criteria).toEqual(['absent', 'otherAbsent desc']);
    });

    it('does not reorder rows when a later column name is unknown', () => {
      const table = numberPeriodTable([[2, 10], [1, 20]]);
      expectOrderFailure(table, 'number, absent', 'Column absent not found');
      expect(pairs(table)).toEqual([[2, 10], [1, 20]]);
    });
  });
});
