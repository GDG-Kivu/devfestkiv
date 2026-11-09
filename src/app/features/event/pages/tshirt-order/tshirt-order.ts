import { Component, inject, OnInit, signal } from '@angular/core';
import { AbstractControl, FormControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Meta } from '@angular/platform-browser';
import { TshirtOrderService } from '../../services/tshirt-order.service';

const quantityValidator = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 99 ? null : { quantity: true };
};

const sizesValidator = (control: AbstractControl): ValidationErrors | null =>
  Object.values(control.value as Record<string, number>).some((quantity) => quantity > 0)
    ? null : { empty: true };

@Component({
  selector: 'app-tshirt-order',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './tshirt-order.html',
  styleUrl: './tshirt-order.css',
})
export default class TshirtOrder implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly orderService = inject(TshirtOrderService);
  private readonly meta = inject(Meta);

  readonly sizes = ['S', 'M', 'L', 'XL', 'XXL'] as const;
  readonly places = ['Place Mulamba', 'Place du 24', 'Place de la Paix', 'Poste', 'Feu vert', 'Feu rouge', 'Cap Nguba', 'Rond-point ISP', 'Lycée Wima', 'Campus Mulindwa (UCB)', 'Campus Bugabo (UCB)', 'Campus Karhale (UCB)'];
  readonly submitting = signal(false);
  readonly succeeded = signal(false);
  readonly failed = signal(false);
  readonly failureMessage = signal('');
  readonly submitted = signal(false);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120), Validators.pattern(/.*\S.*/)]],
    email: ['', [Validators.required, Validators.maxLength(254), Validators.email]],
    phone: ['', [Validators.required, Validators.maxLength(40), Validators.pattern(/.*\S.*/)]],
    location: ['', Validators.required],
    commune: [''],
    place: [''],
    sizes: this.fb.group({
      S: new FormControl<number | null>(0, quantityValidator),
      M: new FormControl<number | null>(0, quantityValidator),
      L: new FormControl<number | null>(0, quantityValidator),
      XL: new FormControl<number | null>(0, quantityValidator),
      XXL: new FormControl<number | null>(0, quantityValidator),
    }, { validators: sizesValidator }),
  });

  constructor() {
    this.form.controls.location.valueChanges.subscribe((location) => {
      for (const control of [this.form.controls.commune, this.form.controls.place]) {
        control.setValidators(location === 'Bukavu' ? Validators.required : null);
        control.updateValueAndValidity();
      }
    });
  }

  ngOnInit(): void {
    const imageUrl = 'https://www.devfestkivu.site/assets/t-shirt.png';
    const altText = 'T-shirt officiel DevFest Kivu';
    this.meta.updateTag({ property: 'og:image', content: imageUrl });
    this.meta.updateTag({ property: 'og:image:alt', content: altText });
    this.meta.updateTag({ name: 'twitter:image', content: imageUrl });
    this.meta.updateTag({ name: 'twitter:image:alt', content: altText });
  }

  get total(): number {
    return this.sizes.reduce((total, size) => total + (this.form.controls.sizes.controls[size].value || 0), 0);
  }

  get totalPrice(): number {
    return this.total * 6;
  }

  invalid(control: AbstractControl): boolean {
    return control.invalid && (control.touched || this.submitted());
  }

  changeQuantity(size: typeof this.sizes[number], change: number): void {
    const control = this.form.controls.sizes.controls[size];
    control.setValue(Math.max(0, Math.min(99, (control.value ?? 0) + change)));
    control.markAsTouched();
  }

  async submit(): Promise<void> {
    if (this.submitting()) return;
    this.submitted.set(true);
    this.failed.set(false);
    this.failureMessage.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const order = this.form.getRawValue();
    this.submitting.set(true);
    try {
      await this.orderService.submit({
        name: order.name.trim(), email: order.email.trim(), phone: order.phone.trim(),
        location: order.location,
        commune: order.location === 'Bukavu' ? order.commune : '',
        place: order.location === 'Bukavu' ? order.place : '',
        sizes: { S: order.sizes.S!, M: order.sizes.M!, L: order.sizes.L!, XL: order.sizes.XL!, XXL: order.sizes.XXL! },
      });
      this.succeeded.set(true);
    } catch (error) {
      this.failed.set(true);
      this.failureMessage.set(this.describeSubmissionError(error));
    } finally {
      this.submitting.set(false);
    }
  }

  newOrder(): void {
    this.form.reset({ name: '', email: '', phone: '', location: '', commune: '', place: '', sizes: { S: 0, M: 0, L: 0, XL: 0, XXL: 0 } });
    this.submitted.set(false);
    this.succeeded.set(false);
    this.failed.set(false);
    this.failureMessage.set('');
  }

  private describeSubmissionError(error: unknown): string {
    const code = error && typeof error === 'object' && 'code' in error
      ? String(error.code)
      : '';

    if (code === 'permission-denied') {
      return 'Firebase a refusé la commande (permission-denied). Les règles Firestore du projet doivent autoriser la création dans « tshirtOrders ».';
    }
    if (code === 'auth/operation-not-allowed' || code === 'auth/anonymous-sign-in-failed') {
      return 'La connexion anonyme Firebase est désactivée ou indisponible. Activez le fournisseur Anonymous dans Firebase Authentication.';
    }
    if (code === 'unavailable' || code === 'deadline-exceeded' || code === 'auth/network-request-failed') {
      return 'Firebase est momentanément inaccessible. Vérifiez votre connexion puis réessayez.';
    }
    return code
      ? `Firebase n’a pas pu enregistrer la commande (${code}). Vérifiez la configuration Firebase puis réessayez.`
      : 'Firebase n’a pas pu enregistrer la commande. Vérifiez la configuration et votre connexion puis réessayez.';
  }
}
