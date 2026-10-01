import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirestoreService } from '../../../../../../../core/firestore/firestore.service';
import { FaqItem } from '../../../../../../event/models/faq-item.model';

@Component({
  selector: 'app-faq-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: "faq-modal.component.html"
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
    if (this.isSaving()) return;

    if (!this.activeItem.question?.trim()) {
      this.feedbackType.set('error');
      this.feedbackMessage.set('Veuillez renseigner l\'intitulé de la question.');
      return;
    }
    if (!this.activeItem.answer?.trim()) {
      this.feedbackType.set('error');
      this.feedbackMessage.set('Veuillez renseigner la réponse à la question.');
      return;
    }

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
      this.feedbackMessage.set('Question enregistrée avec succès !');
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
