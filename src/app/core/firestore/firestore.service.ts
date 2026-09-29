import { EnvironmentInjector, inject, Injectable, runInInjectionContext } from '@angular/core';
import {
  collection,
  collectionData,
  deleteDoc,
  doc,
  docData,
  FieldValue,
  Firestore,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from '@angular/fire/firestore';
import { AuthService } from '../auth/auth.service';
import {
  FloatingReaction,
  LiveQuestion,
} from '../../features/live-question/models/live-question.model';
import { LiveSession } from '../../features/live-question/models/live-session.model';
import { EventDocument, EventPartner, SiteSettings } from '../../features/event/models/event.model';
import { EVENT_CONFIG } from '../../config/event.config';
import { EventSubcollection, FIRESTORE_COLLECTIONS, firestorePaths } from './firestore-paths';
import { firstValueFrom, map, Observable, of, switchMap } from 'rxjs';

export const DEFAULT_QUESTIONS_PER_USER = 5;
export const MAX_CONFIGURABLE_QUESTIONS_PER_USER = 100;

@Injectable({
  providedIn: 'root',
})
export class FirestoreService {
  private readonly fs = inject(Firestore);
  private readonly auth = inject(AuthService);
  private readonly _injector: EnvironmentInjector = inject(EnvironmentInjector);
  createDocId = (colName: string) => doc(collection(this.fs, colName)).id;

  getSiteSettings(): Observable<SiteSettings | undefined> {
    return runInInjectionContext(
      this._injector,
      () =>
        docData(doc(this.fs, firestorePaths.siteSettings())) as Observable<
          SiteSettings | undefined
        >,
    );
  }

  getCurrentEditionId(): Observable<string> {
    return this.getSiteSettings().pipe(
      map((settings) => settings?.currentEditionId || String(EVENT_CONFIG.edition)),
    );
  }

  getEvent(editionId: string | number): Observable<EventDocument | undefined> {
    return runInInjectionContext(
      this._injector,
      () =>
        docData(doc(this.fs, firestorePaths.event(editionId))) as Observable<
          EventDocument | undefined
        >,
    );
  }

  saveEvent(editionId: string | number, event: Partial<EventDocument>) {
    return runInInjectionContext(this._injector, () =>
      setDoc(
        doc(this.fs, firestorePaths.event(editionId)),
        { ...event, editionId: String(editionId) },
        { merge: true },
      ),
    );
  }

  saveSiteSettings(settings: Partial<SiteSettings>) {
    return runInInjectionContext(this._injector, () =>
      setDoc(doc(this.fs, firestorePaths.siteSettings()), settings, { merge: true }),
    );
  }

  getEventCollection<T>(editionId: string | number, collectionName: EventSubcollection) {
    return runInInjectionContext(
      this._injector,
      () =>
        collectionData(
          collection(this.fs, firestorePaths.eventCollection(editionId, collectionName)),
          { idField: 'id' },
        ) as Observable<T[]>,
    );
  }

  saveEventDocument<T extends { id: string }>(
    editionId: string | number,
    collectionName: EventSubcollection,
    value: T,
  ) {
    return runInInjectionContext(this._injector, () =>
      setDoc(
        doc(this.fs, firestorePaths.eventDocument(editionId, collectionName, value.id)),
        value,
        { merge: true },
      ),
    );
  }

  getSessions(editionId?: string | number): Observable<LiveSession<Timestamp>[]> {
    return this.editionIdStream(editionId).pipe(
      switchMap((id) =>
        runInInjectionContext(
          this._injector,
          () =>
            collectionData(collection(this.fs, firestorePaths.eventSessions(id))) as Observable<
              LiveSession<Timestamp>[]
            >,
        ),
      ),
    );
  }

  getActiveSessions(editionId?: string | number): Observable<LiveSession<Timestamp>[]> {
    return this.editionIdStream(editionId).pipe(
      switchMap((id) =>
        runInInjectionContext(this._injector, () => {
          const sessions = collection(this.fs, firestorePaths.eventSessions(id));
          const activeSessions = query(sessions, where('isActive', '==', true));
          return collectionData(activeSessions) as Observable<LiveSession<Timestamp>[]>;
        }),
      ),
    );
  }

  async setSession(session: LiveSession<FieldValue>, editionId?: string | number) {
    const id = await this.resolveEditionId(editionId);
    return runInInjectionContext(this._injector, () =>
      setDoc(doc(this.fs, firestorePaths.session(id, session.id)), session, { merge: true }),
    );
  }

  getQuestions(sessionId: string, editionId?: string | number): Observable<LiveQuestion[]> {
    return this.editionIdStream(editionId).pipe(
      switchMap((id) =>
        runInInjectionContext(
          this._injector,
          () =>
            collectionData(collection(this.fs, firestorePaths.sessionQuestions(id, sessionId)), {
              idField: 'id',
            }) as Observable<LiveQuestion[]>,
        ),
      ),
    );
  }

  async addQuestion(
    sessionId: string,
    question: Omit<LiveQuestion, 'uid' | 'createdAt' | 'status'>,
    editionId?: string | number,
  ) {
    const user = await this.auth.ensureAuthenticated();
    if (!user) throw new Error('An authenticated user is required to add a question.');

    const id = await this.resolveEditionId(editionId);
    const questionContent = question.contenu.trim();
    if (!questionContent || questionContent.length > 1000) {
      throw new Error('Question content must be between 1 and 1000 characters.');
    }

    return runInInjectionContext(this._injector, () => {
      const questionRef = doc(collection(this.fs, firestorePaths.sessionQuestions(id, sessionId)));
      const eventRef = doc(this.fs, firestorePaths.event(id));
      const quotaRef = doc(this.fs, firestorePaths.questionQuota(id, user.uid));

      return runTransaction(this.fs, async (transaction) => {
        const [eventSnapshot, quotaSnapshot] = await Promise.all([
          transaction.get(eventRef),
          transaction.get(quotaRef),
        ]);
        const configuredLimit = eventSnapshot.data()?.['maxQuestionsPerUser'];
        const questionLimit =
          typeof configuredLimit === 'number' && Number.isInteger(configuredLimit)
            ? configuredLimit
            : DEFAULT_QUESTIONS_PER_USER;
        const currentCount = quotaSnapshot.exists() ? (quotaSnapshot.data()['count'] as number) : 0;

        if (
          !Number.isInteger(questionLimit) ||
          questionLimit < 0 ||
          questionLimit > MAX_CONFIGURABLE_QUESTIONS_PER_USER
        ) {
          throw new Error('The event question limit is invalid.');
        }
        if (!Number.isInteger(currentCount) || currentCount >= questionLimit) {
          throw new Error('Question limit reached.');
        }

        transaction.set(questionRef, {
          contenu: questionContent,
          displayName: user.displayName,
          email: user.email,
          time: question.time,
          uid: user.uid,
          createdAt: serverTimestamp(),
          status: 'pending',
          reactions: question.reactions ?? [],
        });
        transaction.set(quotaRef, {
          uid: user.uid,
          count: currentCount + 1,
          sessionId,
          lastQuestionId: questionRef.id,
        });

        return questionRef;
      });
    });
  }

  async setEmojis(emojis: FloatingReaction, editionId?: string | number) {
    const user = await this.auth.ensureAuthenticated();
    if (!user) throw new Error('An authenticated user is required to publish a reaction.');
    const id = await this.resolveEditionId(editionId);
    return runInInjectionContext(this._injector, () => {
      const docRef = doc(this.fs, firestorePaths.eventDocument(id, 'emojis', emojis.id));
      return setDoc(docRef, { ...emojis, uid: user.uid }, { merge: true });
    });
  }

  async setRemote(action: string, remoteId = '129383746', editionId?: string | number) {
    const id = await this.resolveEditionId(editionId);
    return runInInjectionContext(this._injector, () => {
      const docRef = doc(this.fs, firestorePaths.eventDocument(id, 'remote', remoteId));
      return setDoc(docRef, { command: action }, { merge: true });
    });
  }

  getStateRemote(editionId?: string | number) {
    return this.editionIdStream(editionId).pipe(
      switchMap((id) => this.getEventCollection<{ id: string; command: string }>(id, 'remote')),
    );
  }

  getEmojis(editionId?: string | number) {
    return this.editionIdStream(editionId).pipe(
      switchMap((id) => this.getEventCollection<FloatingReaction & { uid: string }>(id, 'emojis')),
    );
  }

  async deleteSession(sessionId: string, editionId?: string | number) {
    const id = await this.resolveEditionId(editionId);
    return runInInjectionContext(this._injector, () =>
      deleteDoc(doc(this.fs, firestorePaths.session(id, sessionId))),
    );
  }

  private editionIdStream(editionId?: string | number): Observable<string> {
    return editionId === undefined ? this.getCurrentEditionId() : of(String(editionId));
  }

  private resolveEditionId(editionId?: string | number): Promise<string> {
    return editionId === undefined
      ? firstValueFrom(this.getCurrentEditionId())
      : Promise.resolve(String(editionId));
  }
}
