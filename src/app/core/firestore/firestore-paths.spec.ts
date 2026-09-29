import { firestorePaths } from './firestore-paths';

describe('firestorePaths', () => {
  it('scopes live data and its quota to the requested edition', () => {
    expect(firestorePaths.session('2026', 'session-1')).toBe('events/2026/sessions/session-1');
    expect(firestorePaths.sessionQuestions('2026', 'session-1')).toBe(
      'events/2026/sessions/session-1/questions',
    );
    expect(firestorePaths.questionQuota('2026', 'uid-1')).toBe('events/2026/questionQuotas/uid-1');
  });

  it('uses a single partners collection and global profile/settings documents', () => {
    expect(firestorePaths.eventCollection('2026', 'partners')).toBe('events/2026/partners');
    expect(firestorePaths.user('uid-1')).toBe('users/uid-1');
    expect(firestorePaths.siteSettings()).toBe('siteSettings/global');
  });
});
