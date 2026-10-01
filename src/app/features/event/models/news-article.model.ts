/** News article for an event, stored under events/{editionId}/news. */
export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  imageUrl?: string;
  publishedAt?: string;
  status: 'draft' | 'published';
}
