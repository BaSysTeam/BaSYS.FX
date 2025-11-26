interface Date {
    beginDay(): Date;
    endDay(): Date;
    addDays(days: number): Date;
    beginMonth(): Date;
    endMonth(): Date;
    addMonths(months: number): Date;
    beginQuarter(): Date;
    endQuarter(): Date;
    addQuarters(quarters: number): Date;
    beginYear(): Date;
    endYear(): Date;
    addYears(years: number): Date;
    beginDayUTC(): Date;
    endDayUTC(): Date;
    addDaysUTC(days: number): Date;
    beginMonthUTC(): Date;
    endMonthUTC(): Date;
    addMonthsUTC(months: number): Date;
    beginQuarterUTC(): Date;
    endQuarterUTC(): Date;
    addQuartersUTC(quarters: number): Date;
    beginYearUTC(): Date;
    endYearUTC(): Date;
    addYearsUTC(years: number): Date;
    toLocalISO(): string;
}

Date.prototype.beginDay = function beginDay(): Date {
    const d = new Date(this);
    d.setHours(0, 0, 0, 0);
    return d;
};

Date.prototype.endDay = function endDay(): Date {
    const d = new Date(this);
    d.setHours(23, 59, 59, 999);
    return d;
};

Date.prototype.addDays = function addDays(days: number): Date {
    const d = new Date(this);
    d.setDate(d.getDate() + days);
    return d;
};

Date.prototype.beginMonth = function beginMonth(): Date {
    return new Date(this.getFullYear(), this.getMonth(), 1, 0, 0, 0, 0);
};

Date.prototype.endMonth = function endMonth(): Date {
    // День "0" следующего месяца — это последний день текущего
    return new Date(this.getFullYear(), this.getMonth() + 1, 0, 23, 59, 59, 999);
};

Date.prototype.addMonths = function addMonth(months: number): Date {
    const d = new Date(this);
    d.setMonth(d.getMonth() + months);
    return d;
};

Date.prototype.beginQuarter = function beginQuarter(): Date {
    const startMonth = Math.floor(this.getMonth() / 3) * 3;
    return new Date(this.getFullYear(), startMonth, 1, 0, 0, 0, 0);
};

Date.prototype.endQuarter = function endQuarter(): Date {
    const startMonth = Math.floor(this.getMonth() / 3) * 3;
    return new Date(this.getFullYear(), startMonth + 3, 0, 23, 59, 59, 999);
};

Date.prototype.addQuarters = function addQuarters(quarters: number): Date {
    const d = new Date(this);
    d.setMonth(d.getMonth() + quarters * 3);
    return d;
};

Date.prototype.beginYear = function beginYear(): Date {
    return new Date(this.getFullYear(), 0, 1, 0, 0, 0, 0);
};

Date.prototype.endYear = function endYear(): Date {
    return new Date(this.getFullYear(), 11, 31, 23, 59, 59, 999);
};

Date.prototype.addYears = function addYears(years: number): Date {
    const d = new Date(this);
    d.setFullYear(d.getFullYear() + years);
    return d;
};

// UTC versions
Date.prototype.beginDayUTC = function beginDayUTC(): Date {
    const d = new Date(this);
    d.setUTCHours(0, 0, 0, 0);
    return d;
};

Date.prototype.endDayUTC = function endDayUTC(): Date {
    const d = new Date(this);
    d.setUTCHours(23, 59, 59, 999);
    return d;
};

Date.prototype.addDaysUTC = function addDaysUTC(days: number): Date {
    const d = new Date(this);
    d.setUTCDate(d.getUTCDate() + days);
    return d;
};

Date.prototype.beginMonthUTC = function beginMonthUTC(): Date {
    return new Date(Date.UTC(this.getUTCFullYear(), this.getUTCMonth(), 1, 0, 0, 0, 0));
};

Date.prototype.endMonthUTC = function endMonthUTC(): Date {
    // День "0" следующего месяца — это последний день текущего
    return new Date(Date.UTC(this.getUTCFullYear(), this.getUTCMonth() + 1, 0, 23, 59, 59, 999));
};

Date.prototype.addMonthsUTC = function addMonthsUTC(months: number): Date {
    const d = new Date(this);
    d.setUTCMonth(d.getUTCMonth() + months);
    return d;
};

Date.prototype.beginQuarterUTC = function beginQuarterUTC(): Date {
    const startMonth = Math.floor(this.getUTCMonth() / 3) * 3;
    return new Date(Date.UTC(this.getUTCFullYear(), startMonth, 1, 0, 0, 0, 0));
};

Date.prototype.endQuarterUTC = function endQuarterUTC(): Date {
    const startMonth = Math.floor(this.getUTCMonth() / 3) * 3;
    return new Date(Date.UTC(this.getUTCFullYear(), startMonth + 3, 0, 23, 59, 59, 999));
};

Date.prototype.addQuartersUTC = function addQuartersUTC(quarters: number): Date {
    const d = new Date(this);
    d.setUTCMonth(d.getUTCMonth() + quarters * 3);
    return d;
};

Date.prototype.beginYearUTC = function beginYearUTC(): Date {
    return new Date(Date.UTC(this.getUTCFullYear(), 0, 1, 0, 0, 0, 0));
};

Date.prototype.endYearUTC = function endYearUTC(): Date {
    return new Date(Date.UTC(this.getUTCFullYear(), 11, 31, 23, 59, 59, 999));
};

Date.prototype.addYearsUTC = function addYearsUTC(years: number): Date {
    const d = new Date(this);
    d.setUTCFullYear(d.getUTCFullYear() + years);
    return d;
};

Date.prototype.toLocalISO = function toLocalISO(): string {
    const date = new Date(this);

    const pad = (n:any):string => n.toString().padStart(2, '0');

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hour = pad(date.getHours());
    const minute = pad(date.getMinutes());
    const second = pad(date.getSeconds());

    return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
};
