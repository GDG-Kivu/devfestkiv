import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirestoreService } from '../../../../../../core/firestore/firestore.service';
import { FaqCategory, FaqItem } from '../../../../../event/models/faq-item.model';

@Component({
  selector: 'app-faq-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div class="relative bg-white rounded-3xl w-full max-w-4xl min-w-[320px] p-6 sm:p-8 shadow-2xl border border-gray-100 animate-pop-in space-y-6 my-auto max-h-[90vh] overflow-y-auto">
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-gray-100">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-bold text-gray-900">Questions Fréquentes (FAQ)</h3>
              <p class="text-xs text-gray-500">Édition : {{ editionId }} • {{ faqList().length }} question(s)</p>
            </div>
          </div>
          <button
            type="button"
            (click)="close.emit()"
            class="text-gray-400 hover:text-gray-700 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition cursor-pointer text-base font-bold"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        @if (!showForm()) {
          <div class="flex items-center justify-between gap-4">
            <span class="text-xs text-gray-500">Rédigez les réponses aux questions courantes des participants.</span>
            <button
              type="button"
              (click)="openCreateForm()"
              class="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              <span>Ajouter une question</span>
            </button>
          </div>

          <!-- Loading State -->
          @if (isLoading()) {
            <div class="py-12 text-center text-gray-400 flex flex-col items-center gap-3">
              <svg class="w-8 h-8 animate-spin text-purple-600" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span class="text-xs font-semibold">Chargement des FAQ...</span>
            </div>
          } @else if (faqList().length === 0) {
            <div class="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 text-gray-500 space-y-3">
              <p class="text-sm font-semibold text-gray-700">Aucune question FAQ configurée</p>
              <p class="text-xs text-gray-400">Cliquez sur « Ajouter une question » pour renseigner les participants.</p>
            </div>
          } @else {
            <div class="space-y-3">
              @for (item of faqList(); track item.id || item.question) {
                <div class="bg-gray-50/70 hover:bg-gray-50 rounded-2xl p-4 border border-gray-200/80 flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition">
                  <div class="min-w-0 space-y-1">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-purple-100 text-purple-800">
                        {{ item.category }}
                      </span>
                      <h4 class="text-sm font-bold text-gray-900">{{ item.question }}</h4>
                    </div>

                    <p class="text-xs text-gray-600 leading-relaxed mt-1">{{ item.answer }}</p>
                  </div>

                  <div class="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                    <button
                      type="button"
                      (click)="openEditForm(item)"
                      class="px-3 py-1.5 text-xs font-semibold text-purple-600 hover:bg-purple-50 rounded-lg transition cursor-pointer"
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      (click)="deleteItem(item)"
                      class="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        } @else {
          <!-- FAQ Form -->
          <form (ngSubmit)="saveItem()" class="space-y-4">
            <div class="flex items-center justify-between pb-2 border-b border-gray-100">
              <h4 class="text-sm font-bold text-gray-900">
                {{ isEditing() ? 'Modifier la question FAQ' : 'Nouvelle question FAQ' }}
              </h4>
              <button
                type="button"
                (click)="showForm.set(false)"
                class="text-xs text-gray-500 hover:text-gray-800 font-semibold cursor-pointer"
              >
                ← Retour aux FAQ
              </button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="sm:col-span-2">
                <label class="block text-xs font-semibold text-gray-700 mb-1">Question *</label>
                <input
                  type="text"
                  name="question"
                  [(ngModel)]="activeItem.question"
                  required
                  placeholder="Ex: Le DevFest Kivu est-il gratuit ?"
                  class="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Catégorie</label>
                <select
                  name="category"
                  [(ngModel)]="activeItem.category"
                  class="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                >
                  <option value="Logistique">Logistique</option>
                  <option value="Inscription">Inscription</option>
                  <option value="Speakers">Speakers</option>
                  <option value="Technique">Technique</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Réponse détaillée *</label>
              <textarea
                name="answer"
                rows="4"
                [(ngModel)]="activeItem.answer"
                required
                placeholder="Rédigez la réponse ici..."
                class="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 resize-none"
              ></textarea>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Ordre d'affichage</label>
                <input
                  type="number"
                  name="order"
                  [(ngModel)]="activeItem.order"
                  class="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                />
              </div>

              <div class="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="faqIsPublished"
                  name="isPublished"
                  [(ngModel)]="activeItem.isPublished"
                  class="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                />
                <label for="faqIsPublished" class="text-xs font-semibold text-gray-700 cursor-pointer">
                  Publié sur le site
                </label>
              </div>
            </div>

            @if (feedbackMessage()) {
              <div
                class="text-xs p-3 rounded-xl border flex items-center gap-2"
                [class.bg-green-50]="feedbackType() === 'success'"
                [class.text-green-800]="feedbackType() === 'success'"
                [class.border-green-200]="feedbackType() === 'success'"
                [class.bg-red-50]="feedbackType() === 'error'"
                [class.text-red-800]="feedbackType() === 'error'"
                [class.border-red-200]="feedbackType() === 'error'"
              >
                <span>{{ feedbackMessage() }}</span>
              </div>
            }

            <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                (click)="showForm.set(false)"
                class="px-4 py-2.5 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition cursor-pointer"
              >
                Annuler
              </button>

              <button
                type="submit"
                [disabled]="isSaving() || !activeItem.question || !activeItem.answer"
                class="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition cursor-pointer"
              >
                @if (isSaving()) {
                  <svg class="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Enregistrement...</span>
                } @else {
                  <span>{{ isEditing() ? 'Mettre à jour' : 'Ajouter la question' }}</span>
                }
              </button>
            </div>
          </form>
        }

        <div class="flex items-center justify-end pt-4 border-t border-gray-100">
          <button
            type="button"
            (click)="close.emit()"
            class="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs sm:text-sm font-semibold rounded-xl transition cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  `,
})
export class FaqModalComponent implements OnInit {
  @Input({ required: true }) editionId!: string;
  @Output() close = new EventEmitter<void>();
  @Output() updated = new EventEmitter<void>();

  private fs = inject(FirestoreService);

  faqList = signal<FaqItem[]>([]);
  isLoading = signal(true);
  showForm = signal(false);
  isEditing = signal(false);
  isSaving = signal(false);
  feedbackMessage = signal<string | null>(null);
  feedbackType = signal<'success' | 'error'>('success');

  activeItem: FaqItem = {
    id: '',
    question: '',
    answer: '',
    category: 'Logistique',
    isPublished: true,
    order: 1,
  };

  ngOnInit(): void {
    this.loadFaq();
  }

  private readonly DEFAULT_FAQ: FaqItem[] = [
    {
      id: 'faq-default-1',
      question: 'Comment s\'inscrire au DevFest Kivu ?',
      answer: 'L\'inscription se fait via le formulaire disponible sur la page d\'accueil du site officiel. Les places sont limitées, inscrivez-vous tôt !',
      category: 'Inscription',
      isPublished: true,
      order: 1,
    },
    {
      id: 'faq-default-2',
      question: 'L\'événement est-il gratuit ?',
      answer: 'Oui, le DevFest Kivu est entièrement gratuit et ouvert à toutes les personnes passionnées de technologie, développeurs, étudiants et professionnels.',
      category: 'Inscription',
      isPublished: true,
      order: 2,
    },
    {
      id: 'faq-default-3',
      question: 'Où se déroule le DevFest Kivu ?',
      answer: 'Le DevFest Kivu a lieu à Bukavu, en République Démocratique du Congo. Le lieu précis est communiqué lors de la confirmation de votre inscription.',
      category: 'Logistique',
      isPublished: true,
      order: 3,
    },
    {
      id: 'faq-default-4',
      question: 'Y a-t-il un hébergement disponible pour les participants venant de loin ?',
      answer: 'L\'organisation ne prend pas en charge l\'hébergement, mais nous communiquerons une liste d\'hôtels partenaires proches du lieu de l\'événement.',
      category: 'Logistique',
      isPublished: true,
      order: 4,
    },
    {
      id: 'faq-default-5',
      question: 'Comment devenir speaker au DevFest Kivu ?',
      answer: 'Vous pouvez soumettre votre proposition de conférence via notre formulaire de call for proposals (CFP). Nous accueillons des talks de 30 à 45 minutes sur des sujets tech, IA, cloud, mobile et plus.',
      category: 'Speakers',
      isPublished: true,
      order: 5,
    },
    {
      id: 'faq-default-6',
      question: 'Quel matériel dois-je apporter ?',
      answer: 'Nous vous recommandons d\'apporter votre ordinateur portable et votre badge de participant. Des prises électriques et une connexion Wi-Fi seront disponibles sur place.',
      category: 'Technique',
      isPublished: true,
      order: 6,
    },
    {
      id: 'faq-default-7',
      question: 'Les sessions seront-elles enregistrées ?',
      answer: 'Oui, certaines sessions principales seront filmées et publiées sur la chaîne YouTube de GDG Kivu après l\'événement.',
      category: 'Technique',
      isPublished: true,
      order: 7,
    },
    {
      id: 'faq-default-8',
      question: 'Comment contacter l\'organisation ?',
      answer: 'Vous pouvez nous contacter via l\'adresse email gdgkivu@gmail.com ou sur nos réseaux sociaux (Twitter/X, LinkedIn, Facebook) sous le nom GDG Kivu.',
      category: 'Autre',
      isPublished: true,
      order: 8,
    },
  ];

  private loadFaq(): void {
    this.isLoading.set(true);
    this.fs.getEventCollection<FaqItem>(this.editionId, 'faq').subscribe({
      next: (list) => {
        // Utilise les FAQ par défaut si Firestore renvoie une liste vide
        this.faqList.set(list?.length ? list : this.DEFAULT_FAQ);
        this.isLoading.set(false);
      },
      error: () => {
        this.faqList.set(this.DEFAULT_FAQ);
        this.isLoading.set(false);
      },
    });
  }

  openCreateForm(): void {
    this.activeItem = {
      id: '',
      question: '',
      answer: '',
      category: 'Logistique',
      isPublished: true,
      order: this.faqList().length + 1,
    };
    this.isEditing.set(false);
    this.feedbackMessage.set(null);
    this.showForm.set(true);
  }

  openEditForm(item: FaqItem): void {
    this.activeItem = { ...item };
    this.isEditing.set(true);
    this.feedbackMessage.set(null);
    this.showForm.set(true);
  }

  async saveItem(): Promise<void> {
    if (!this.activeItem.question || !this.activeItem.answer || this.isSaving()) return;
    this.isSaving.set(true);
    this.feedbackMessage.set(null);

    try {
      if (this.isEditing() && this.activeItem.id) {
        await this.fs.saveEventDocument(this.editionId, 'faq', this.activeItem);
      } else {
        const id = await this.fs.createEventDocument(this.editionId, 'faq', this.activeItem);
        this.activeItem.id = id;
      }

      this.feedbackType.set('success');
      this.feedbackMessage.set('Question enregistrée avec succès dans Firestore !');
      this.updated.emit();

      setTimeout(() => {
        this.showForm.set(false);
      }, 1000);
    } catch (err: any) {
      this.feedbackType.set('error');
      this.feedbackMessage.set(err?.message || 'Erreur lors de l\'enregistrement.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteItem(item: FaqItem): Promise<void> {
    if (!item.id) return;
    if (!confirm(`Supprimer la question "${item.question}" ?`)) return;

    try {
      await this.fs.deleteEventDocument(this.editionId, 'faq', item.id);
      this.updated.emit();
    } catch (err: any) {
      alert(err?.message || 'Erreur lors de la suppression.');
    }
  }
}
