export type AgendaFormat = 'keynote' | 'talk' | 'workshop' | 'codelab' | 'discussion' | 'break';

/** Agenda slot for an event, stored under events/{editionId}/agenda. */
export interface AgendaItem {
  id: string;
  editionId: string;
  dayId: string;
  title: string;
  description: string;
  speakerIds: string[];
  startsAt: string;
  endsAt: string;
  room: string;
  track: string;
  format: AgendaFormat;
  isPublished: boolean;
}
