import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ContactService, ContactFormData } from '../../services/contact.service';
import { EventConfigService } from '../../services/event-config.service';

@Component({
  selector: 'app-contact',
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50/50 py-16 px-4 sm:px-6 lg:px-8">
      <div class="max-w-5xl mx-auto space-y-12">
        <!-- Header -->
        <div class="text-center space-y-3 max-w-2xl mx-auto animate-fade-in">
          <h1 class="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
            Contactez-nous
          </h1>
          <p class="text-lg text-gray-600 leading-relaxed">
            Une question sur l'événement, les inscriptions ou le sponsoring ? Notre équipe est à
            votre écoute.
          </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <!-- Colonne Gauche : Coordonnées -->
          <div class="lg:col-span-5 space-y-6">
            <div class="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-gray-200 space-y-6">
              <h2 class="text-xl font-bold text-gray-900">Coordonnées</h2>

              <div class="space-y-5">
                <!-- Email -->
                <div>
                  <h3 class="text-xs font-semibold text-gray-500 tracking-wider">Email</h3>
                  <a
                    href="mailto:{{ eventConfig.contact.email }}"
                    class="text-sm font-semibold text-primary hover:underline"
                  >
                    {{ eventConfig.contact.email }}
                  </a>
                </div>

                <!-- Téléphone -->
                <div>
                  <h3 class="text-xs font-semibold text-gray-500 tracking-wider">Téléphone</h3>
                  <a
                    href="tel:{{ eventConfig.contact.phone }}"
                    class="text-sm font-semibold text-gray-800 hover:text-primary"
                  >
                    {{ eventConfig.contact.phone }}
                  </a>
                </div>

                <!-- Lieu -->
                <div>
                  <h3 class="text-xs font-semibold text-gray-500 tracking-wider">
                    Lieu de l'événement
                  </h3>
                  <p class="text-sm font-semibold text-gray-800">
                    {{ eventConfig.venue.conferenceCenter }}
                  </p>
                  <p class="text-xs text-gray-500">{{ eventConfig.venue.fullLocation }}</p>
                </div>
              </div>

              <div class="pt-4 border-t border-gray-100">
                <a
                  routerLink="/qa"
                  class="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <span>Consulter la foire aux questions (FAQ)</span>
                  <span>→</span>
                </a>
              </div>
            </div>
          </div>

          <!-- Colonne Droite : Formulaire -->
          <div
            class="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-gray-200"
          >
            <h2 class="text-xl font-bold text-gray-900 mb-1">Envoyez-nous un message</h2>
            <p class="text-xs text-gray-500 mb-6">
              Nous vous répondrons dans les meilleurs délais.
            </p>

            <!-- Message de succès -->
            @if (successMessage()) {
              <div
                class="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm"
              >
                Votre message a été envoyé avec succès. Nous vous répondrons très vite.
              </div>
            }

            <!-- Message d'erreur -->
            @if (errorMessage()) {
              <div class="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">
                {{ errorMessage() }}
              </div>
            }

            <form (ngSubmit)="onSubmit()" class="space-y-4">
              <!-- Honeypot anti-spam -->
              <input
                type="text"
                [(ngModel)]="honeypot"
                name="company_check"
                class="hidden"
                tabindex="-1"
                autocomplete="off"
              />

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <!-- Nom -->
                <div class="space-y-1">
                  <label for="name" class="block text-xs font-semibold text-gray-700">
                    Nom complet <span class="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    [(ngModel)]="formData.name"
                    name="name"
                    placeholder="Votre nom"
                    class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <!-- Email -->
                <div class="space-y-1">
                  <label for="email" class="block text-xs font-semibold text-gray-700">
                    Adresse email <span class="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    [(ngModel)]="formData.email"
                    name="email"
                    placeholder="nom@exemple.com"
                    class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <!-- Sujet -->
              <div class="space-y-1">
                <label for="subject" class="block text-xs font-semibold text-gray-700">
                  Sujet <span class="text-red-500">*</span>
                </label>
                <select
                  id="subject"
                  required
                  [(ngModel)]="formData.subject"
                  name="subject"
                  class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                >
                  <option value="Question générale">Question générale</option>
                  <option value="Sponsoring & Partenariat">Sponsoring & Partenariat</option>
                  <option value="Intervenant & Talk">Intervenant & Talk</option>
                  <option value="Presse & Média">Presse & Média</option>
                  <option value="Autre demande">Autre demande</option>
                </select>
              </div>

              <!-- Message -->
              <div class="space-y-1">
                <label for="message" class="block text-xs font-semibold text-gray-700">
                  Message <span class="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  required
                  rows="4"
                  maxlength="2000"
                  [(ngModel)]="formData.message"
                  name="message"
                  placeholder="Votre message..."
                  class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                ></textarea>
              </div>

              <!-- Bouton -->
              <button
                type="submit"
                [disabled]="isSubmitting() || !isFormValid()"
                class="btn btn-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                @if (isSubmitting()) {
                  <span>Envoi en cours...</span>
                } @else {
                  <span>Envoyer</span>
                }
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .animate-fade-in {
      animation: fadeIn 0.4s ease-out forwards;
    }
  `,
})
export default class ContactComponent {
  private contactService = inject(ContactService);
  eventConfig = inject(EventConfigService);

  formData: ContactFormData = {
    name: '',
    email: '',
    subject: 'Question générale',
    message: '',
  };

  honeypot = '';
  isSubmitting = signal(false);
  successMessage = signal(false);
  errorMessage = signal<string | null>(null);

  isFormValid(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return (
      this.formData.name.trim().length >= 2 &&
      emailRegex.test(this.formData.email.trim()) &&
      this.formData.message.trim().length >= 5
    );
  }

  async onSubmit(): Promise<void> {
    if (this.honeypot) return;

    if (!this.isFormValid()) {
      this.errorMessage.set('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(false);

    try {
      await this.contactService.sendContactMessage(this.formData);
      this.successMessage.set(true);
      this.formData = {
        name: '',
        email: '',
        subject: 'Question générale',
        message: '',
      };
    } catch (err: any) {
      console.error('Erreur EmailJS:', err);
      this.errorMessage.set(
        err?.text || "Une erreur est survenue lors de l'envoi. Veuillez réessayer ultérieurement.",
      );
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
