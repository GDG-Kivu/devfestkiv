import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import TshirtOrder from './tshirt-order';
import { TshirtOrderService } from '../../services/tshirt-order.service';

describe('TshirtOrder', () => {
  let fixture: ComponentFixture<TshirtOrder>;
  let component: TshirtOrder;
  let service: jasmine.SpyObj<TshirtOrderService>;

  beforeEach(async () => {
    service = jasmine.createSpyObj('TshirtOrderService', ['submit']);
    await TestBed.configureTestingModule({
      imports: [TshirtOrder],
      providers: [provideRouter([]), { provide: TshirtOrderService, useValue: service }],
    }).compileComponents();
    fixture = TestBed.createComponent(TshirtOrder);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function fillContact(): void {
    component.form.patchValue({ name: 'Amani Kivu', email: 'amani@example.com', phone: '+243 900 000 000' });
  }

  it('requires contact details, a location and at least one valid integer quantity', async () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.order__submit').disabled).toBeTrue();
    await component.submit();
    expect(service.submit).not.toHaveBeenCalled();
    expect(component.submitted()).toBeTrue();
    fillContact();
    component.form.controls.location.setValue("À l'événement");
    component.form.controls.sizes.controls.L.setValue(1);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.order__submit').disabled).toBeFalse();
    component.form.controls.sizes.controls.L.setValue(1.5);
    await component.submit();
    expect(service.submit).not.toHaveBeenCalled();
    component.form.controls.sizes.controls.L.setValue(-1);
    await component.submit();
    expect(service.submit).not.toHaveBeenCalled();
  });

  it('requires and displays Bukavu pickup details only for Bukavu', async () => {
    fillContact();
    component.form.controls.sizes.controls.L.setValue(1);
    component.form.controls.location.setValue('Bukavu');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#order-commune')).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('#order-place option').length).toBe(13);
    await component.submit();
    expect(service.submit).not.toHaveBeenCalled();
    component.form.controls.location.setValue("À l'événement");
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#order-commune')).toBeNull();
    expect(component.form.valid).toBeTrue();
  });

  it('updates size quantities using the stepper controls', () => {
    const buttons = fixture.nativeElement.querySelectorAll('.order__size');
    buttons[2].querySelectorAll('button')[1].click();
    buttons[2].querySelectorAll('button')[1].click();
    buttons[1].querySelectorAll('button')[1].click();
    fixture.detectChanges();
    expect(component.total).toBe(3);
    expect(component.totalPrice).toBe(18);
    expect(fixture.nativeElement.querySelector('.order__total strong').textContent).toContain('18 $');
    expect(component.form.controls.sizes.controls.L.value).toBe(2);
    buttons[2].querySelectorAll('button')[0].click();
    expect(component.total).toBe(2);
  });

  it('stores the structured order and shows success after delivery', async () => {
    service.submit.and.resolveTo();
    fillContact();
    component.form.patchValue({ location: 'Bukavu', commune: 'Ibanda', place: 'Place Mulamba', sizes: { L: 2, M: 1 } });
    await component.submit();
    expect(service.submit).toHaveBeenCalledOnceWith(jasmine.objectContaining({
      name: 'Amani Kivu', email: 'amani@example.com', phone: '+243 900 000 000',
      location: 'Bukavu', commune: 'Ibanda', place: 'Place Mulamba', sizes: { S: 0, M: 1, L: 2, XL: 0, XXL: 0 },
    }));
    expect(component.succeeded()).toBeTrue();
    expect(component.totalPrice).toBe(18);
  });

  it('retains the order on failure and prevents duplicate submissions', async () => {
    let reject!: (reason?: unknown) => void;
    service.submit.and.returnValue(new Promise<void>((_resolve, rejectPromise) => { reject = rejectPromise; }));
    fillContact();
    component.form.patchValue({ location: "À l'événement", sizes: { M: 1 } });
    const pending = component.submit();
    await component.submit();
    expect(service.submit).toHaveBeenCalledTimes(1);
    reject(new Error('offline'));
    await pending;
    expect(component.failed()).toBeTrue();
    expect(component.succeeded()).toBeFalse();
    expect(component.form.controls.name.value).toBe('Amani Kivu');
    expect(component.form.controls.sizes.controls.M.value).toBe(1);
  });

  it('explains Firebase permission failures instead of blaming the connection', async () => {
    service.submit.and.returnValue(Promise.reject(
      Object.assign(new Error('Permission denied'), { code: 'permission-denied' }),
    ));
    fillContact();
    component.form.patchValue({ location: "À l'événement", sizes: { M: 2 } });
    await component.submit();
    expect(component.failureMessage()).toContain('permission-denied');
    expect(component.failureMessage()).toContain('règles Firestore');
  });
});