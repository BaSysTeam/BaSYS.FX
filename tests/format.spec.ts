import {
    formatNumber,
    formatDate,
    formatBoolean,
    format,
} from '../src/common';

// ── formatNumber ────────────────────────────────────────────────────────

describe('formatNumber', () => {
    describe('default options (2 decimals, "." decimal, " " group)', () => {
        it('formats a simple decimal', () => {
            expect(formatNumber(1234.5)).toBe('1 234.50');
        });

        it('formats zero', () => {
            expect(formatNumber(0)).toBe('0.00');
        });

        it('formats a negative number', () => {
            expect(formatNumber(-1234.5)).toBe('-1 234.50');
        });

        it('formats an integer', () => {
            expect(formatNumber(1000)).toBe('1 000.00');
        });

        it('formats a large number', () => {
            expect(formatNumber(1234567890.12)).toBe('1 234 567 890.12');
        });

        it('rounds to 2 decimals', () => {
            expect(formatNumber(1.236)).toBe('1.24');
        });

        it('formats a number less than 1', () => {
            expect(formatNumber(0.5)).toBe('0.50');
        });

        it('does not group numbers with fewer than 4 digits', () => {
            expect(formatNumber(999)).toBe('999.00');
        });
    });

    describe('custom options object', () => {
        it('sets custom decimal places', () => {
            expect(formatNumber(1234.5678, { decimals: 3 })).toBe('1 234.568');
        });

        it('sets zero decimal places', () => {
            expect(formatNumber(1234.5, { decimals: 0 })).toBe('1 235');
        });

        it('uses comma as decimal separator', () => {
            expect(formatNumber(1234.5, { decimalSeparator: ',' })).toBe('1 234,50');
        });

        it('uses dot as group separator and comma as decimal', () => {
            expect(formatNumber(1234.5, {
                decimals: 1,
                decimalSeparator: ',',
                groupSeparator: '.',
            })).toBe('1.234,5');
        });

        it('disables grouping with empty string separator', () => {
            expect(formatNumber(1234567, { groupSeparator: '' })).toBe('1234567.00');
        });
    });

    describe('format string (ICU-style pattern)', () => {
        it('#,##0.00 — 2 decimals with grouping', () => {
            expect(formatNumber(1234.5, '#,##0.00')).toBe('1 234.50');
        });

        it('#,##0.000 — 3 decimals with grouping', () => {
            expect(formatNumber(1234.5, '#,##0.000')).toBe('1 234.500');
        });

        it('0.0 — 1 decimal, no grouping', () => {
            expect(formatNumber(1234.5, '0.0')).toBe('1234.5');
        });

        it('#,##0 — no decimals, with grouping', () => {
            expect(formatNumber(1234.5, '#,##0')).toBe('1 235');
        });

        it('0 — no decimals, no grouping', () => {
            expect(formatNumber(1234.5, '0')).toBe('1235');
        });

        it('handles negative numbers with format string', () => {
            expect(formatNumber(-9876.54, '#,##0.00')).toBe('-9 876.54');
        });
    });
});

// ── formatDate ──────────────────────────────────────────────────────────

