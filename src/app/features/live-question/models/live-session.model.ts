import { FloatingReaction, LiveQuestion } from './live-question.model';

/** Live session for an event, stored under events/{editionId}/sessions. */
export interface LiveSession<T> {
  id: string;
  title: string;
  speaker: string;
  theme: string;
  time: string;
  track: string;
  slides: string;
  questions: LiveQuestion[];
  description: string;
  isActive: boolean;
  createAt: T;
  updateAt: T;
  reactions?: FloatingReaction;
}
