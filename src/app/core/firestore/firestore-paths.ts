export const FIRESTORE_COLLECTIONS = {
  users: 'users',
  sessions: 'sessions',
  questionQuotas: 'questionQuotas',
  remote: 'remote',
  emojis: 'emojis',
  cms: 'cms',
} as const;

export const firestorePaths = {
  user: (uid: string) => `${FIRESTORE_COLLECTIONS.users}/${uid}`,
  session: (sessionId: string) => `${FIRESTORE_COLLECTIONS.sessions}/${sessionId}`,
  sessionQuestions: (sessionId: string) =>
    `${FIRESTORE_COLLECTIONS.sessions}/${sessionId}/questions`,
  question: (sessionId: string, questionId: string) =>
    `${FIRESTORE_COLLECTIONS.sessions}/${sessionId}/questions/${questionId}`,
  questionQuota: (uid: string) => `${FIRESTORE_COLLECTIONS.questionQuotas}/${uid}`,
};
