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
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { AuthService } from '../auth/services/auth.service';
import {
  FloatingReaction,
  LiveQuestion,
} from '../../features/live-question/models/live-question.model';
import { LiveSession } from '../../features/live-question/models/live-session.model';
import { EventPartner } from '../../features/event/models/partner.model';
import { EventDocument, SiteSettings } from '../../features/event/models/event.model';
import { EVENT_CONFIG } from '../../config/event.config';
import { EventSubcollection, FIRESTORE_COLLECTIONS, firestorePaths } from './firestore-paths';
import { FirestoreResult } from '../../shared/models/firestore-result.model';
import { FirestorePublicationFilter } from '../../shared/models/firestore-publication-filter.model';
import { formattedTimestamp } from '../../shared/utils/formatted-timestamp';
import { catchError, firstValueFrom, map, Observable, of, startWith, switchMap } from 'rxjs';

export const DEFAULT_QUESTIONS_PER_USER = 5;
export const MAX_CONFIGURABLE_QUESTIONS_PER_USER = 100;

@Injectable({
  providedIn: 'root',
})
export class FirestoreService {
  private readonly fs = inject(Firestore);
  private readonly auth = inject(AuthService);
  private readonly _injector: EnvironmentInjector = inject(EnvironmentInjector);
  createDocId = (colName: string) =>
    runInInjectionContext(this._injector, () => doc(collection(this.fs, colName)).id);

  getAllEvents(): Observable<EventDocument[]> {
    return runInInjectionContext(
      this._injector,
      () =>
        collectionData(collection(this.fs, FIRESTORE_COLLECTIONS.events), {
          idField: 'editionId',
        }) as Observable<EventDocument[]>,
    );
  }

  getAvailableEditions(): Observable<string[]> {
    const defaultEditions = ['2025', '2024', '2023', '2022', '2021', '2020', '2019'];
    return this.getAllEvents().pipe(
      map((events) => {
        const firestoreIds = (events || [])
          .map((e) => String(e.editionId || e.edition || e.year))
          .filter(Boolean);
        const combined = Array.from(new Set([...firestoreIds, ...defaultEditions]));
        return combined.sort((a, b) => (Number(b) || 0) - (Number(a) || 0));
      }),
      catchError(() => of(defaultEditions)),
    );
  }

  async createEdition(editionId: string, baseData?: Partial<EventDocument>): Promise<void> {
    const year = parseInt(editionId, 10) || new Date().getFullYear();
    const defaultData: Partial<EventDocument> = {
      editionId,
      edition: year,
      year,
      name: `DevFest Kivu ${year}`,
      fullName: `DevFest Kivu ${year}`,
      theme: 'Innovation & Tech',
      description: `Rassemblement technologique annuel DevFest Kivu ${year}`,
      registrationUrl: '',
      contact: {
        email: 'gdgkivu@gmail.com',
        phone: '+243999537410',
      },
      venue: {
        city: 'Bukavu',
        country: 'RD Congo',
        fullLocation: 'Bukavu, RD Congo',
        conferenceCenter: 'Hotel Panorama Bukavu',
      },
      date: {
        start: new Date(`${year}-11-29T09:00:00`),
        end: new Date(`${year}-11-29T18:00:00`),
        display: {
          start: 29,
          end: 29,
          month: 'Novembre',
          year,
        },
      },
      impactStats: EVENT_CONFIG.impactStats,
      engagementYear: 5,
      maxQuestionsPerUser: DEFAULT_QUESTIONS_PER_USER,
      isPublished: true,
      ...baseData,
    };

    await this.saveEvent(editionId, defaultData);
  }

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
      catchError(() => of(String(EVENT_CONFIG.edition))),
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

  /** Read an edition document and fall back to local config for the bundled edition. */
  getEventWithFallback(editionId: string | number): Observable<EventDocument | undefined> {
    const id = String(editionId);
    const fallback = this.localEventFallback(id);
    return this.getEvent(id).pipe(
      map((event) => (event ? this.normalizeEventDates(event) : fallback)),
      catchError(() => of(fallback)),
    );
  }

