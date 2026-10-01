import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionSpace } from './question-space';

describe('QuestionSpace', () => {
  let component: QuestionSpace;
  let fixture: ComponentFixture<QuestionSpace>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionSpace]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuestionSpace);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
