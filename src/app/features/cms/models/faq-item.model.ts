export type FaqCategory = 'Logistique' | 'Inscription' | 'Speakers' | 'Technique' | 'Autre';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: FaqCategory;
  isPublished: boolean;
  order: number;
}
