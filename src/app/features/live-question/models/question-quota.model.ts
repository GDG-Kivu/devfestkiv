/** Question counter for each user and each event. */
export interface QuestionQuota {
  uid: string;
  count: number;
  sessionId: string;
  lastQuestionId: string;
}
