import '../dateExtensions';

export enum BoundaryKind {
    Before = 0,
    UpTo = 1,
    From = 2,
    After = 3,
}

export interface Moment {
    date: Date;
    metaObject: string;
    number?: number | string | null;
}

export interface BoundaryOptions {
    excludeOwn?: boolean;
    column?: string;
}

export class QueryBoundary {
    kind: BoundaryKind | null;
    date: string | null;
    metaObject: string | null;
    number: number | string | null;
    excludeOwn: boolean | null;
    column: string | null;

    constructor(params: any) {
        const data = params ?? {};

        this.kind = data.kind ?? null;
        this.date = data.date ?? null;
        this.metaObject = data.metaObject ?? null;
        this.number = data.number ?? null;
        this.excludeOwn = data.excludeOwn ?? null;
        this.column = data.column ?? null;
    }
}

function isBoundaryDate(value: unknown): value is Date {
    return Object.prototype.toString.call(value) === '[object Date]'
        && !isNaN((value as Date).getTime());
}

export function isMoment(value: unknown): value is Moment {
    if (value == null || typeof value !== 'object' || isBoundaryDate(value)) {
        return false;
    }

    const candidate = value as { date?: unknown; metaObject?: unknown };
    return isBoundaryDate(candidate.date)
        && typeof candidate.metaObject === 'string'
        && candidate.metaObject.length > 0;
}

function normalizeNumber(value: unknown): number | string | null {
    if (value === undefined || value === null || value === '' || value === 0) {
        return null;
    }

    return value as number | string;
}

export function moment(header: Record<string, any>, metaObject?: string): Moment {
    if (typeof metaObject !== 'string' || metaObject === '') {
        throw new Error('moment: operation meta object is not specified.');
    }

    if (header == null || typeof header !== 'object') {
        throw new Error('moment: header is required.');
    }

    const rawDate = header.date;
    let date: Date;
    if (typeof rawDate === 'string') {
        date = new Date(rawDate);
    } else if (isBoundaryDate(rawDate)) {
        date = new Date(rawDate.getTime());
    } else {
        throw new Error('moment: header.date is not a valid date.');
    }

    if (isNaN(date.getTime())) {
        throw new Error('moment: header.date is not a valid date.');
    }

    return {
        date,
        metaObject,
        number: normalizeNumber(header.number),
    };
}
