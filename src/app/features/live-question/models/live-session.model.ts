import { FloatingReaction, LiveQuestion } from './live-question.model';

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
