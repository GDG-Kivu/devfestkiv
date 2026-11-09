import { Component, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminSettings } from './admin-settings/admin-settings';
import { AdminCms } from './admin-cms/admin-cms';
import { AdminTshirtOrders } from './admin-tshirt-orders/admin-tshirt-orders';
import { FirestoreService } from '../../../../core/firestore/firestore.service';
import { Subscription } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';
import { LiveSession } from '../../models/live-session.model';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { RoleService } from '../../../../core/auth/services/role.service';

import { Skeleton } from '../../../../shared/components/skeleton/skeleton';
import { Card } from './sessions/card/card';
import { SessionForm } from './sessions/session-form/session-form';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, Card, SessionForm, AdminSettings, AdminCms, AdminTshirtOrders, Skeleton],
  templateUrl: './admin.html',
  styles: ``,
})
export default class AdminComponent implements OnInit, OnDestroy {
  readonly auth = inject(AuthService);
  readonly roles = inject(RoleService);
  private fs = inject(FirestoreService);

  activeTab = signal<'sessions' | 'cms' | 'settings' | 'tshirts'>('sessions');
  showForm = false;
  selectedSession?: any;
  sessions: LiveSession<Timestamp>[] = [];
  sessionsLoading = signal(true);
  speakersSub!: Subscription;

  constructor() {
    effect(() => {
      // Adjust default active tab based on active role
      if (this.roles.isStaff() && !this.roles.isAdmin()) {
        this.activeTab.set('tshirts');
      } else if (this.roles.isViewer() && !this.roles.isAdmin()) {
        this.activeTab.set('sessions');
      }
    });
  }

  ngOnInit(): void {
    this.sessionsLoading.set(true);
    this.speakersSub = this.fs.getSessions().subscribe((sessions: any) => {
      this.sessions = sessions || [];
      this.sessionsLoading.set(false);
    });
  }

  onViewSession(session: LiveSession<Timestamp>) {
    console.log('View session:', session);
  }

  onToggleStatus(sessionId: string) {
    const session = this.sessions.find((s) => s.id === sessionId);
    if (session) {
      session.isActive = !session.isActive;
    }
  }

  openForm() {
    this.selectedSession = undefined;
    this.showForm = true;
  }

  onFormClosed() {
    this.showForm = false;
    this.selectedSession = undefined;
  }

  ngOnDestroy(): void {
    if (this.speakersSub) {
      this.speakersSub.unsubscribe();
    }
  }
}
