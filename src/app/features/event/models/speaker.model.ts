/** Speaker for an event, stored under events/{editionId}/speakers. */
export interface Speaker {
  name: string;
  title: string;
  bio: string;
  photo: string;
  id?: string;
  topics?: string[];
  status?: 'draft' | 'published';
  socials: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
  day?: 'jour1' | 'jour2';
  color?: {
    borderColor: string;
    bgColor: string;
    bgColorFull: string;
  };
}
