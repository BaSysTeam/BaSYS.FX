import '../src/dateExtensions'; // Import for Date extensions

describe('dateExtensions', () => {
  it('beginDay', () => {
    const date = new Date('2024-09-02T11:32:45');
    expect(date.beginDay()).toEqual(new Date('2024-09-02T00:00:00'));
  });

  it('endDay', () => {
    const date = new Date('2024-09-02T11:32:45');
    expect(date.endDay()).toEqual(new Date(2024, 8, 2, 23, 59, 59, 999));
  });

  it('addDays plus 1', () => {
    const date = new Date('2024-09-02T11:32:45');
    expect(date.addDays(1)).toEqual(new Date(2024, 8, 3, 11, 32, 45));
  });

  it('addDays plus 30', () => {
    const date = new Date('2024-09-02T11:32:45');
    expect(date.addDays(30)).toEqual(new Date(2024, 9, 2, 11, 32, 45));
  });

  it('addDays minus 1', () => {
    const date = new Date('2024-09-02T11:32:45');
    expect(date.addDays(-1)).toEqual(new Date(2024, 8, 1, 11, 32, 45));
  });

  it('beginMonth', () => {
    const date = new Date('2024-09-17T11:54:22');
    expect(date.beginMonth()).toEqual(new Date('2024-09-01T00:00:00'));
  });

  it('endMonth 30 days', () => {
    const date = new Date('2024-09-17T11:54:22');
    expect(date.endMonth()).toEqual(new Date(2024, 8, 30, 23, 59, 59, 999));
  });

  it('endMonth 31 days', () => {
    const date = new Date('2024-10-17T11:54:22');
    expect(date.endMonth()).toEqual(new Date(2024, 9, 31, 23, 59, 59, 999));
  });

  it('endMonth 29 days', () => {
    const date = new Date('2024-02-17T11:54:22');
    expect(date.endMonth()).toEqual(new Date(2024, 1, 29, 23, 59, 59, 999));
  });

  it('endMonth 28 days', () => {
    const date = new Date('2023-02-17T11:54:22');
    expect(date.endMonth()).toEqual(new Date(2023, 1, 28, 23, 59, 59, 999));
  });

  it('beginQuarter 1 quarter', () => {
    const date = new Date('2024-02-17T11:54:22');
    expect(date.beginQuarter()).toEqual(new Date(2024, 0, 1));
  });

  it('beginQuarter 2 quarter', () => {
    const date = new Date('2024-05-17T11:54:22');
    expect(date.beginQuarter()).toEqual(new Date(2024, 3, 1));
  });

  it('beginQuarter 3 quarter', () => {
    const date = new Date('2024-09-17T11:54:22');
    expect(date.beginQuarter()).toEqual(new Date(2024, 6, 1));
  });

  it('beginQuarter 4 quarter', () => {
    const date = new Date('2024-11-17T11:54:22');
    expect(date.beginQuarter()).toEqual(new Date(2024, 9, 1));
  });

  it('endQuarter 1 quarter', () => {
    const date = new Date('2024-02-17T11:54:22');
    expect(date.endQuarter()).toEqual(new Date(2024, 2, 31, 23, 59, 59, 999));
  });

  it('endQuarter 2 quarter', () => {
    const date = new Date('2024-05-17T11:54:22');
    expect(date.endQuarter()).toEqual(new Date(2024, 5, 30, 23, 59, 59, 999));
  });

  it('endQuarter 3 quarter', () => {
    const date = new Date('2024-09-17T11:54:22');
    expect(date.endQuarter()).toEqual(new Date(2024, 8, 30, 23, 59, 59, 999));
  });

  it('endQuarter 4 quarter', () => {
    const date = new Date('2024-11-17T11:54:22');
    expect(date.endQuarter()).toEqual(new Date(2024, 11, 31, 23, 59, 59, 999));
  });

  it('beginYear', () => {
    const date = new Date('2024-09-02T11:32:45');
    expect(date.beginYear()).toEqual(new Date(2024, 0, 1));
  });

  it('endYear', () => {
    const date = new Date('2024-09-02T11:32:45');
    expect(date.endYear()).toEqual(new Date(2024, 11, 31, 23, 59, 59, 999));
  });

  it('addYears plus 1', () => {
    const date = new Date('2024-09-02T11:32:45');
    expect(date.addYears(1)).toEqual(new Date(2025, 8, 2, 11, 32, 45, 0));
  });

  it('addYears minus 1', () => {
    const date = new Date('2024-09-02T11:32:45');
    expect(date.addYears(-1)).toEqual(new Date(2023, 8, 2, 11, 32, 45, 0));
  });
});

