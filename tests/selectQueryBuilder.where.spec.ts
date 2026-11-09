import { SelectQueryBuilder } from '../src/query/selectQueryBuilder';
import { FilterItem } from '../src/query/filterItem';
import { BoundaryKind } from '../src/query/queryBoundary';

function makeBuilder(): SelectQueryBuilder {
    return new SelectQueryBuilder(null as any);
}

describe('SelectQueryBuilder WHERE composition', () => {
    it('groups an existing disjunction when AND is applied', () => {
        const builder = makeBuilder();

        builder.where('rd_code = 65 OR rd_code = 66').whereAnd('project = @project');

        expect(builder.model.whereExpression).toBe(
            '(rd_code = 65 OR rd_code = 66) and (project = @project)',
        );
    });

    it('groups a newly added disjunction on the right of AND', () => {
        const builder = makeBuilder();

        builder.where('project = @project').whereAnd('rd_code = 65 OR rd_code = 66');

        expect(builder.model.whereExpression).toBe(
            '(project = @project) and (rd_code = 65 OR rd_code = 66)',
        );
    });

    it('groups both compound operands of OR', () => {
        const builder = makeBuilder();

        builder.where('a = 1 AND b = 2').whereOr('c = 3 AND d = 4');

        expect(builder.model.whereExpression).toBe(
            '(a = 1 AND b = 2) or (c = 3 AND d = 4)',
        );
    });

    it('groups OR followed by AND in call order', () => {
        const builder = makeBuilder();

        builder.where('a = 1').whereOr('b = 2').whereAnd('c = 3');

        expect(builder.model.whereExpression).toBe('((a = 1) or (b = 2)) and (c = 3)');
    });

    it('groups AND followed by OR in call order', () => {
        const builder = makeBuilder();

        builder.where('a = 1').whereAnd('b = 2').whereOr('c = 3');

        expect(builder.model.whereExpression).toBe('((a = 1) and (b = 2)) or (c = 3)');
    });

    it('keeps every operand in a repeated AND chain', () => {
        const builder = makeBuilder();

        builder.where('a = 1').whereAnd('b = 2').whereAnd('c = 3');

        expect(builder.model.whereExpression).toBe('((a = 1) and (b = 2)) and (c = 3)');
    });

    it('keeps a compound fragment as one operand', () => {
        const builder = makeBuilder();

        builder.where('a').whereOr('b AND c');

        expect(builder.model.whereExpression).toBe('(a) or (b AND c)');
    });

    it('keeps every operand in a repeated OR chain', () => {
        const builder = makeBuilder();

        builder.where('a = 1').whereOr('b = 2').whereOr('c = 3');

        expect(builder.model.whereExpression).toBe('((a = 1) or (b = 2)) or (c = 3)');
    });
});

