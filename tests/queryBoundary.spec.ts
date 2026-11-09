import * as vm from 'vm';
import { BoundaryKind, QueryBoundary, isMoment, moment } from '../src/query/queryBoundary';

const metaObject = 'operation.su_supplier_order';

describe('moment', () => {
    it('copies date, meta object and number', () => {
        const header = {
            date: new Date(2026, 9, 22, 12, 37, 59),
            number: 7,
        };

        const result = moment(header, metaObject);

        expect(result.metaObject).toBe(metaObject);
        expect(result.number).toBe(7);
        expect(result.date.getTime()).toBe(header.date.getTime());
        expect(result.date).not.toBe(header.date);
        expect(isMoment(result)).toBe(true);
    });

    it('parses a header date string as local time', () => {
        const result = moment({ date: '2026-10-22T12:37:59', number: 7 }, metaObject);

        expect(result.date.getTime()).toBe(new Date(2026, 9, 22, 12, 37, 59).getTime());
    });

    it.each([undefined, null, '', 0])('stores empty number %p as null', (number) => {
        const result = moment({ date: new Date(2026, 9, 22, 12, 37, 59), number }, metaObject);

        expect(result.number).toBeNull();
    });

    it('requires a meta object', () => {
        const header = { date: new Date(2026, 9, 22, 12, 37, 59) };

        expect(() => moment(header)).toThrow('moment: operation meta object is not specified.');
        expect(() => moment(header, '')).toThrow('moment: operation meta object is not specified.');
        expect(() => moment(header, null as any)).toThrow('moment: operation meta object is not specified.');
    });

    it('requires a header object and a valid date', () => {
        expect(() => moment(null as any, metaObject)).toThrow('moment: header is required.');
        expect(() => moment({} as any, metaObject)).toThrow('moment: header.date is not a valid date.');
        expect(() => moment({ date: 'abc' }, metaObject)).toThrow('moment: header.date is not a valid date.');
    });

    it('does not follow later header edits', () => {
        const headerDate = new Date(2026, 9, 22, 12, 37, 59);
        const header: Record<string, any> = { date: headerDate, number: 7 };
        const result = moment(header, metaObject);
        const originalTime = result.date.getTime();

        header.number = 9;
        header.date.setTime(0);
        header.date = new Date(2000, 0, 1);

        expect(result.date).not.toBe(headerDate);
        expect(result.date).not.toBe(header.date);
        expect(result.date.getTime()).toBe(originalTime);
        expect(result.number).toBe(7);
    });

    it('copies a date created in another engine context', () => {
        const foreignDate = vm.runInNewContext('new Date(2026, 9, 22, 12, 37, 59)') as Date;

        expect(typeof (foreignDate as any).toLocalISO).toBe('undefined');

        const result = moment({ date: foreignDate, number: 7 }, metaObject);

        expect(result.date.getTime()).toBe(foreignDate.getTime());
        expect(typeof result.date.toLocalISO).toBe('function');
        expect(result.date).not.toBe(foreignDate);
    });
});

describe('isMoment', () => {
    const date = new Date(2026, 9, 22, 12, 37, 59);

    it('accepts only an object with a valid date and a meta object', () => {
        expect(isMoment(moment({ date, number: 7 }, metaObject))).toBe(true);
        expect(isMoment(date)).toBe(false);
        expect(isMoment('2026-10-22')).toBe(false);
        expect(isMoment({ date })).toBe(false);
        expect(isMoment({ metaObject })).toBe(false);
        expect(isMoment({ date: new Date(NaN), metaObject })).toBe(false);
    });
});

describe('QueryBoundary', () => {
    it('keeps zero kind and false excludeOwn and turns undefined into null', () => {
        const boundary = new QueryBoundary({
            kind: BoundaryKind.Before,
            excludeOwn: false,
        });

        expect(boundary.kind).toBe(0);
        expect(boundary.excludeOwn).toBe(false);
        expect(boundary.date).toBeNull();
        expect(boundary.metaObject).toBeNull();
        expect(boundary.number).toBeNull();
        expect(boundary.column).toBeNull();
    });
});
