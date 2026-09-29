import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiveQuestion } from './live-question';

describe('LiveQuestion', () => {
  let component: LiveQuestion;
  let fixture: ComponentFixture<LiveQuestion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LiveQuestion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LiveQuestion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
