import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuetsionsSlides } from './quetsions-slides';

describe('QuetsionsSlides', () => {
  let component: QuetsionsSlides;
  let fixture: ComponentFixture<QuetsionsSlides>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuetsionsSlides]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuetsionsSlides);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
