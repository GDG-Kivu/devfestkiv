export type FaqCategory = 'Logistique' | 'Inscription' | 'Speakers' | 'Technique' | 'Autre';

/** FAQ entry for an event, stored under events/{editionId}/faq. */
export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: FaqCategory;
  isPublished: boolean;
  order: number;
}
