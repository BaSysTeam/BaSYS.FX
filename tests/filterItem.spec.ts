import { FilterItem } from '../src/query/filterItem';
import { ComparisonKind } from '../src/query/comparisonKind';
import { LogicalOperator } from '../src/query/logicalOperator';
import { DbType } from '../src/query/dbTypes';

describe('FilterItem', () => {
  describe('Initialization without parameters', () => {
    it('Creating with null returns an object with default values', () => {
      const item = new FilterItem(null);
      expect(item.name).toEqual('');
      expect(item.dataPath).toEqual('');
      expect(item.title).toEqual('');
      expect(item.required).toEqual(false);
      expect(item.isActive).toEqual(false);
      expect(item.comparisonKind).toEqual(ComparisonKind.Equal);
      expect(item.joinOperator).toEqual(LogicalOperator.And);
      expect(item.dbType).toEqual(DbType.String);
      expect(item.values).toEqual([]);
    });

    it('Creating without arguments returns an object with default values', () => {
      const item = new FilterItem();
      expect(item.name).toEqual('');
      expect(item.comparisonKind).toEqual(ComparisonKind.Equal);
      expect(item.dbType).toEqual(DbType.String);
      expect(item.values).toEqual([]);
    });
  });

  describe('Initialization with parameters', () => {
    it('Correctly sets all fields from the parameter', () => {
      const item = new FilterItem({
        uid: 'abc-123',
        name: 'dateField',
        path: 'order.date',
        title: 'Order date',
        required: true,
        comparisonKind: ComparisonKind.Between,
        joinOperator: LogicalOperator.Or,
        dbType: DbType.DateTime,
        values: ['2024-01-01', '2024-12-31'],
      });

      expect(item.uid).toEqual('abc-123');
      expect(item.name).toEqual('dateField');
      expect(item.dataPath).toEqual('order.date');
      expect(item.title).toEqual('Order date');
      expect(item.required).toEqual(true);
      expect(item.isActive).toEqual(true);
      expect(item.comparisonKind).toEqual(ComparisonKind.Between);
      expect(item.joinOperator).toEqual(LogicalOperator.Or);
      expect(item.dbType).toEqual(DbType.DateTime);
      expect(item.values).toEqual(['2024-01-01', '2024-12-31']);
    });

    it('isActive equals required on initialization', () => {
      const active = new FilterItem({ required: true });
      expect(active.isActive).toEqual(true);

      const inactive = new FilterItem({ required: false });
      expect(inactive.isActive).toEqual(false);
    });

    it('values is copied, not passed by reference', () => {
      const original = ['val1', 'val2'];
      const item = new FilterItem({ values: original });
      original.push('val3');
      expect(item.values).toHaveLength(2);
    });

    it('values remains an empty array when a non-array value is provided', () => {
      const item = new FilterItem({ values: 'not-an-array' as any });
      expect(item.values).toEqual([]);
    });
  });

  describe('Between with two string values and DbType = 6 (DateTime)', () => {
    let item: FilterItem;

    beforeEach(() => {
      item = new FilterItem({
        name: 'createdAt',
        comparisonKind: ComparisonKind.Between,
        dbType: DbType.DateTime,
        values: ['2024-01-01', '2024-12-31'],
      });
    });

    it('comparisonKind equals Between (6)', () => {
      expect(item.comparisonKind).toEqual(ComparisonKind.Between);
      expect(item.comparisonKind).toEqual(6);
    });

    it('dbType equals DateTime (6)', () => {
      expect(item.dbType).toEqual(DbType.DateTime);
      expect(item.dbType).toEqual(6);
    });

    it('values contains two string entries', () => {
      expect(item.values).toHaveLength(2);
      expect(typeof item.values[0]).toEqual('string');
      expect(typeof item.values[1]).toEqual('string');
    });

    it('value returns the first entry', () => {
      expect(item.value).toEqual('2024-01-01');
    });

    it('secondValue returns the second entry', () => {
      expect(item.secondValue).toEqual('2024-12-31');
    });
  });

  describe('Getters and setters value / secondValue', () => {
    it('value returns null when values is empty', () => {
      const item = new FilterItem();
      expect(item.value).toBeNull();
    });

    it('secondValue returns null when values is empty', () => {
      const item = new FilterItem();
      expect(item.secondValue).toBeNull();
    });

    it('value setter sets the first element of values', () => {
      const item = new FilterItem();
      item.value = 'hello';
      expect(item.values[0]).toEqual('hello');
    });

    it('secondValue setter sets the second element of values', () => {
      const item = new FilterItem();
      item.secondValue = 'world';
      expect(item.values[1]).toEqual('world');
    });

    it('value getter returns the updated value after the setter', () => {
      const item = new FilterItem({ values: ['old'] });
      item.value = 'new';
      expect(item.value).toEqual('new');
    });

    it('secondValue getter returns the updated value after the setter', () => {
      const item = new FilterItem({ values: ['first', 'old'] });
      item.secondValue = 'updated';
      expect(item.secondValue).toEqual('updated');
    });
  });
});
