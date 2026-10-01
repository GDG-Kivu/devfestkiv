import { Timestamp } from '@angular/fire/firestore';
import { formattedTimestamp } from './formatted-timestamp';

describe('formattedTimestamp', () => {
  it('converts a Firestore timestamp to a JavaScript Date', () => {
    const expected = new Date('2026-09-29T12:00:00.000Z');
    const result = formattedTimestamp(Timestamp.fromDate(expected));

    expect(result).toEqual(expected);
  });

  it('returns a Date for an omitted timestamp', () => {
    expect(formattedTimestamp()).toEqual(jasmine.any(Date));
  });
});
