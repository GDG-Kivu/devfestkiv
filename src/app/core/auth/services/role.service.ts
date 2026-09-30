import { computed, effect, inject, Injectable, signal } from '@angular/core';
import {
  collection,
  collectionData,
  deleteDoc,
  doc,
  Firestore,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from '@angular/fire/firestore';
import { User } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { FIRESTORE_COLLECTIONS, firestorePaths } from '../../firestore/firestore-paths';
import { UserProfile } from '../models/user-profile.model';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private readonly firestore = inject(Firestore);
  private readonly auth = inject(AuthService);

  readonly profile = signal<UserProfile | null>(null);
  readonly isAdmin = signal(false);
  readonly isViewer = signal(false);
  readonly isLoadingProfile = signal(false);
  readonly isPresenterOrAdmin = computed(() => this.isAdmin() || this.isViewer());

  constructor() {
    effect(() => {
      const user = this.auth.user();
      if (user) {
        this.isLoadingProfile.set(true);
        void this.ensureProfile(user).finally(() => {
          this.isLoadingProfile.set(false);
        });
      } else {
        this.profile.set(null);
        this.isAdmin.set(false);
        this.isViewer.set(false);
        this.isLoadingProfile.set(false);
      }
    });
  }

  /**
   * Resolves or provisions the user profile document in Firestore.
   */
  async ensureProfile(user: User): Promise<UserProfile | null> {
    this.isLoadingProfile.set(true);
    try {
      const userDocRef = doc(this.firestore, firestorePaths.user(user.uid));
      const snapshot = await getDoc(userDocRef);
      let profile = snapshot.exists()
        ? ({ uid: user.uid, ...snapshot.data() } as UserProfile)
        : null;

      const userEmailClean = user.email ? user.email.toLowerCase().trim() : null;

      // If user signed in with an email, check for invitation / duplicate docs matching this email
      if (userEmailClean) {
        const usersCol = collection(this.firestore, FIRESTORE_COLLECTIONS.users);
        const emailQuery = query(
          usersCol,
          where('email', '==', userEmailClean)
        );
        const querySnapshot = await getDocs(emailQuery);

        for (const matchedDoc of querySnapshot.docs) {
          const matchedData = matchedDoc.data();

          if (matchedData['disabled'] !== true && (matchedData['role'] === 'admin' || matchedData['role'] === 'viewer')) {
            if (!profile || profile.role !== 'admin') {
              profile = {
                uid: user.uid,
                email: userEmailClean,
                displayName: user.displayName || profile?.displayName || matchedData['displayName'] || null,
                roomName: matchedData['roomName'] || profile?.roomName || null,
                photoURL: user.photoURL || profile?.photoURL || matchedData['photoURL'] || null,
                role: matchedData['role'],
                disabled: false,
                createdAt: profile?.createdAt || matchedData['createdAt'] || null,
                createdBy: profile?.createdBy || matchedData['createdBy'] || null,
              };
            }
          }

          // Clean up temporary invitation document if doc ID differs from actual user.uid
          if (matchedDoc.id !== user.uid) {
            try {
              await deleteDoc(doc(this.firestore, firestorePaths.user(matchedDoc.id)));
            } catch (err) {
              // Ignore if delete not permitted
            }
          }
        }
      }

      if (!profile) {
        profile = {
          uid: user.uid,
          email: userEmailClean,
          displayName: user.displayName || null,
          photoURL: user.photoURL || null,
          role: 'participant',
          disabled: false,
        };
      } else {
        // Sync latest photoURL & displayName from Google auth
        if (user.photoURL && profile.photoURL !== user.photoURL) {
          profile.photoURL = user.photoURL;
        }
        if (user.displayName && profile.displayName !== user.displayName) {
          profile.displayName = user.displayName;
        }
      }

      // Save/Merge the consolidated profile under user.uid
      await setDoc(userDocRef, profile, { merge: true });

      if (this.auth.user()?.uid !== user.uid) return null;
      this.profile.set(profile);
      const isAccountActive = profile?.disabled !== true;
      this.isAdmin.set(profile?.role === 'admin' && isAccountActive);
      this.isViewer.set(profile?.role === 'viewer' && isAccountActive);
      return profile;
    } catch {
      this.profile.set(null);
      this.isAdmin.set(false);
      this.isViewer.set(false);
      return null;
    } finally {
      this.isLoadingProfile.set(false);
    }
  }

  /**
   * Checks if current user has admin role.
   */
  async isCurrentUserAdmin(user: User | null): Promise<boolean> {
    if (!user) {
      this.profile.set(null);
      this.isAdmin.set(false);
      this.isViewer.set(false);
      return false;
    }
    await this.ensureProfile(user);
    return this.isAdmin();
  }

  /**
   * Checks if current user has presenter or admin privileges.
   */
  async isCurrentUserPresenter(user: User | null): Promise<boolean> {
    if (!user) {
      this.profile.set(null);
      this.isAdmin.set(false);
      this.isViewer.set(false);
      return false;
    }
    await this.ensureProfile(user);
    return this.isPresenterOrAdmin();
  }

  /**
   * Transfers the unique admin role to another Google account email.
   */
  async transferAdminRole(newEmail: string): Promise<void> {
    const currentUser = this.auth.user();
    if (!currentUser) {
      throw new Error('No user currently connected.');
    }
    const cleanEmail = newEmail.toLowerCase().trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Invalid email address.');
    }

    const currentDocRef = doc(this.firestore, firestorePaths.user(currentUser.uid));

    // Update current document with the new admin email
    await setDoc(
      currentDocRef,
      {
        email: cleanEmail,
        role: 'admin',
        disabled: false,
        transferredAt: serverTimestamp(),
        transferredBy: currentUser.email || currentUser.uid,
      },
      { merge: true }
    );
  }

  /**
   * Adds a new presenter / viewer user.
   */
  async addViewer(email: string, displayName?: string, roomName?: string): Promise<void> {
    const currentUser = this.auth.user();
    if (!this.isAdmin()) {
      throw new Error('Only an administrator can add viewers.');
    }
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Invalid email address.');
    }

    const usersCol = collection(this.firestore, FIRESTORE_COLLECTIONS.users);
    
    // Check if user with this email already exists
    const existingQuery = query(usersCol, where('email', '==', cleanEmail));
    const existingSnapshot = await getDocs(existingQuery);
    
    if (!existingSnapshot.empty) {
      for (const existingDoc of existingSnapshot.docs) {
        const data = existingDoc.data();
        if (data['role'] === 'admin') {
          throw new Error('This user is the current active administrator.');
        }
        await setDoc(
          doc(this.firestore, firestorePaths.user(existingDoc.id)),
          {
            role: 'viewer',
            disabled: false,
            displayName: displayName || data['displayName'] || null,
            roomName: roomName || data['roomName'] || null,
            updatedAt: serverTimestamp(),
            createdBy: currentUser?.email || 'admin',
          },
          { merge: true }
        );
      }
    } else {
      // Create a new document in users collection
      const newViewerRef = doc(usersCol);
      await setDoc(newViewerRef, {
        uid: newViewerRef.id,
        email: cleanEmail,
        displayName: displayName || null,
        roomName: roomName || null,
        role: 'viewer',
        disabled: false,
        createdAt: serverTimestamp(),
        createdBy: currentUser?.email || 'admin',
      });
    }
  }

  /**
   * Removes or revokes a viewer role.
   */
  async removeViewer(viewerId: string): Promise<void> {
    if (!this.isAdmin()) {
      throw new Error('Only an administrator can remove viewers.');
    }
    await deleteDoc(doc(this.firestore, firestorePaths.user(viewerId)));
  }

  /**
   * Real-time stream of all active viewers.
   */
  getViewers(): Observable<UserProfile[]> {
    const usersCol = collection(this.firestore, FIRESTORE_COLLECTIONS.users);
    const viewersQuery = query(usersCol, where('role', '==', 'viewer'));
    return collectionData(viewersQuery, { idField: 'uid' }) as Observable<UserProfile[]>;
  }
}

