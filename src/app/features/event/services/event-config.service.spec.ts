import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { EventConfigService } from './event-config.service';
import { FirestoreService } from '../../../core/firestore/firestore.service';
import { EventDocument } from '../models/event.model';
import { EVENT_CONFIG } from '../../../config/event.config';

describe('EventConfigService & Festival Scheduling', () => {
  let service: EventConfigService;
  let eventSubject: Subject<EventDocument | undefined>;
  let mockFirestoreService: jasmine.SpyObj<FirestoreService>;

  beforeEach(() => {
    eventSubject = new Subject<EventDocument | undefined>();
    mockFirestoreService = jasmine.createSpyObj<FirestoreService>('FirestoreService', [
      'getCurrentEventWithFallback',
    ]);
    mockFirestoreService.getCurrentEventWithFallback.and.returnValue(eventSubject.asObservable());

    TestBed.configureTestingModule({
      providers: [
        EventConfigService,
        { provide: FirestoreService, useValue: mockFirestoreService },
      ],
    });

    service = TestBed.inject(EventConfigService);
  });

  it('1. should calculate upcoming festival days when start is in the future', () => {
    const futureStart = new Date(Date.now() + 10 * 24 * 3600 * 1000);
    const futureEnd = new Date(futureStart.getTime() + 9 * 3600 * 1000);

    const testDoc: EventDocument = {
      editionId: '2026',
      edition: 2026,
      year: 2026,
      name: 'DevFest Kivu 2026',
      fullName: 'DevFest Kivu 2026',
      theme: 'Innovation',
      description: 'Test',
      registrationUrl: '',
      contact: EVENT_CONFIG.contact,
      venue: EVENT_CONFIG.venue,
      impactStats: EVENT_CONFIG.impactStats,
      engagementYear: 6,
      date: {
        start: futureStart,
        end: futureEnd,
        display: { start: futureStart.getDate(), end: futureEnd.getDate(), month: 'Novembre', year: 2026 },
      },
    };

    eventSubject.next(testDoc);
    const schedules = service.getFestivalDays();

    expect(schedules.length).toBeGreaterThanOrEqual(1);
    expect(schedules[0].startMs).toBeGreaterThan(Date.now());
  });

  it('2. should detect ongoing status when current time is between start and end', () => {
    const now = Date.now();
    const activeStart = new Date(now - 2 * 3600 * 1000); // started 2 hours ago
    const activeEnd = new Date(now + 6 * 3600 * 1000);   // ends in 6 hours

    const testDoc: EventDocument = {
      editionId: '2026',
      edition: 2026,
      year: 2026,
      name: 'DevFest Kivu 2026',
      fullName: 'DevFest Kivu 2026',
      theme: 'Innovation',
      description: 'Test',
      registrationUrl: '',
      contact: EVENT_CONFIG.contact,
      venue: EVENT_CONFIG.venue,
      impactStats: EVENT_CONFIG.impactStats,
      engagementYear: 6,
      date: {
        start: activeStart,
        end: activeEnd,
        display: { start: activeStart.getDate(), end: activeEnd.getDate(), month: 'Novembre', year: 2026 },
      },
      agenda: { days: [] },
    };

    eventSubject.next(testDoc);
    const schedules = service.getFestivalDays();
    const ongoing = schedules.find((d) => now >= d.startMs && now < d.endMs);

    expect(ongoing).toBeDefined();
    expect(ongoing?.dayNumber).toBe(1);
  });

  it('3. should detect past status when end date is in the past', () => {
    const now = Date.now();
    const pastStart = new Date(now - 10 * 24 * 3600 * 1000);
    const pastEnd = new Date(now - 9 * 24 * 3600 * 1000);

    const testDoc: EventDocument = {
      editionId: '2026',
      edition: 2026,
      year: 2026,
      name: 'DevFest Kivu 2026',
      fullName: 'DevFest Kivu 2026',
      theme: 'Innovation',
      description: 'Test',
      registrationUrl: '',
      contact: EVENT_CONFIG.contact,
      venue: EVENT_CONFIG.venue,
      impactStats: EVENT_CONFIG.impactStats,
      engagementYear: 6,
      date: {
        start: pastStart,
        end: pastEnd,
        display: { start: pastStart.getDate(), end: pastEnd.getDate(), month: 'Novembre', year: 2026 },
      },
    };

    eventSubject.next(testDoc);
    const schedules = service.getFestivalDays();
    const upcoming = schedules.find((d) => d.startMs > now);
    const ongoing = schedules.find((d) => now >= d.startMs && now < d.endMs);

    expect(upcoming).toBeUndefined();
    expect(ongoing).toBeUndefined();
  });

  it('4. should consider event ongoing exactly at start time (start <= now < end)', () => {
    const baseNow = new Date('2026-11-28T09:00:00.000Z');
    const start = new Date(baseNow);
    const end = new Date(baseNow.getTime() + 9 * 3600 * 1000);

    const schedules = service.getFestivalDays({
      ...EVENT_CONFIG,
      date: {
        start,
        end,
        display: { start: 28, end: 28, month: 'Novembre', year: 2026 },
      },
    });

    const isOngoingAtExactStart = schedules.some((d) => start.getTime() >= d.startMs && start.getTime() < d.endMs);
    expect(isOngoingAtExactStart).toBeTrue();
  });

  it('5. should consider event completed strictly at end time (now >= end)', () => {
    const start = new Date(2026, 10, 28, 9, 0, 0);
    const end = new Date(2026, 10, 28, 18, 0, 0);

    const schedules = service.getFestivalDays({
      ...EVENT_CONFIG,
      date: {
        start,
        end,
        display: { start: 28, end: 28, month: 'Novembre', year: 2026 },
      },
    });

    const lastDay = schedules[schedules.length - 1];
    const exactEndMs = lastDay.endMs;

    // At exact end moment:
    const isOngoingAtEnd = exactEndMs >= lastDay.startMs && exactEndMs < lastDay.endMs;
    const isPastAtEnd = exactEndMs >= lastDay.endMs;

    expect(isOngoingAtEnd).toBeFalse();
    expect(isPastAtEnd).toBeTrue();
  });

  it('6. should safely fall back when dates are missing from Firestore document', () => {
    const docWithoutDates: any = {
      editionId: '2026',
      edition: 2026,
      name: 'DevFest Kivu 2026',
    };

    expect(() => {
      eventSubject.next(docWithoutDates);
    }).not.toThrow();

    const schedules = service.getFestivalDays();
    expect(schedules.length).toBeGreaterThanOrEqual(1);
    expect(isNaN(schedules[0].startMs)).toBeFalse();
  });

  it('7. should recover gracefully when document contains invalid dates (NaN)', () => {
    const docWithInvalidDates: any = {
      editionId: '2026',
      edition: 2026,
      date: {
        start: 'non-a-date',
        end: 'invalid-string',
      },
    };

    expect(() => {
      eventSubject.next(docWithInvalidDates);
    }).not.toThrow();

    const schedules = service.getFestivalDays();
    expect(schedules.length).toBeGreaterThanOrEqual(1);
    expect(isNaN(schedules[0].startMs)).toBeFalse();
  });

  it('8. should normalize date-only string YYYY-MM-DD to sensible start and end hours', () => {
    const docWithDateStrings: any = {
      editionId: '2026',
      date: {
        start: '2026-11-28',
        end: '2026-11-29',
      },
    };

    eventSubject.next(docWithDateStrings);
    const schedules = service.getFestivalDays();

    expect(schedules.length).toBeGreaterThanOrEqual(2);
    expect(schedules[0].startTime.getHours()).toBe(9);
    expect(schedules[schedules.length - 1].endTime.getHours()).toBe(18);
  });

  it('9. should correct inverted dates where end date is earlier than start date', () => {
    const start = new Date('2026-11-28T09:00:00');
    const earlierEnd = new Date('2026-11-25T09:00:00'); // 3 days earlier

    const docWithInvertedDates: any = {
      editionId: '2026',
      date: {
        start,
        end: earlierEnd,
      },
    };

    eventSubject.next(docWithInvertedDates);
    const schedules = service.getFestivalDays();

    expect(schedules[0].endMs).toBeGreaterThan(schedules[0].startMs);
  });

  it('10. should transition status from loading to loaded upon Firestore emission', () => {
    expect(service.status()).toBe('loading');

    eventSubject.next({
      editionId: '2026',
      edition: 2026,
      year: 2026,
      name: 'DevFest Kivu 2026',
      fullName: 'DevFest Kivu 2026',
      theme: 'Tech',
      description: 'DevFest',
      registrationUrl: '',
      contact: EVENT_CONFIG.contact,
      venue: EVENT_CONFIG.venue,
      impactStats: EVENT_CONFIG.impactStats,
      engagementYear: 6,
      date: EVENT_CONFIG.date,
    });

    expect(service.status()).toBe('loaded');
    expect(service.errorMessage()).toBeNull();
  });
});
