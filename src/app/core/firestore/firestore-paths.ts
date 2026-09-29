export const FIRESTORE_COLLECTIONS = {
  users: 'users',
  events: 'events',
  siteSettings: 'siteSettings',
  sessions: 'sessions',
  questionQuotas: 'questionQuotas',
  speakers: 'speakers',
  agenda: 'agenda',
  faq: 'faq',
  partners: 'partners',
  news: 'news',
  remote: 'remote',
  emojis: 'emojis',
} as const;

export type EventSubcollection =
  | 'sessions'
  | 'speakers'
  | 'agenda'
  | 'faq'
  | 'partners'
  | 'news'
  | 'remote'
  | 'emojis'
  | 'questionQuotas';

const eventPath = (editionId: string | number) =>
  `${FIRESTORE_COLLECTIONS.events}/${String(editionId)}`;

export const firestorePaths = {
  user: (uid: string) => `${FIRESTORE_COLLECTIONS.users}/${uid}`,
  siteSettings: () => `${FIRESTORE_COLLECTIONS.siteSettings}/global`,
  event: (editionId: string | number) => eventPath(editionId),
  eventSessions: (editionId: string | number) =>
    `${eventPath(editionId)}/${FIRESTORE_COLLECTIONS.sessions}`,
  session: (editionId: string | number, sessionId: string) =>
    `${eventPath(editionId)}/${FIRESTORE_COLLECTIONS.sessions}/${sessionId}`,
  sessionQuestions: (editionId: string | number, sessionId: string) =>
    `${eventPath(editionId)}/${FIRESTORE_COLLECTIONS.sessions}/${sessionId}/questions`,
  question: (editionId: string | number, sessionId: string, questionId: string) =>
    `${eventPath(editionId)}/${FIRESTORE_COLLECTIONS.sessions}/${sessionId}/questions/${questionId}`,
  questionQuota: (editionId: string | number, uid: string) =>
    `${eventPath(editionId)}/${FIRESTORE_COLLECTIONS.questionQuotas}/${uid}`,
  eventCollection: (editionId: string | number, collection: EventSubcollection) =>
    `${eventPath(editionId)}/${collection}`,
  eventDocument: (editionId: string | number, collection: EventSubcollection, documentId: string) =>
    `${eventPath(editionId)}/${collection}/${documentId}`,
};
