import { EnvironmentInjector, inject, Injectable, runInInjectionContext } from '@angular/core';
import {
  collection,
  collectionData,
  deleteDoc,
  doc,
  FieldValue,
  Firestore,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
} from '@angular/fire/firestore';
import { AuthService } from '../auth/auth.service';
import {
  FloatingReaction,
  LiveQuestion,
} from '../../features/live-question/models/live-question.model';
import { LiveSession } from '../../features/live-question/models/live-session.model';
import { FIRESTORE_COLLECTIONS, firestorePaths } from './firestore-paths';

export const MAX_QUESTIONS_PER_USER = 5;

@Injectable({
  providedIn: 'root',
})
export class FirestoreService {
  private readonly fs = inject(Firestore);
  private readonly auth = inject(AuthService);
  private readonly _injector: EnvironmentInjector = inject(EnvironmentInjector);
  private readonly sessionsCol = collection(this.fs, FIRESTORE_COLLECTIONS.sessions);
  createDocId = (colName: string) => doc(collection(this.fs, colName)).id;

  private readonly emojisCol = collection(this.fs, FIRESTORE_COLLECTIONS.emojis);
  private readonly remoteCol = collection(this.fs, FIRESTORE_COLLECTIONS.remote);

  getSessions() {
    return runInInjectionContext(this._injector, () => {
      return collectionData(this.sessionsCol) as any;
    });
  }

  getActiveSessions() {
    return runInInjectionContext(this._injector, () => {
      const activeSessions = query(this.sessionsCol, where('isActive', '==', true));
      return collectionData(activeSessions) as any;
    });
  }

  setSession(session: LiveSession<FieldValue>) {
    return runInInjectionContext(this._injector, () => {
      const docRef = doc(this.fs, firestorePaths.session(session.id));
      return setDoc(docRef, session, { merge: true });
    });
  }

  getQuestions(sessionId: string) {
    return runInInjectionContext(this._injector, () => {
      const questionsCol = collection(this.fs, firestorePaths.sessionQuestions(sessionId));
      return collectionData(questionsCol, { idField: 'id' }) as any;
    });
  }

  addQuestion(sessionId: string, question: Omit<LiveQuestion, 'uid' | 'createdAt' | 'status'>) {
    return this.auth.ensureAuthenticated().then((user) => {
      if (!user) {
        throw new Error('An authenticated user is required to add a question.');
      }

      return runInInjectionContext(this._injector, () => {
        const questionRef = doc(collection(this.fs, firestorePaths.sessionQuestions(sessionId)));
        const quotaRef = doc(this.fs, firestorePaths.questionQuota(user.uid));
        const content = question.contenu.trim();

        if (!content || content.length > 1000) {
          throw new Error('Question content must be between 1 and 1000 characters.');
        }

        return runTransaction(this.fs, async (transaction) => {
          const quotaSnapshot = await transaction.get(quotaRef);
          const currentCount = quotaSnapshot.exists()
            ? (quotaSnapshot.data()['count'] as number)
            : 0;

          if (!Number.isInteger(currentCount) || currentCount >= MAX_QUESTIONS_PER_USER) {
            throw new Error('Question limit reached.');
          }

          transaction.set(questionRef, {
            contenu: content,
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
    });
  }

  setEmojis(emojis: FloatingReaction) {
    return this.auth.ensureAuthenticated().then((user) => {
      if (!user) throw new Error('An authenticated user is required to publish a reaction.');
      return runInInjectionContext(this._injector, () => {
        const docRef = doc(this.fs, `${FIRESTORE_COLLECTIONS.emojis}/${emojis.id}`);
        return setDoc(docRef, { ...emojis, uid: user.uid }, { merge: true });
      });
    });
  }

  setRemote(action: string, id = '129383746') {
    return runInInjectionContext(this._injector, () => {
      const docRef = doc(this.fs, `${FIRESTORE_COLLECTIONS.remote}/${id}`);
      return setDoc(docRef, { command: action }, { merge: true });
    });
  }
  getStateRemote() {
    return runInInjectionContext(this._injector, () => {
      return collectionData(this.remoteCol) as any;
    });
  }
  getEmojis() {
    return runInInjectionContext(this._injector, () => {
      return collectionData(this.emojisCol) as any;
    });
  }
  deleteSession(sessionId: string) {
    return runInInjectionContext(this._injector, () => {
      const drinkRef = doc(this.fs, firestorePaths.session(sessionId));
      return deleteDoc(drinkRef);
    });
  }
}
