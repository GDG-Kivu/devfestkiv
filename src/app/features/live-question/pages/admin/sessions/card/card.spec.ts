import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Card } from './card';
import { FirestoreService } from '../../../../../../core/firestore/firestore.service';
import { Timestamp } from '@angular/fire/firestore';

describe('Card', () => {
  let component: Card;
  let fixture: ComponentFixture<Card>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Card],
      providers: [{ provide: FirestoreService, useValue: { setSession: jasmine.createSpy('setSession') } }],
    })
    .compileComponents();

    fixture = TestBed.createComponent(Card);
    component = fixture.componentInstance;
    component.session = {
      id: 'session', title: 'Session', speaker: 'Speaker', theme: 'Theme',
      time: '10:00', track: 'Dev Track', slides: '', questions: [],
      description: 'Description', isActive: false, createAt: Timestamp.now(), updateAt: Timestamp.now(),
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('displays the session as a list entry and toggles its status', () => {
    expect(fixture.nativeElement.textContent).toContain('Theme');
    const statusButton: HTMLButtonElement = fixture.nativeElement.querySelector('[aria-pressed]');
    statusButton.click();
    expect(component.session.isActive).toBeTrue();
    expect(TestBed.inject(FirestoreService).setSession).toHaveBeenCalledWith(component.session);
  });
});
