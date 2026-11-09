import * as vm from 'vm';
import { SelectQueryBuilder } from '../src/query/selectQueryBuilder';
import { SelectQueryModel } from '../src/query/selectQueryModel';
import { BoundaryKind, QueryBoundary, moment } from '../src/query/queryBoundary';
import { FilterItem } from '../src/query/filterItem';

function makeBuilder(): SelectQueryBuilder {
    return new SelectQueryBuilder(null as any);
}

describe('SelectQueryBuilder boundaries', () => {
    const date = new Date(2026, 10, 30, 23, 59, 59);

    it.each([
        ['beforeMoment', BoundaryKind.Before],
        ['upToMoment', BoundaryKind.UpTo],
        ['fromMoment', BoundaryKind.From],
        ['afterMoment', BoundaryKind.After],
    ] as const)('%s adds one date boundary and returns the builder', (method, kind) => {
        const builder = makeBuilder();

        const result = builder[method](date);

        expect(result).toBe(builder);
        expect(builder.model.boundaries).toHaveLength(1);
        expect(builder.model.boundaries[0]).toEqual(expect.objectContaining({
            kind,
            date: '2026-11-30T23:59:59',
            metaObject: null,
            number: null,
            excludeOwn: null,
            column: null,
        }));
    });

    it('accepts a date from another engine context', () => {
        const foreignDate = vm.runInNewContext('new Date(2026, 10, 30, 23, 59, 59)') as Date;
        const builder = makeBuilder();

        expect(typeof (foreignDate as any).toLocalISO).toBe('undefined');

        expect(() => builder.upToMoment(foreignDate)).not.toThrow();
        expect(builder.model.boundaries[0].date).toBe('2026-11-30T23:59:59');
    });

    it('serializes endMonth without milliseconds', () => {
        const builder = makeBuilder();

        builder.upToMoment(new Date(2026, 10, 15).endMonth());

        expect(builder.model.boundaries[0].date).toBe('2026-11-30T23:59:59');
    });

    it('copies an operation moment', () => {
        const builder = makeBuilder();
        const operation = moment(
            { date: new Date(2026, 9, 22, 12, 37, 59), number: 7 },
            'operation.su_supplier_order',
        );

        builder.beforeMoment(operation);

        expect(builder.model.boundaries[0].date).toBe('2026-10-22T12:37:59');
        expect(builder.model.boundaries[0].metaObject).toBe('operation.su_supplier_order');
        expect(builder.model.boundaries[0].number).toBe(7);
    });

    it('stores a missing operation number as null', () => {
        const builder = makeBuilder();
        const operation = moment(
            { date: new Date(2026, 9, 22, 12, 37, 59), number: null },
            'operation.su_supplier_order',
        );

        builder.beforeMoment(operation);

        expect(builder.model.boundaries[0].number).toBeNull();
    });

    it('serializes a hand-built moment whose date comes from another context', () => {
        const foreignDate = vm.runInNewContext('new Date(2026, 9, 22, 12, 37, 59)') as Date;
        const builder = makeBuilder();

        expect(typeof (foreignDate as any).toLocalISO).toBe('undefined');

        expect(() => builder.beforeMoment({
            date: foreignDate,
            metaObject: 'operation.su_supplier_order',
            number: 7,
        })).not.toThrow();

        expect(builder.model.boundaries[0].date).toBe(new Date(foreignDate.getTime()).toLocalISO());
        expect(builder.model.boundaries[0].date).toBe('2026-10-22T12:37:59');
        expect(builder.model.boundaries[0].number).toBe(7);
    });

    it('forwards excludeOwn and column, and uses null when options are omitted', () => {
        const builder = makeBuilder();

        builder.upToMoment(date, { excludeOwn: false, column: 'delivery_date' });
        builder.afterMoment(date);

        expect(builder.model.boundaries[0].excludeOwn).toBe(false);
        expect(builder.model.boundaries[0].column).toBe('delivery_date');
        expect(builder.model.boundaries[1].excludeOwn).toBeNull();
        expect(builder.model.boundaries[1].column).toBeNull();
    });

    it('keeps several boundaries in call order', () => {
        const builder = makeBuilder();
        const start = new Date(2026, 10, 1);
        const end = new Date(2026, 10, 30, 23, 59, 59);

        builder.fromMoment(start).upToMoment(end);

        expect(builder.model.boundaries.map((boundary) => boundary.kind)).toEqual([
            BoundaryKind.From,
            BoundaryKind.UpTo,
        ]);
        expect(builder.model.boundaries[0].date).toBe('2026-11-01T00:00:00');
        expect(builder.model.boundaries[1].date).toBe('2026-11-30T23:59:59');
    });

    it.each(['2026-11-01', null, {}, new Date(NaN)])('rejects %p and leaves boundaries unchanged', (value) => {
        const builder = makeBuilder();
        builder.upToMoment(date);
        const before = builder.model.boundaries.slice();

        expect(() => builder.beforeMoment(value as any)).toThrow(
            'beforeMoment: argument must be a Date or a moment.',
        );
        expect(builder.model.boundaries).toEqual(before);
    });

    it('rejects column on an operation moment and leaves boundaries unchanged', () => {
        const builder = makeBuilder();
        const operation = moment(
            { date: new Date(2026, 9, 22, 12, 37, 59), number: 7 },
            'operation.su_supplier_order',
        );
        builder.upToMoment(date);
        const before = builder.model.boundaries.slice();

        expect(() => builder.beforeMoment(operation, { column: 'delivery_date' })).toThrow(
            'beforeMoment: options.column is allowed for date boundaries only.',
        );
        expect(builder.model.boundaries).toEqual(before);
    });

    it('does not change where, parameters or filters', () => {
        const builder = makeBuilder();
        const filter = new FilterItem({ name: 'filterA' });
        builder.where('project = @project').parameter('project', 5);
        builder.model.filters.push(filter);
        const parameters = builder.model.parameters;
        const filters = builder.model.filters;

        builder.fromMoment(date);

        expect(builder.model.whereExpression).toBe('project = @project');
        expect(builder.model.parameters).toBe(parameters);
        expect(builder.model.parameters).toHaveLength(1);
        expect(builder.model.parameters.some((parameter) => String(parameter.name).includes('p_bnd'))).toBe(false);
        expect(builder.model.filters).toBe(filters);
        expect(builder.model.filters).toEqual([filter]);
    });

    it('serializes every boundary field with explicit nulls', () => {
        const builder = makeBuilder();

        builder.upToMoment(new Date(2026, 10, 30, 23, 59, 59));

        expect(JSON.parse(JSON.stringify(builder.model)).boundaries).toEqual([{
            kind: 1,
            date: '2026-11-30T23:59:59',
            metaObject: null,
            number: null,
            excludeOwn: null,
            column: null,
        }]);
    });

    it('restores boundaries as QueryBoundary instances', () => {
        const builder = makeBuilder();
        builder.upToMoment(date, { excludeOwn: false, column: 'delivery_date' });

        const restored = new SelectQueryModel(JSON.parse(JSON.stringify(builder.model)));

        expect(restored.boundaries).toHaveLength(1);
        expect(restored.boundaries[0]).toBeInstanceOf(QueryBoundary);
        expect(restored.boundaries[0]).toEqual(expect.objectContaining({
            kind: BoundaryKind.UpTo,
            date: '2026-11-30T23:59:59',
            metaObject: null,
            number: null,
            excludeOwn: false,
            column: 'delivery_date',
        }));
    });

    it('restores an empty boundary list when the field is absent', () => {
        const restored = new SelectQueryModel({ fromExpression: 'records.su_request_saldo' });

        expect(restored.boundaries).toEqual([]);
    });
});
