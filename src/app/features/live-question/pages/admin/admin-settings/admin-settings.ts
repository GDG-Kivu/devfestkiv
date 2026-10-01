import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../../../core/auth/services/auth.service';
import { RoleService } from '../../../../../core/auth/services/role.service';
import { UserProfile } from '../../../../../core/auth/models/user-profile.model';

@Component({
  selector: 'app-admin-settings',
  imports: [CommonModule, FormsModule],
  templateUrl: "admin-settings.html",
  styles: `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes popIn {
      from { opacity: 0; transform: scale(0.96); }
      to { opacity: 1; transform: scale(1); }
    }
    .animate-fade-in {
      animation: fadeIn 0.2s ease-out forwards;
    }
    .animate-pop-in {
      animation: popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `,
})
export class AdminSettings implements OnInit, OnDestroy {
  private readonly auth = inject(Auth);
  readonly authService = inject(AuthService);
  readonly roles = inject(RoleService);
  readonly router = inject(Router);

  // Photo error fallback state
  photoLoadError = signal(false);

  // Viewers state
  viewers = signal<UserProfile[]>([]);
  private viewersSub?: Subscription;
  newViewerEmail = '';
  newViewerName = '';
  newViewerRoom = '';
  showAddModal = signal(false);
  isAddingViewer = signal(false);
  viewerErrorMessage = signal<string | null>(null);
  viewerToRemove = signal<UserProfile | null>(null);

  // Admin Transfer state
  newEmail = '';
  showTransferModal = signal(false);
  isSubmittingTransfer = signal(false);
  adminTransferError = signal<string | null>(null);

  ngOnInit(): void {
    this.viewersSub = this.roles.getViewers().subscribe((vList) => {
      this.viewers.set(vList);
    });
  }

  onPhotoError(): void {
    this.photoLoadError.set(true);
  }

  userDisplayName(): string {
    const afUser = this.auth.currentUser;
    if (afUser?.displayName) return afUser.displayName;
    if (afUser?.providerData && afUser.providerData.length > 0) {
      for (const p of afUser.providerData) {
        if (p?.displayName) return p.displayName;
      }
    }
    const svcUser = this.authService.user();
    if (svcUser?.displayName) return svcUser.displayName;
    if (this.roles.profile()?.displayName) return this.roles.profile()!.displayName!;
    if (afUser?.email) return afUser.email.split('@')[0];
    if (svcUser?.email) return svcUser.email.split('@')[0];
    return 'Administrateur';
  }

  userEmail(): string {
    return (
      this.auth.currentUser?.email ||
      this.authService.user()?.email ||
      this.roles.profile()?.email ||
      'Compte Google connecté'
    );
  }

  userPhotoURL(): string | null {
    const afUser = this.auth.currentUser;
    if (afUser?.photoURL) return afUser.photoURL;
    if (afUser?.providerData && afUser.providerData.length > 0) {
      for (const p of afUser.providerData) {
        if (p?.photoURL) return p.photoURL;
      }
    }
    const svcUser = this.authService.user();
    if (svcUser?.photoURL) return svcUser.photoURL;
    if (svcUser?.providerData && svcUser.providerData.length > 0) {
      for (const p of svcUser.providerData) {
        if (p?.photoURL) return p.photoURL;
      }
    }
    return this.roles.profile()?.photoURL || null;
  }

  getInitials(name?: string | null): string {
    if (!name) return 'A';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  // --- VIEWER MODAL METHODS ---
  openAddViewerModal(): void {
    this.newViewerEmail = '';
    this.newViewerName = '';
    this.newViewerRoom = '';
    this.viewerErrorMessage.set(null);
    this.showAddModal.set(true);
  }

  isValidViewerEmail(): boolean {
    const email = this.newViewerEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async submitAddViewer(): Promise<void> {
    if (!this.isValidViewerEmail() || this.isAddingViewer()) return;
    this.isAddingViewer.set(true);
    this.viewerErrorMessage.set(null);

    try {
      await this.roles.addViewer(
        this.newViewerEmail.trim(),
        this.newViewerName.trim(),
        this.newViewerRoom.trim()
      );
      this.newViewerEmail = '';
      this.newViewerName = '';
      this.newViewerRoom = '';
      this.showAddModal.set(false);
    } catch (err: any) {
      this.viewerErrorMessage.set(err?.message || 'Erreur lors de l\'ajout du présentateur.');
    } finally {
      this.isAddingViewer.set(false);
    }
  }

  openRemoveViewerConfirm(viewer: UserProfile): void {
    this.viewerToRemove.set(viewer);
  }

  async confirmRemoveViewer(): Promise<void> {
    const v = this.viewerToRemove();
    if (!v) return;
    try {
      await this.roles.removeViewer(v.uid);
      this.viewerToRemove.set(null);
    } catch {
      this.viewerToRemove.set(null);
    }
  }

  // --- ADMIN TRANSFER METHODS ---
  openTransferModal(): void {
    this.newEmail = '';
    this.adminTransferError.set(null);
    this.showTransferModal.set(true);
  }

  isValidEmail(): boolean {
    const email = this.newEmail.trim().toLowerCase();
    const currentEmail = (this.userEmail() || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email !== currentEmail;
  }

  async confirmTransfer(): Promise<void> {
    if (!this.isValidEmail() || this.isSubmittingTransfer()) return;
    this.isSubmittingTransfer.set(true);
    this.adminTransferError.set(null);

    try {
      await this.roles.transferAdminRole(this.newEmail.trim());
      this.showTransferModal.set(false);
      // Immediately sign out current admin and redirect to home
      await this.authService.signOut();
      await this.router.navigateByUrl('/');
    } catch (error: any) {
      this.adminTransferError.set(
        error?.message || 'Une erreur est survenue lors du transfert de l\'administration.'
      );
    } finally {
      this.isSubmittingTransfer.set(false);
    }
  }

  ngOnDestroy(): void {
    this.viewersSub?.unsubscribe();
  }
}
export default AdminSettings;
