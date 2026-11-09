// Internal decimal rounding shared by round and formatNumber.
// Callers validate their own contracts. This module is not a public export.

export interface DecimalRecord {
    negative: boolean;
    coefficient: string;
    exponent: number;
    unchanged: boolean;
}

function zeroRecord(unchanged: boolean): DecimalRecord {
    return {
        negative: false,
        coefficient: '0',
        exponent: 0,
        unchanged,
    };
}

function parseCanonical(text: string): { coefficient: string; exponent: number } {
    const match = /^(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/i.exec(text);
    if (!match) {
        throw new Error('Unexpected decimal representation: ' + text);
    }

    const fraction = match[2] || '';
    const exponentPart = match[3] ? parseInt(match[3], 10) : 0;
    let coefficient = match[1] + fraction;
    const exponent = exponentPart - fraction.length;

    let firstSignificant = 0;
    while (firstSignificant < coefficient.length && coefficient.charAt(firstSignificant) === '0') {
        firstSignificant += 1;
    }

    coefficient = coefficient.substring(firstSignificant);
    if (coefficient.length === 0) {
        return { coefficient: '0', exponent: 0 };
    }

    return { coefficient, exponent };
}

function incrementCoefficient(digits: string): string {
    const incremented = digits.split('');
    let carry = 1;

    for (let index = incremented.length - 1; index >= 0 && carry > 0; index -= 1) {
        const sum = incremented[index].charCodeAt(0) - 48 + carry;
        if (sum === 10) {
            incremented[index] = '0';
            carry = 1;
        } else {
            incremented[index] = String(sum);
            carry = 0;
        }
    }

    if (carry > 0) {
        incremented.unshift('1');
    }

    return incremented.join('');
}

/**
 * Rounds the canonical decimal magnitude of a finite number.
 * The record stays decimal: coefficient × 10^exponent. A zero uses
 * coefficient "0" and no sign. An unchanged value keeps its original
 * coefficient and exponent.
 */
export function roundDecimal(value: number, digits: number): DecimalRecord {
    if (value === 0) {
        return zeroRecord(true);
    }

    const negative = value < 0;
    const parsed = parseCanonical(String(Math.abs(value)));
    if (parsed.coefficient === '0') {
        return zeroRecord(true);
    }

    const length = parsed.coefficient.length;
    // Digits of the coefficient that fall past the selected place.
    // k > length is below half a unit. k === length keeps nothing and
    // must still inspect the first discarded digit.
    const discard = -digits - parsed.exponent;

    if (discard <= 0) {
        return {
            negative,
            coefficient: parsed.coefficient,
            exponent: parsed.exponent,
            unchanged: true,
        };
    }

    if (discard > length) {
        return zeroRecord(false);
    }

    const keptLength = length - discard;
    const firstDiscarded = parsed.coefficient.charCodeAt(keptLength) - 48;

    if (keptLength === 0) {
        if (firstDiscarded < 5) {
            return zeroRecord(false);
        }
        return {
            negative,
            coefficient: '1',
            exponent: -digits,
            unchanged: false,
        };
    }

    let coefficient = parsed.coefficient.substring(0, keptLength);
    if (firstDiscarded >= 5) {
        coefficient = incrementCoefficient(coefficient);
    }

    return {
        negative,
        coefficient,
        exponent: -digits,
        unchanged: false,
    };
}
