/** Partner or sponsor of an event, stored under events/{editionId}/partners. */
export interface EventPartner {
  id: string;
  name: string;
  role: string;
  quote?: string;
  logo: string;
  link?: string;
  order?: number;
  isPublished: boolean;
}