describe('formatDate', () => {
    const date = new Date(2026, 2, 19, 14, 5, 9, 42); // 2026-03-19 14:05:09.042

    describe('default format (dd.MM.yyyy)', () => {
        it('formats date', () => {
            expect(formatDate(date)).toBe('19.03.2026');
        });
    });

    describe('custom date patterns', () => {
        it('yyyy-MM-dd', () => {
            expect(formatDate(date, 'yyyy-MM-dd')).toBe('2026-03-19');
        });

        it('dd/MM/yy', () => {
            expect(formatDate(date, 'dd/MM/yy')).toBe('19/03/26');
        });

        it('d.M.yyyy', () => {
            expect(formatDate(date, 'd.M.yyyy')).toBe('19.3.2026');
        });

        it('MM/dd/yyyy', () => {
            expect(formatDate(date, 'MM/dd/yyyy')).toBe('03/19/2026');
        });

        it('yyyy', () => {
            expect(formatDate(date, 'yyyy')).toBe('2026');
        });
    });

    describe('date + time patterns', () => {
        it('yyyy-MM-dd HH:mm:ss', () => {
            expect(formatDate(date, 'yyyy-MM-dd HH:mm:ss')).toBe('2026-03-19 14:05:09');
        });

        it('HH:mm', () => {
            expect(formatDate(date, 'HH:mm')).toBe('14:05');
        });

        it('hh:mm:ss a (12-hour format placeholder)', () => {
            expect(formatDate(date, 'hh:mm:ss')).toBe('02:05:09');
        });

        it('H:m:s — non-padded time', () => {
            expect(formatDate(date, 'H:m:s')).toBe('14:5:9');
        });

        it('SSS — milliseconds', () => {
            expect(formatDate(date, 'yyyy-MM-dd HH:mm:ss.SSS')).toBe('2026-03-19 14:05:09.042');
        });
    });

    describe('edge cases', () => {
        it('midnight', () => {
            const midnight = new Date(2026, 0, 1, 0, 0, 0, 0);
            expect(formatDate(midnight, 'dd.MM.yyyy HH:mm:ss')).toBe('01.01.2026 00:00:00');
        });

        it('end of year', () => {
            const endOfYear = new Date(2026, 11, 31);
            expect(formatDate(endOfYear, 'dd.MM.yyyy')).toBe('31.12.2026');
        });

        it('single-digit day and month', () => {
            const jan1 = new Date(2026, 0, 5);
            expect(formatDate(jan1, 'd.M.yyyy')).toBe('5.1.2026');
            expect(formatDate(jan1, 'dd.MM.yyyy')).toBe('05.01.2026');
        });

        it('12-hour: noon shows as 12', () => {
            const noon = new Date(2026, 0, 1, 12, 0, 0);
            expect(formatDate(noon, 'hh')).toBe('12');
        });

        it('12-hour: midnight shows as 12', () => {
            const midnight = new Date(2026, 0, 1, 0, 0, 0);
            expect(formatDate(midnight, 'hh')).toBe('12');
        });

        it('12-hour: 1 AM shows as 01', () => {
            const oneAM = new Date(2026, 0, 1, 1, 0, 0);
            expect(formatDate(oneAM, 'hh')).toBe('01');
        });
    });
});

// ── formatBoolean ───────────────────────────────────────────────────────

describe('formatBoolean', () => {
    it('true with defaults', () => {
        expect(formatBoolean(true)).toBe('true');
    });

    it('false with defaults', () => {
        expect(formatBoolean(false)).toBe('false');
    });

    it('true with custom labels', () => {
        expect(formatBoolean(true, { trueValue: 'Yes', falseValue: 'No' })).toBe('Yes');
    });

    it('false with custom labels', () => {
        expect(formatBoolean(false, { trueValue: 'Yes', falseValue: 'No' })).toBe('No');
    });

    it('custom labels in another language', () => {
        expect(formatBoolean(true, { trueValue: 'Да', falseValue: 'Нет' })).toBe('Да');
        expect(formatBoolean(false, { trueValue: 'Да', falseValue: 'Нет' })).toBe('Нет');
    });

    it('only trueValue provided, falseValue defaults', () => {
        expect(formatBoolean(false, { trueValue: 'On' })).toBe('false');
    });

    it('only falseValue provided, trueValue defaults', () => {
        expect(formatBoolean(true, { falseValue: 'Off' })).toBe('true');
    });
});

// ── format (unified dispatcher) ─────────────────────────────────────────

describe('format (unified)', () => {
    it('dispatches number formatting', () => {
        expect(format(1234.5)).toBe('1 234.50');
    });

    it('dispatches number formatting with options', () => {
        expect(format(1234.5, { decimals: 1, decimalSeparator: ',' })).toBe('1 234,5');
    });

    it('dispatches number formatting with format string', () => {
        expect(format(1234.5, '#,##0.000')).toBe('1 234.500');
    });

    it('dispatches date formatting', () => {
        const date = new Date(2026, 2, 19);
        expect(format(date)).toBe('19.03.2026');
    });

    it('dispatches date formatting with custom format', () => {
        const date = new Date(2026, 2, 19);
        expect(format(date, 'yyyy-MM-dd')).toBe('2026-03-19');
    });

    it('dispatches boolean formatting', () => {
        expect(format(true)).toBe('true');
        expect(format(false)).toBe('false');
    });

    it('dispatches boolean formatting with options', () => {
        expect(format(true, { trueValue: '1', falseValue: '0' })).toBe('1');
        expect(format(false, { trueValue: '1', falseValue: '0' })).toBe('0');
    });

    it('throws on unsupported type', () => {
        expect(() => format('hello' as any)).toThrow('format: unsupported value type');
    });
});
