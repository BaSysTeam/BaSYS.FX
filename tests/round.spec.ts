import { round } from '../src/common';
import { round as roundFromIndex } from '../src/index';
import * as publicApi from '../src/index';

describe('round', () => {
    describe('ordinary values', () => {
        it('rounds 1.005 away from zero to 1.01', () => {
            expect(round(1.005, 2)).toBe(1.01);
            expect(round(-1.005, 2)).toBe(-1.01);
        });

        it('rounds a negative half away from zero', () => {
            expect(round(-1.5)).toBe(-2);
            expect(round(1.5)).toBe(2);
        });

        it('uses the default precision of zero', () => {
            expect(round(12.6)).toBe(13);
            expect(round(12.6, undefined)).toBe(13);
        });

        it('rounds to positive and negative precision', () => {
            expect(round(1234.567, 2)).toBe(1234.57);
            expect(round(1234.567, -2)).toBe(1200);
            expect(round(1.2, 2)).toBe(1.2);
            expect(typeof round(1.2, 2)).toBe('number');
        });

        it('covers precisions 0, 1, 2, 3, and 6', () => {
            expect(round(1.2345674, 0)).toBe(1);
            expect(round(1.2345674, 1)).toBe(1.2);
            expect(round(1.2345674, 2)).toBe(1.23);
            expect(round(1.2345674, 3)).toBe(1.235);
            expect(round(1.2345674, 6)).toBe(1.234567);
            expect(round(1.2345675, 6)).toBe(1.234568);
        });

        it('covers precisions -1 and -2 on both signs', () => {
            expect(round(12345, -1)).toBe(12350);
            expect(round(-12345, -1)).toBe(-12350);
            expect(round(12345, -2)).toBe(12300);
            expect(round(-12345, -2)).toBe(-12300);
        });
    });

    describe('ties away from zero', () => {
        it('rounds integer ties on both sides', () => {
            expect(round(1.49)).toBe(1);
            expect(round(1.5)).toBe(2);
            expect(round(1.51)).toBe(2);
            expect(round(-1.49)).toBe(-1);
            expect(round(-1.5)).toBe(-2);
            expect(round(-1.51)).toBe(-2);
        });

        it('rounds fractional and integer-place ties', () => {
            expect(round(1.25, 1)).toBe(1.3);
            expect(round(-1.25, 1)).toBe(-1.3);
            expect(round(1250, -2)).toBe(1300);
            expect(round(-1250, -2)).toBe(-1300);
        });
    });

    describe('argument checks', () => {
        const invalidValues: unknown[] = [
            '1.25',
            '',
            null,
            undefined,
            true,
            { value: 1 },
            [1],
            new Number(1),
            Symbol('1'),
        ];

        it('rejects non-numeric values', () => {
            invalidValues.forEach((value) => {
                expect(() => round(value as number)).toThrow(TypeError);
            });
            expect(() => (round as () => number)()).toThrow(TypeError);
        });

        it('rejects non-numeric precision', () => {
            expect(() => round(1, '2' as unknown as number)).toThrow(TypeError);
            expect(() => round(1, null as unknown as number)).toThrow(TypeError);
            expect(() => round(1, false as unknown as number)).toThrow(TypeError);
            expect(() => round(1, { digits: 2 } as unknown as number)).toThrow(TypeError);
        });

        it('checks the value type before precision', () => {
            expect(() => round('1' as unknown as number, 1.5)).toThrow(TypeError);
        });

        it('checks digits before returning a non-finite value', () => {
            expect(() => round(NaN, '2' as unknown as number)).toThrow(TypeError);
            expect(() => round(Infinity, '2' as unknown as number)).toThrow(TypeError);
            [NaN, Infinity, -Infinity].forEach((value) => {
                [1.5, NaN, Infinity, -Infinity, -309, 325].forEach((digits) => {
                    expect(() => round(value, digits)).toThrow(RangeError);
                });
            });
        });

        it('rejects fractional, non-finite, and out-of-range precision', () => {
            [1.5, NaN, Infinity, -Infinity, -309, 325].forEach((digits) => {
                expect(() => round(1, digits)).toThrow(RangeError);
            });
        });

        it('treats explicit undefined precision as zero', () => {
            expect(round(12.6, undefined)).toBe(13);
            expect(round(NaN, undefined)).toBeNaN();
            expect(round(Infinity, undefined)).toBe(Infinity);
        });
    });

    describe('decimal edges and extreme values', () => {
        it('rounds canonical decimal ties, including negatives', () => {
            expect(round(1.005, 2)).toBe(1.01);
            expect(round(2.675, 2)).toBe(2.68);
            expect(round(1.255, 2)).toBe(1.26);
            expect(round(10.075, 2)).toBe(10.08);
            expect(round(-1.005, 2)).toBe(-1.01);
            expect(round(-2.675, 2)).toBe(-2.68);
            expect(round(-1.255, 2)).toBe(-1.26);
            expect(round(-10.075, 2)).toBe(-10.08);
        });

        it('does not pull a value just below a tie upward', () => {
            expect(round(1.4999999999999998)).toBe(1);
        });

        it('rounds exponential notation and carries digits', () => {
            expect(round(1.25e-7, 8)).toBe(1.3e-7);
            expect(round(-1.25e-7, 8)).toBe(-1.3e-7);
            expect(round(9.995, 2)).toBe(10);
        });

        it('rounds an empty kept coefficient away from zero on a tie', () => {
            expect(round(5, -1)).toBe(10);
            expect(round(-5, -1)).toBe(-10);
            expect(round(5e-323, 322)).toBe(1e-322);
            expect(round(-5e-323, 322)).toBe(-1e-322);
        });

        it('returns positive zero below half a unit and rounds above it', () => {
            expect(Object.is(round(4.9, -1), 0)).toBe(true);
            expect(Object.is(round(-4.9, -1), 0)).toBe(true);
            expect(round(5.1, -1)).toBe(10);
            expect(round(-5.1, -1)).toBe(-10);
            expect(Object.is(round(4e-323, 322), 0)).toBe(true);
            expect(Object.is(round(-4e-323, 322), 0)).toBe(true);
            expect(round(6e-323, 322)).toBe(1e-322);
            expect(round(-6e-323, 322)).toBe(-1e-322);
        });

        it('allows both precision bounds', () => {
            expect(round(1, -308)).toBe(0);
            expect(Object.is(round(1, -308), 0)).toBe(true);
            expect(round(1, 324)).toBe(1);
        });

        it('preserves non-finite values for an allowed precision', () => {
            expect(round(NaN, 2)).toBeNaN();
            expect(round(Infinity, 2)).toBe(Infinity);
            expect(round(-Infinity, -2)).toBe(-Infinity);
        });

        it('normalizes every zero result to positive zero', () => {
            expect(Object.is(round(-0), 0)).toBe(true);
            expect(Object.is(round(0), 0)).toBe(true);
            expect(Object.is(round(-0.004, 2), 0)).toBe(true);
        });

        it('keeps a large finite value when the rounded result fits', () => {
            expect(round(Number.MAX_VALUE, 2)).toBe(Number.MAX_VALUE);
            expect(round(-Number.MAX_VALUE, 324)).toBe(-Number.MAX_VALUE);
            expect(round(1e308, -308)).toBe(1e308);
        });

        it('returns signed infinity when the final result overflows', () => {
            expect(round(Number.MAX_VALUE, -308)).toBe(Infinity);
            expect(round(-Number.MAX_VALUE, -308)).toBe(-Infinity);
        });

        it('rounds subnormal numbers with the same decimal rule', () => {
            expect(round(Number.MIN_VALUE, 324)).toBe(Number.MIN_VALUE);
            expect(round(Number.MIN_VALUE, 323)).toBe(1e-323);
            expect(Object.is(round(-Number.MIN_VALUE, 322), 0)).toBe(true);
        });
    });

    describe('public exports', () => {
        it('exports round without the decimal core', () => {
            expect(roundFromIndex(1.005, 2)).toBe(1.01);
            expect(roundFromIndex).toBe(round);
            expect(publicApi.round).toBe(round);
            const exported = publicApi as Record<string, unknown>;
            expect(exported.roundDecimal).toBeUndefined();
            expect(exported.parseCanonical).toBeUndefined();
            expect(exported.DecimalRecord).toBeUndefined();
        });
    });
});
