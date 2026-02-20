import { SelectQueryBuilder } from '../src/query/selectQueryBuilder';
import { FilterItem } from '../src/query/filterItem';
import { ComparisonKind } from '../src/query/comparisonKind';
import { DbType } from '../src/query/dbTypes';

function makeBuilder(): SelectQueryBuilder {
    return new SelectQueryBuilder(null as any);
}

function makeFilter(name: string, overrides: Record<string, unknown> = {}): FilterItem {
    return new FilterItem({ name, ...overrides });
}

describe('SelectQueryBuilder.withFilters', () => {
    describe('Without exclude parameter', () => {
        it('Adds all filters from the items record to model.filters', () => {
            const builder = makeBuilder();
            const items = {
                a: makeFilter('filterA'),
                b: makeFilter('filterB'),
            };

            builder.withFilters(items);

            expect(builder.model.filters).toHaveLength(2);
            expect(builder.model.filters[0].name).toEqual('filterA');
            expect(builder.model.filters[1].name).toEqual('filterB');
        });

        it('Does nothing when items is an empty object', () => {
            const builder = makeBuilder();

            builder.withFilters({});

            expect(builder.model.filters).toHaveLength(0);
        });

        it('Returns the same builder instance (method chaining)', () => {
            const builder = makeBuilder();
            const result = builder.withFilters({});

            expect(result).toBe(builder);
        });
    });

    describe('With exclude parameter', () => {
        it('Excludes filters whose name is in the exclude list', () => {
            const builder = makeBuilder();
            const items = {
                a: makeFilter('filterA'),
                b: makeFilter('filterB'),
                c: makeFilter('filterC'),
            };

            builder.withFilters(items, ['filterB']);

            expect(builder.model.filters).toHaveLength(2);
            expect(builder.model.filters.map((f) => f.name)).toEqual(['filterA', 'filterC']);
        });

        it('Excludes multiple filters when several names are listed', () => {
            const builder = makeBuilder();
            const items = {
                a: makeFilter('filterA'),
                b: makeFilter('filterB'),
                c: makeFilter('filterC'),
            };

            builder.withFilters(items, ['filterA', 'filterC']);

            expect(builder.model.filters).toHaveLength(1);
            expect(builder.model.filters[0].name).toEqual('filterB');
        });

        it('Adds no filters when all names are excluded', () => {
            const builder = makeBuilder();
            const items = {
                a: makeFilter('filterA'),
                b: makeFilter('filterB'),
            };

            builder.withFilters(items, ['filterA', 'filterB']);

            expect(builder.model.filters).toHaveLength(0);
        });

        it('Adds all filters when exclude list does not match any name', () => {
            const builder = makeBuilder();
            const items = {
                a: makeFilter('filterA'),
                b: makeFilter('filterB'),
            };

            builder.withFilters(items, ['notExisting']);

            expect(builder.model.filters).toHaveLength(2);
        });

        it('Returns the same builder instance when exclude is provided (method chaining)', () => {
            const builder = makeBuilder();
            const result = builder.withFilters({}, ['someFilter']);

            expect(result).toBe(builder);
        });
    });

    describe('Accumulation across multiple calls', () => {
        it('Appends filters on successive withFilters calls', () => {
            const builder = makeBuilder();
            const first = { a: makeFilter('filterA') };
            const second = { b: makeFilter('filterB') };

            builder.withFilters(first).withFilters(second);

            expect(builder.model.filters).toHaveLength(2);
            expect(builder.model.filters[0].name).toEqual('filterA');
            expect(builder.model.filters[1].name).toEqual('filterB');
        });
    });

    describe('Between filter with two values', () => {
        it('Adds a Between filter with two values to model.filters', () => {
            const builder = makeBuilder();
            const betweenFilter = new FilterItem({
                name: 'createdAt',
                comparisonKind: ComparisonKind.Between,
                dbType: DbType.DateTime,
                values: ['2024-01-01', '2024-12-31'],
            });

            builder.withFilters({ createdAt: betweenFilter });

            expect(builder.model.filters).toHaveLength(1);
            const added = builder.model.filters[0];
            expect(added.name).toEqual('createdAt');
            expect(added.comparisonKind).toEqual(ComparisonKind.Between);
            expect(added.dbType).toEqual(DbType.DateTime);
            expect(added.values).toHaveLength(2);
            expect(added.value).toEqual('2024-01-01');
            expect(added.secondValue).toEqual('2024-12-31');
        });

        it('Does not exclude the Between filter when its name is not in the exclude list', () => {
            const builder = makeBuilder();
            const items = {
                createdAt: new FilterItem({
                    name: 'createdAt',
                    comparisonKind: ComparisonKind.Between,
                    dbType: DbType.DateTime,
                    values: ['2024-01-01', '2024-12-31'],
                }),
                status: makeFilter('status'),
            };

            builder.withFilters(items, ['status']);

            expect(builder.model.filters).toHaveLength(1);
            const added = builder.model.filters[0];
            expect(added.comparisonKind).toEqual(ComparisonKind.Between);
            expect(added.value).toEqual('2024-01-01');
            expect(added.secondValue).toEqual('2024-12-31');
        });

        it('Excludes the Between filter when its name is listed in exclude', () => {
            const builder = makeBuilder();
            const items = {
                createdAt: new FilterItem({
                    name: 'createdAt',
                    comparisonKind: ComparisonKind.Between,
                    dbType: DbType.DateTime,
                    values: ['2024-01-01', '2024-12-31'],
                }),
                status: makeFilter('status'),
            };

            builder.withFilters(items, ['createdAt']);

            expect(builder.model.filters).toHaveLength(1);
            expect(builder.model.filters[0].name).toEqual('status');
        });
    });
});
