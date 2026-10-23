import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import HomeComponent from './home';
import { EventConfigService } from '../../services/event-config.service';
import { FirestoreService } from '../../../../core/firestore/firestore.service';
import { EVENT_CONFIG } from '../../../../config/event.config';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let mockEventConfigService: any;

  beforeEach(async () => {
    mockEventConfigService = {
      status: signal<'loading' | 'loaded' | 'error'>('loaded'),
      eventDocument: signal<any>(null),
      getConfig: jasmine.createSpy('getConfig').and.returnValue(EVENT_CONFIG),
      getFestivalDays: jasmine.createSpy('getFestivalDays').and.returnValue([
        {
          id: 'day1',
          dayNumber: 1,
          name: 'Jour 1',
          date: '28 Nov',
          fullDate: 'Samedi 28 Novembre 2026',
          location: 'Bukavu',
          isActive: true,
          startTime: new Date(Date.now() + 10000000),
          endTime: new Date(Date.now() + 20000000),
          startMs: Date.now() + 10000000,
          endMs: Date.now() + 20000000,
          startsAt: '09:00',
          endsAt: '18:00',
        },
      ]),
      getTargetDateTimeString: () => '2026-11-28T09:00:00',
      getFormattedDateBadge: () => '28 - 29 Novembre 2026 • Bukavu',
      year: 2026,
      fullName: 'DevFest Kivu 2026',
      engagementYear: 6,
      impactStats: EVENT_CONFIG.impactStats,
      supports: EVENT_CONFIG.supports,
      registrationUrl: EVENT_CONFIG.registrationUrl,
      pastEvents: [],
      getEventDay: () => ({
        start: signal(28),
        end: signal(29),
        month: signal('Novembre'),
        year: signal(2026),
      }),
    };

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        { provide: EventConfigService, useValue: mockEventConfigService },
        { provide: FirestoreService, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create HomeComponent successfully', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with upcoming event countdown when future days exist', () => {
    expect(component.isEventPast()).toBeFalse();
    expect(component.isEventOngoing()).toBeFalse();
    expect(component.countdownRunning()).toBeTrue();
    expect(component.eventStatus()).toBe('upcoming');
  });

  it('should set ongoing state when current time is within event day', () => {
    const now = Date.now();
    mockEventConfigService.getFestivalDays.and.returnValue([
      {
        id: 'day1',
        dayNumber: 1,
        name: 'Jour 1',
        date: '28 Nov',
        fullDate: 'Samedi 28 Novembre 2026',
        location: 'Bukavu',
        isActive: true,
        startTime: new Date(now - 100000),
        endTime: new Date(now + 100000),
        startMs: now - 100000,
        endMs: now + 100000,
        startsAt: '09:00',
        endsAt: '18:00',
      },
    ]);

    component.evaluateEventStatus();

    expect(component.isEventOngoing()).toBeTrue();
    expect(component.isEventPast()).toBeFalse();
    expect(component.countdownRunning()).toBeFalse();
    expect(component.eventStatus()).toBe('ongoing');
  });

  it('should set past state when all event days are finished', () => {
    const now = Date.now();
    mockEventConfigService.getFestivalDays.and.returnValue([
      {
        id: 'day1',
        dayNumber: 1,
        name: 'Jour 1',
        date: '28 Nov',
        fullDate: 'Samedi 28 Novembre 2026',
        location: 'Bukavu',
        isActive: true,
        startTime: new Date(now - 200000),
        endTime: new Date(now - 100000),
        startMs: now - 200000,
        endMs: now - 100000,
        startsAt: '09:00',
        endsAt: '18:00',
      },
    ]);

    component.evaluateEventStatus();

    expect(component.isEventPast()).toBeTrue();
    expect(component.isEventOngoing()).toBeFalse();
    expect(component.countdownRunning()).toBeFalse();
    expect(component.eventStatus()).toBe('past');
  });

  it('should not display past event state while service is in loading state', () => {
    mockEventConfigService.status.set('loading');

    component.evaluateEventStatus();

    expect(component.eventStatus()).toBe('loading');
    expect(component.isEventPast()).toBeFalse();
    expect(component.isEventOngoing()).toBeFalse();
  });

  it('should format digits with leading zeros', () => {
    expect(component.formatTime(5)).toBe('05');
    expect(component.formatTime(12)).toBe('12');
    expect(component.formatTime(0)).toBe('00');
  });

  it('should clean up timers upon destruction', () => {
    expect(() => {
      component.ngOnDestroy();
    }).not.toThrow();
  });
});
