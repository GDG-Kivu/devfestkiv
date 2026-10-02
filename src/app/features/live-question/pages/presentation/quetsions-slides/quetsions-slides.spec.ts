import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionsSlides } from './quetsions-slides';

describe('QuestionsSlides', () => {
  let component: QuestionsSlides;
  let fixture: ComponentFixture<QuestionsSlides>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionsSlides]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuestionsSlides);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