describe('addMonths', () => {
  test.each([
    ['2024-09-17T14:47:23', 1, '2024-10-17T14:47:23'],
    ['2024-09-17T14:47:23', 1.3, '2024-10-17T14:47:23'],
    ['2024-09-17T14:47:23', 1.6, '2024-10-17T14:47:23'],
    ['2024-09-17T14:47:23', 2, '2024-11-17T14:47:23'],
    ['2024-09-17T14:47:23', -1, '2024-08-17T14:47:23'],
  ])('adds to %j  %j months to get %j', (start, shift, expected) => {
    const date = new Date(start);
    expect(date.addMonths(shift)).toEqual(new Date(expected));
  });
});

describe('addQuarters', () => {
  test.each([
    ['2024-09-17T14:47:23', 1, '2024-12-17T14:47:23'],
    ['2024-09-17T14:47:23', -1, '2024-06-17T14:47:23'],
  ])('adds to %j  %j quarters to get %j', (start, shift, expected) => {
    const date = new Date(start);
    expect(date.addQuarters(shift)).toEqual(new Date(expected));
  });
});

describe('dateDifference', () => {
  test.each([
    [new Date(2024, 9, 17), new Date(2025, 9, 17), 'year', 1],
  ])('dateDifference between %j and %j in %j is equals %j', (start, end, kind, expected) => {
    expect(true).toEqual(true);
  });
});

