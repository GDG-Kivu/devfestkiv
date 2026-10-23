import { Timestamp } from '@angular/fire/firestore';
import { formattedTimestamp } from './formatted-timestamp';

describe('formattedTimestamp', () => {
  it('converts a Firestore timestamp to a JavaScript Date', () => {
    const expected = new Date('2026-09-29T12:00:00.000Z');
    const result = formattedTimestamp(Timestamp.fromDate(expected));

    expect(result).toEqual(expected);
  });

  it('converts a plain seconds object to a JavaScript Date', () => {
    const epochSec = 1795856400; // 2026-11-28
    const result = formattedTimestamp({ seconds: epochSec, nanoseconds: 0 });

    expect(result.getTime()).toBe(epochSec * 1000);
  });

  it('converts a date string YYYY-MM-DD to a JavaScript Date', () => {
    const result = formattedTimestamp('2026-11-28');

    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(10); // 0-indexed: 10 is November
    expect(result.getDate()).toBe(28);
  });

  it('preserves an existing Date instance', () => {
    const date = new Date(2026, 10, 28, 9, 0, 0);
    const result = formattedTimestamp(date);

    expect(result).toBe(date);
  });

  it('returns a Date for an omitted timestamp', () => {
    expect(formattedTimestamp()).toEqual(jasmine.any(Date));
  });

  it('returns a fallback Date for invalid date string without throwing', () => {
    expect(() => formattedTimestamp('invalid-date-string')).not.toThrow();
    expect(formattedTimestamp('invalid-date-string')).toEqual(jasmine.any(Date));
  });
});