  /** Resolve siteSettings/global.currentEditionId, then load Firestore or local fallback. */
  getCurrentEventWithFallback(): Observable<EventDocument | undefined> {
    return this.getCurrentEditionId().pipe(
      switchMap((editionId) => this.getEventWithFallback(editionId)),
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

  /** Query only published documents, as required by Firestore rules for public reads. */
  getPublishedEventCollection<T>(
    editionId: string | number,
    collectionName: EventSubcollection,
    publication: FirestorePublicationFilter = { field: 'isPublished', value: true },
  ): Observable<T[]> {
    return runInInjectionContext(this._injector, () => {
      const publishedQuery = query(
        collection(this.fs, firestorePaths.eventCollection(editionId, collectionName)),
        where(publication.field, '==', publication.value),
      );
      return collectionData(publishedQuery, { idField: 'id' }) as Observable<T[]>;
    });
  }

  getPublishedEventCollectionResult<T>(
    editionId: string | number,
    collectionName: EventSubcollection,
    publication: FirestorePublicationFilter = { field: 'isPublished', value: true },
    fallback?: T[],
  ): Observable<FirestoreResult<T[]>> {
    return this.getPublishedEventCollection<T>(editionId, collectionName, publication).pipe(
      map((data): FirestoreResult<T[]> => ({ status: 'success', data, source: 'firestore' })),
      startWith({ status: 'loading' } as FirestoreResult<T[]>),
      catchError((error: unknown) =>
        of({
          status: 'error',
          error,
          ...(fallback === undefined ? {} : { fallback }),
        } as FirestoreResult<T[]>),
      ),
    );
  }

  /** Read one document from an edition subcollection. */
  getEventDocument<T>(
    editionId: string | number,
    collectionName: EventSubcollection,
    documentId: string,
  ): Observable<T | undefined> {
    return runInInjectionContext(
      this._injector,
      () =>
        docData(
          doc(this.fs, firestorePaths.eventDocument(editionId, collectionName, documentId)),
        ) as Observable<T | undefined>,
    );
  }

  /** Emit loading, then success; on read failure expose the error and optional local fallback. */
  getEventCollectionResult<T>(
    editionId: string | number,
    collectionName: EventSubcollection,
    fallback?: T[],
  ): Observable<FirestoreResult<T[]>> {
    return this.getEventCollection<T>(editionId, collectionName).pipe(
      map((data): FirestoreResult<T[]> => {
        if (data.length === 0 && fallback !== undefined) {
          return { status: 'success', data: fallback, source: 'fallback' };
        }
        return { status: 'success', data, source: 'firestore' };
      }),
      startWith({ status: 'loading' } as FirestoreResult<T[]>),
      catchError((error: unknown) =>
        of({
          status: 'error',
          error,
          ...(fallback === undefined ? {} : { fallback }),
        } as FirestoreResult<T[]>),
      ),
    );
  }

  /** Create a document with a supplied ID or a generated Firestore ID; writes its ID in the data. */
  async createEventDocument<T extends object>(
    editionId: string | number,
    collectionName: EventSubcollection,
    value: T & { id?: string },
  ): Promise<string> {
    return runInInjectionContext(this._injector, async () => {
      const collectionRef = collection(
        this.fs,
        firestorePaths.eventCollection(editionId, collectionName),
      );
      const documentRef = value.id ? doc(collectionRef, value.id) : doc(collectionRef);
      await setDoc(documentRef, { ...value, id: documentRef.id });
      return documentRef.id;
    });
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

  /** Update an existing edition document; unlike saveEventDocument this does not upsert. */
  updateEventDocument<T extends object>(
    editionId: string | number,
    collectionName: EventSubcollection,
    documentId: string,
    changes: Partial<T>,
  ) {
    return runInInjectionContext(this._injector, () =>
      updateDoc(
        doc(this.fs, firestorePaths.eventDocument(editionId, collectionName, documentId)),
        changes as never,
      ),
    );
  }

  /** Delete one document from an edition subcollection. Firestore does not cascade subcollections. */
  deleteEventDocument(
    editionId: string | number,
    collectionName: EventSubcollection,
    documentId: string,
  ) {
    return runInInjectionContext(this._injector, () =>
      deleteDoc(doc(this.fs, firestorePaths.eventDocument(editionId, collectionName, documentId))),
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
    // If not authenticated, silently authenticate anonymously without altering existing Google session
    const user = await this.auth.ensureAnonymousOrAuthenticated();
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

        const authorName = user.displayName
          ? user.displayName
          : user.isAnonymous
            ? 'Participant Anonyme'
            : user.email
              ? user.email.split('@')[0]
              : 'Participant';

        transaction.set(questionRef, {
          contenu: questionContent,
          displayName: authorName,
          email: user.email || null,
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
    const user = await this.auth.ensureAnonymousOrAuthenticated();
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

  private localEventFallback(editionId: string): EventDocument | undefined {
    if (editionId !== String(EVENT_CONFIG.edition)) return undefined;
    return {
      editionId,
      edition: EVENT_CONFIG.edition,
      year: EVENT_CONFIG.year,
      name: EVENT_CONFIG.name,
      fullName: EVENT_CONFIG.fullName,
      date: EVENT_CONFIG.date,
      venue: EVENT_CONFIG.venue,
      theme: EVENT_CONFIG.theme,
      description: EVENT_CONFIG.description,
      registrationUrl: EVENT_CONFIG.registrationUrl,
      contact: EVENT_CONFIG.contact,
      impactStats: EVENT_CONFIG.impactStats,
      engagementYear: EVENT_CONFIG.engagementYear,
      maxQuestionsPerUser: DEFAULT_QUESTIONS_PER_USER,
      isPublished: true,
    };
  }

  private normalizeEventDates(event: EventDocument): EventDocument {
    const normalize = (value: EventDocument['date']['start']): Date => {
      if (value instanceof Date) return value;
      return formattedTimestamp(value as Timestamp);
    };
    return {
      ...event,
      date: {
        ...event.date,
        start: normalize(event.date.start),
        end: normalize(event.date.end),
      },
    };
  }
}