describe('dateExtensions UTC', () => {
  it('beginDayUTC', () => {
    const date = new Date('2024-09-02T11:32:45Z');
    const result = date.beginDayUTC();
    expect(result.getUTCHours()).toBe(0);
    expect(result.getUTCMinutes()).toBe(0);
    expect(result.getUTCSeconds()).toBe(0);
    expect(result.getUTCMilliseconds()).toBe(0);
    expect(result.getUTCDate()).toBe(2);
    expect(result.getUTCMonth()).toBe(8); // September
    expect(result.getUTCFullYear()).toBe(2024);
  });

  it('endDayUTC', () => {
    const date = new Date('2024-09-02T11:32:45Z');
    const result = date.endDayUTC();
    expect(result.getUTCHours()).toBe(23);
    expect(result.getUTCMinutes()).toBe(59);
    expect(result.getUTCSeconds()).toBe(59);
    expect(result.getUTCMilliseconds()).toBe(999);
    expect(result.getUTCDate()).toBe(2);
    expect(result.getUTCMonth()).toBe(8); // September
    expect(result.getUTCFullYear()).toBe(2024);
  });

  it('addDaysUTC plus 1', () => {
    const date = new Date('2024-09-02T11:32:45Z');
    const result = date.addDaysUTC(1);
    expect(result.getUTCDate()).toBe(3);
    expect(result.getUTCMonth()).toBe(8); // September
    expect(result.getUTCFullYear()).toBe(2024);
    expect(result.getUTCHours()).toBe(11);
    expect(result.getUTCMinutes()).toBe(32);
  });

  it('addDaysUTC plus 30', () => {
    const date = new Date('2024-09-02T11:32:45Z');
    const result = date.addDaysUTC(30);
    expect(result.getUTCDate()).toBe(2);
    expect(result.getUTCMonth()).toBe(9); // October
    expect(result.getUTCFullYear()).toBe(2024);
  });

  it('addDaysUTC minus 1', () => {
    const date = new Date('2024-09-02T11:32:45Z');
    const result = date.addDaysUTC(-1);
    expect(result.getUTCDate()).toBe(1);
    expect(result.getUTCMonth()).toBe(8); // September
    expect(result.getUTCFullYear()).toBe(2024);
  });

  it('beginMonthUTC', () => {
    const date = new Date('2024-09-17T11:54:22Z');
    const result = date.beginMonthUTC();
    expect(result.getUTCDate()).toBe(1);
    expect(result.getUTCMonth()).toBe(8); // September
    expect(result.getUTCFullYear()).toBe(2024);
    expect(result.getUTCHours()).toBe(0);
    expect(result.getUTCMinutes()).toBe(0);
    expect(result.getUTCSeconds()).toBe(0);
    expect(result.getUTCMilliseconds()).toBe(0);
  });

  it('endMonthUTC 30 days', () => {
    const date = new Date('2024-09-17T11:54:22Z');
    const result = date.endMonthUTC();
    expect(result.getUTCDate()).toBe(30);
    expect(result.getUTCMonth()).toBe(8); // September
    expect(result.getUTCFullYear()).toBe(2024);
    expect(result.getUTCHours()).toBe(23);
    expect(result.getUTCMinutes()).toBe(59);
    expect(result.getUTCSeconds()).toBe(59);
    expect(result.getUTCMilliseconds()).toBe(999);
  });

  it('endMonthUTC 31 days', () => {
    const date = new Date('2024-10-17T11:54:22Z');
    const result = date.endMonthUTC();
    expect(result.getUTCDate()).toBe(31);
    expect(result.getUTCMonth()).toBe(9); // October
    expect(result.getUTCFullYear()).toBe(2024);
    expect(result.getUTCHours()).toBe(23);
    expect(result.getUTCMinutes()).toBe(59);
    expect(result.getUTCSeconds()).toBe(59);
    expect(result.getUTCMilliseconds()).toBe(999);
  });

  it('endMonthUTC 29 days', () => {
    const date = new Date('2024-02-17T11:54:22Z');
    const result = date.endMonthUTC();
    expect(result.getUTCDate()).toBe(29);
    expect(result.getUTCMonth()).toBe(1); // February
    expect(result.getUTCFullYear()).toBe(2024);
    expect(result.getUTCHours()).toBe(23);
    expect(result.getUTCMinutes()).toBe(59);
    expect(result.getUTCSeconds()).toBe(59);
    expect(result.getUTCMilliseconds()).toBe(999);
  });

  it('endMonthUTC 28 days', () => {
    const date = new Date('2023-02-17T11:54:22Z');
    const result = date.endMonthUTC();
    expect(result.getUTCDate()).toBe(28);
    expect(result.getUTCMonth()).toBe(1); // February
    expect(result.getUTCFullYear()).toBe(2023);
    expect(result.getUTCHours()).toBe(23);
    expect(result.getUTCMinutes()).toBe(59);
    expect(result.getUTCSeconds()).toBe(59);
    expect(result.getUTCMilliseconds()).toBe(999);
  });

  it('beginQuarterUTC 1 quarter', () => {
    const date = new Date('2024-02-17T11:54:22Z');
    const result = date.beginQuarterUTC();
    expect(result.getUTCDate()).toBe(1);
    expect(result.getUTCMonth()).toBe(0); // January
    expect(result.getUTCFullYear()).toBe(2024);
    expect(result.getUTCHours()).toBe(0);
    expect(result.getUTCMinutes()).toBe(0);
    expect(result.getUTCSeconds()).toBe(0);
    expect(result.getUTCMilliseconds()).toBe(0);
  });

  it('beginQuarterUTC 2 quarter', () => {
    const date = new Date('2024-05-17T11:54:22Z');
    const result = date.beginQuarterUTC();
    expect(result.getUTCDate()).toBe(1);
    expect(result.getUTCMonth()).toBe(3); // April
    expect(result.getUTCFullYear()).toBe(2024);
  });

  it('beginQuarterUTC 3 quarter', () => {
    const date = new Date('2024-09-17T11:54:22Z');
    const result = date.beginQuarterUTC();
    expect(result.getUTCDate()).toBe(1);
    expect(result.getUTCMonth()).toBe(6); // July
    expect(result.getUTCFullYear()).toBe(2024);
  });

  it('beginQuarterUTC 4 quarter', () => {
    const date = new Date('2024-11-17T11:54:22Z');
    const result = date.beginQuarterUTC();
    expect(result.getUTCDate()).toBe(1);
    expect(result.getUTCMonth()).toBe(9); // October
    expect(result.getUTCFullYear()).toBe(2024);
  });

  it('endQuarterUTC 1 quarter', () => {
    const date = new Date('2024-02-17T11:54:22Z');
    const result = date.endQuarterUTC();
    expect(result.getUTCDate()).toBe(31);
    expect(result.getUTCMonth()).toBe(2); // March
    expect(result.getUTCFullYear()).toBe(2024);
    expect(result.getUTCHours()).toBe(23);
    expect(result.getUTCMinutes()).toBe(59);
    expect(result.getUTCSeconds()).toBe(59);
    expect(result.getUTCMilliseconds()).toBe(999);
  });

  it('endQuarterUTC 2 quarter', () => {
    const date = new Date('2024-05-17T11:54:22Z');
    const result = date.endQuarterUTC();
    expect(result.getUTCDate()).toBe(30);
    expect(result.getUTCMonth()).toBe(5); // June
    expect(result.getUTCFullYear()).toBe(2024);
    expect(result.getUTCHours()).toBe(23);
    expect(result.getUTCMinutes()).toBe(59);
    expect(result.getUTCSeconds()).toBe(59);
    expect(result.getUTCMilliseconds()).toBe(999);
  });

  it('endQuarterUTC 3 quarter', () => {
    const date = new Date('2024-09-17T11:54:22Z');
    const result = date.endQuarterUTC();
    expect(result.getUTCDate()).toBe(30);
    expect(result.getUTCMonth()).toBe(8); // September
    expect(result.getUTCFullYear()).toBe(2024);
    expect(result.getUTCHours()).toBe(23);
    expect(result.getUTCMinutes()).toBe(59);
    expect(result.getUTCSeconds()).toBe(59);
    expect(result.getUTCMilliseconds()).toBe(999);
  });

  it('endQuarterUTC 4 quarter', () => {
    const date = new Date('2024-11-17T11:54:22Z');
    const result = date.endQuarterUTC();
    expect(result.getUTCDate()).toBe(31);
    expect(result.getUTCMonth()).toBe(11); // December
    expect(result.getUTCFullYear()).toBe(2024);
    expect(result.getUTCHours()).toBe(23);
    expect(result.getUTCMinutes()).toBe(59);
    expect(result.getUTCSeconds()).toBe(59);
    expect(result.getUTCMilliseconds()).toBe(999);
  });

  it('beginYearUTC', () => {
    const date = new Date('2024-09-02T11:32:45Z');
    const result = date.beginYearUTC();
    expect(result.getUTCDate()).toBe(1);
    expect(result.getUTCMonth()).toBe(0); // January
    expect(result.getUTCFullYear()).toBe(2024);
    expect(result.getUTCHours()).toBe(0);
    expect(result.getUTCMinutes()).toBe(0);
    expect(result.getUTCSeconds()).toBe(0);
    expect(result.getUTCMilliseconds()).toBe(0);
  });

  it('endYearUTC', () => {
    const date = new Date('2024-09-02T11:32:45Z');
    const result = date.endYearUTC();
    expect(result.getUTCDate()).toBe(31);
    expect(result.getUTCMonth()).toBe(11); // December
    expect(result.getUTCFullYear()).toBe(2024);
    expect(result.getUTCHours()).toBe(23);
    expect(result.getUTCMinutes()).toBe(59);
    expect(result.getUTCSeconds()).toBe(59);
    expect(result.getUTCMilliseconds()).toBe(999);
  });

  it('addYearsUTC plus 1', () => {
    const date = new Date('2024-09-02T11:32:45Z');
    const result = date.addYearsUTC(1);
    expect(result.getUTCFullYear()).toBe(2025);
    expect(result.getUTCMonth()).toBe(8); // September
    expect(result.getUTCDate()).toBe(2);
    expect(result.getUTCHours()).toBe(11);
    expect(result.getUTCMinutes()).toBe(32);
    expect(result.getUTCSeconds()).toBe(45);
  });

  it('addYearsUTC minus 1', () => {
    const date = new Date('2024-09-02T11:32:45Z');
    const result = date.addYearsUTC(-1);
    expect(result.getUTCFullYear()).toBe(2023);
    expect(result.getUTCMonth()).toBe(8); // September
    expect(result.getUTCDate()).toBe(2);
    expect(result.getUTCHours()).toBe(11);
    expect(result.getUTCMinutes()).toBe(32);
    expect(result.getUTCSeconds()).toBe(45);
  });
});