describe('SelectQueryBuilder WHERE replacement and state', () => {
    it.each(['whereAnd', 'whereOr'] as const)('stores the first %s fragment verbatim', (method) => {
        const builder = makeBuilder();

        const result = builder[method]('a = 1 OR b = 2');

        expect(result).toBe(builder);
        expect(builder.model.whereExpression).toBe('a = 1 OR b = 2');
    });

    it('restarts an explicitly cleared condition verbatim', () => {
        const builder = makeBuilder();

        const result = builder.where('a = 1').where('').whereOr('b = 2');

        expect(result).toBe(builder);
        expect(builder.model.whereExpression).toBe('b = 2');
    });

    it('replaces the accumulated condition and groups the next operand', () => {
        const builder = makeBuilder();

        const result = builder
            .where('a = 1')
            .whereOr('b = 2')
            .where('c = 3 OR d = 4')
            .whereAnd('e = 5');

        expect(result).toBe(builder);
        expect(builder.model.whereExpression).toBe('(c = 3 OR d = 4) and (e = 5)');
    });

    it('retains existing parentheses and whitespace inside the new groups', () => {
        const builder = makeBuilder();

        builder.where(' (a = 1 OR b = 2) ').whereAnd(' c = 3 ');

        expect(builder.model.whereExpression).toBe('( (a = 1 OR b = 2) ) and ( c = 3 )');
    });

    it('returns the same builder and leaves other query fields unchanged', () => {
        const date = new Date(2026, 10, 30, 23, 59, 59);
        const filter = new FilterItem({ name: 'filterA' });
        const builder = makeBuilder()
            .from('records.su_request_saldo')
            .select(['rd_item', 'sum(quantity) as quantity'])
            .top(10)
            .offset(2)
            .take(5)
            .getDisplays(true)
            .orderBy('rd_item')
            .groupBy('rd_item')
            .having('sum(quantity) > 0')
            .parameter('project', 5)
            .withFilters({ a: filter })
            .beforeMoment(date);
        const model = builder.model;
        const parameters = model.parameters;
        const filters = model.filters;
        const boundaries = model.boundaries;
        const selectExpressions = model.selectExpressions;

        const whereResult = builder.where('a = 1');
        const andResult = builder.whereAnd('b = 2');
        const orResult = builder.whereOr('c = 3');

        expect(whereResult).toBe(builder);
        expect(andResult).toBe(builder);
        expect(orResult).toBe(builder);
        expect(builder.model).toBe(model);
        expect(builder.model.whereExpression).toBe('((a = 1) and (b = 2)) or (c = 3)');
        expect(builder.model.fromExpression).toBe('records.su_request_saldo');
        expect(builder.model.selectExpressions).toBe(selectExpressions);
        expect(builder.model.selectExpressions).toEqual(['rd_item', 'sum(quantity) as quantity']);
        expect(builder.model.top).toBe(10);
        expect(builder.model.offset).toBe(2);
        expect(builder.model.take).toBe(5);
        expect(builder.model.getDisplays).toBe(true);
        expect(builder.model.orderByExpression).toBe('rd_item');
        expect(builder.model.groupByExpresssion).toBe('rd_item');
        expect(builder.model.havingExpression).toBe('sum(quantity) > 0');
        expect(builder.model.parameters).toBe(parameters);
        expect(builder.model.parameters).toHaveLength(1);
        expect(builder.model.parameters[0].name).toBe('project');
        expect(builder.model.parameters[0].value).toBe(5);
        expect(builder.model.filters).toBe(filters);
        expect(builder.model.filters).toEqual([filter]);
        expect(builder.model.boundaries).toBe(boundaries);
        expect(builder.model.boundaries).toHaveLength(1);
        expect(builder.model.boundaries[0].kind).toBe(BoundaryKind.Before);
        expect(builder.model.boundaries[0].date).toBe('2026-11-30T23:59:59');
    });
});

describe('SelectQueryBuilder WHERE provider forwarding', () => {
    it('forwards the grouped condition without a backend', async () => {
        const date = new Date(2026, 10, 30, 23, 59, 59);
        const filter = new FilterItem({ name: 'filterA' });
        let received: any;
        const provider = {
            execute: async (model: any) => {
                received = model;
                return { isOK: true, data: { columns: [], rows: [] } };
            },
        };
        const builder = new SelectQueryBuilder(provider as any)
            .from('records.su_request_saldo')
            .parameter('c', 5)
            .withFilters({ a: filter })
            .beforeMoment(date)
            .where('a = 1 OR b = 2')
            .whereAnd('c = @c');

        const table = await builder.query();
        const serialized = JSON.parse(JSON.stringify(received));

        expect(received).toBe(builder.model);
        expect(received.whereExpression).toBe('(a = 1 OR b = 2) and (c = @c)');
        expect(serialized.whereExpression).toBe('(a = 1 OR b = 2) and (c = @c)');
        expect(received.parameters).toHaveLength(1);
        expect(received.parameters[0].name).toBe('c');
        expect(received.parameters[0].value).toBe(5);
        expect(serialized.parameters[0].name).toBe('c');
        expect(serialized.parameters[0].value).toBe(5);
        expect(received.filters).toEqual([filter]);
        expect(serialized.filters[0].name).toBe('filterA');
        expect(received.boundaries).toHaveLength(1);
        expect(received.boundaries[0].kind).toBe(BoundaryKind.Before);
        expect(received.boundaries[0].date).toBe('2026-11-30T23:59:59');
        expect(serialized.boundaries[0].kind).toBe(BoundaryKind.Before);
        expect(serialized.boundaries[0].date).toBe('2026-11-30T23:59:59');
        expect(table.columns).toEqual([]);
        expect(table.rows).toEqual([]);
    });
});
