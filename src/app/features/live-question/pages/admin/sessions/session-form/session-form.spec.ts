import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionForm } from './session-form';

describe('SessionForm', () => {
  let component: SessionForm<unknown>;
  let fixture: ComponentFixture<SessionForm<unknown>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SessionForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