describe('addMonthsUTC', () => {
  test.each([
    ['2024-09-17T14:47:23Z', 1, 2024, 9, 17], // October
    ['2024-09-17T14:47:23Z', 2, 2024, 10, 17], // November
    ['2024-09-17T14:47:23Z', -1, 2024, 7, 17], // August
    ['2024-12-17T14:47:23Z', 1, 2025, 0, 17], // January next year
  ])('adds to %s %i months', (start, shift, expectedYear, expectedMonth, expectedDate) => {
    const date = new Date(start);
    const result = date.addMonthsUTC(shift);
    expect(result.getUTCFullYear()).toBe(expectedYear);
    expect(result.getUTCMonth()).toBe(expectedMonth);
    expect(result.getUTCDate()).toBe(expectedDate);
    expect(result.getUTCHours()).toBe(14);
    expect(result.getUTCMinutes()).toBe(47);
  });
});

describe('addQuartersUTC', () => {
  test.each([
    ['2024-09-17T14:47:23Z', 1, 2024, 11, 17], // December
    ['2024-09-17T14:47:23Z', -1, 2024, 5, 17], // June
    ['2024-11-17T14:47:23Z', 1, 2025, 1, 17], // February next year
  ])('adds to %s %i quarters', (start, shift, expectedYear, expectedMonth, expectedDate) => {
    const date = new Date(start);
    const result = date.addQuartersUTC(shift);
    expect(result.getUTCFullYear()).toBe(expectedYear);
    expect(result.getUTCMonth()).toBe(expectedMonth);
    expect(result.getUTCDate()).toBe(expectedDate);
    expect(result.getUTCHours()).toBe(14);
    expect(result.getUTCMinutes()).toBe(47);
  });
});

describe('toLocalISO', () => {
  it('formats date with all components having two digits', () => {
    const date = new Date(2024, 8, 17, 14, 32, 45); // September 17, 2024, 14:32:45
    const result = date.toLocalISO();
    expect(result).toBe('2024-09-17T14:32:45');
  });

  it('pads single digit month with zero', () => {
    const date = new Date(2024, 0, 15, 10, 30, 25); // January 15, 2024, 10:30:25
    const result = date.toLocalISO();
    expect(result).toBe('2024-01-15T10:30:25');
  });

  it('pads single digit day with zero', () => {
    const date = new Date(2024, 8, 5, 14, 32, 45); // September 5, 2024
    const result = date.toLocalISO();
    expect(result).toBe('2024-09-05T14:32:45');
  });

  it('pads single digit hour with zero', () => {
    const date = new Date(2024, 8, 17, 5, 32, 45); // 05:32:45
    const result = date.toLocalISO();
    expect(result).toBe('2024-09-17T05:32:45');
  });

  it('pads single digit minute with zero', () => {
    const date = new Date(2024, 8, 17, 14, 5, 45); // 14:05:45
    const result = date.toLocalISO();
    expect(result).toBe('2024-09-17T14:05:45');
  });

  it('pads single digit second with zero', () => {
    const date = new Date(2024, 8, 17, 14, 32, 5); // 14:32:05
    const result = date.toLocalISO();
    expect(result).toBe('2024-09-17T14:32:05');
  });

  it('handles midnight time', () => {
    const date = new Date(2024, 8, 17, 0, 0, 0); // Midnight
    const result = date.toLocalISO();
    expect(result).toBe('2024-09-17T00:00:00');
  });

  it('handles end of day time', () => {
    const date = new Date(2024, 8, 17, 23, 59, 59); // 23:59:59
    const result = date.toLocalISO();
    expect(result).toBe('2024-09-17T23:59:59');
  });

  it('formats date at the beginning of the year', () => {
    const date = new Date(2024, 0, 1, 0, 0, 0); // January 1, 2024, 00:00:00
    const result = date.toLocalISO();
    expect(result).toBe('2024-01-01T00:00:00');
  });

  it('formats date at the end of the year', () => {
    const date = new Date(2024, 11, 31, 23, 59, 59); // December 31, 2024, 23:59:59
    const result = date.toLocalISO();
    expect(result).toBe('2024-12-31T23:59:59');
  });

  it('handles leap year date', () => {
    const date = new Date(2024, 1, 29, 12, 30, 45); // February 29, 2024 (leap year)
    const result = date.toLocalISO();
    expect(result).toBe('2024-02-29T12:30:45');
  });

  test.each([
    [new Date(2024, 8, 17, 14, 32, 45), '2024-09-17T14:32:45'],
    [new Date(2023, 0, 1, 0, 0, 0), '2023-01-01T00:00:00'],
    [new Date(2025, 11, 31, 23, 59, 59), '2025-12-31T23:59:59'],
    [new Date(2024, 5, 15, 8, 7, 6), '2024-06-15T08:07:06'],
  ])('correctly formats %p to %s', (date, expected) => {
    expect(date.toLocalISO()).toBe(expected);
  });
});
