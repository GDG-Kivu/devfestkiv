import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription, combineLatest } from 'rxjs';
import { FirestoreService } from '../../../../../core/firestore/firestore.service';
import { EventDocument } from '../../../../event/models/event.model';
import { Speaker } from '../../../../event/models/speaker.model';
import { AgendaItem } from '../../../../event/models/agenda-item.model';
import { FaqItem } from '../../../../event/models/faq-item.model';
import { EventPartner } from '../../../../event/models/partner.model';

import { EventConfigModalComponent } from './modals/event-config/event-config-modal.component';
import { SpeakersModalComponent } from './modals/speakers/speakers-modal.component';
import { AgendaModalComponent } from './modals/agenda/agenda-modal.component';
import { FaqModalComponent } from './modals/faq/faq-modal.component';
import { GalleryModalComponent } from './modals/gallery/gallery-modal.component';
import { PartnersModalComponent } from './modals/partners/partners-modal.component';
import { DpTemplateModalComponent } from './modals/dp-template-modal.component';
import { NewEditionModalComponent } from './modals/new-edition-modal.component';

@Component({
  selector: 'app-admin-cms',
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    EventConfigModalComponent,
    SpeakersModalComponent,
    AgendaModalComponent,
    FaqModalComponent,
    GalleryModalComponent,
    PartnersModalComponent,
    DpTemplateModalComponent,
    NewEditionModalComponent,
  ],
  templateUrl: "admin-cms.html",
  styles: `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fadeIn 0.25s ease-out forwards;
    }
  `,
})
export class AdminCms implements OnInit, OnDestroy {
  private fs = inject(FirestoreService);

  // Editions state
  availableEditions = signal<string[]>([]);
  selectedEditionId = signal<string>('');
  liveEditionId = signal<string>('');
  isSettingLive = signal(false);
  statusMessage = signal<string | null>(null);

  // Counts & Data for selected edition
  isLoadingModules = signal(true);
  currentEvent = signal<EventDocument | null>(null);
  speakersCount = signal(0);
  agendaCount = signal(0);
  faqCount = signal(0);
  partnersCount = signal(0);
  galleryPhotosCount = signal(0);
  albumsCount = signal(0);

  // Modals state
  activeModal = signal<'config' | 'speakers' | 'agenda' | 'faq' | 'gallery' | 'partners' | 'dp-template' | null>(null);
  showNewEditionModal = signal(false);

  private subs: Subscription = new Subscription();

  ngOnInit(): void {
    // 1. Listen to available editions
    this.subs.add(
      this.fs.getAvailableEditions().subscribe((eds) => {
        if (eds && eds.length > 0) {
          this.availableEditions.set(eds);
        }
      })
    );

    // 2. Listen to current global live edition ID — initialise selectedEdition la première fois
    this.subs.add(
      this.fs.getCurrentEditionId().subscribe((liveId) => {
        this.liveEditionId.set(liveId);
        if (!this.selectedEditionId()) {
          this.selectedEditionId.set(liveId);
          this.loadEditionData(liveId);
        }
      })
    );
  }

  onEditionChange(newEdition: string): void {
    this.selectedEditionId.set(newEdition);
    this.loadEditionData(newEdition);
  }

  loadEditionData(editionId: string): void {
    this.isLoadingModules.set(true);

    const event$ = this.fs.getEvent(editionId);
    const speakers$ = this.fs.getEventCollection<Speaker>(editionId, 'speakers');
    const agenda$ = this.fs.getEventCollection<AgendaItem>(editionId, 'agenda');
    const faq$ = this.fs.getEventCollection<FaqItem>(editionId, 'faq');
    const partners$ = this.fs.getEventCollection<EventPartner>(editionId, 'partners');

    combineLatest([event$, speakers$, agenda$, faq$, partners$]).subscribe({
      next: ([eventDoc, speakersList, agendaList, faqList, partnersList]) => {
        this.currentEvent.set(eventDoc || null);
        this.speakersCount.set(speakersList?.length || 0);
        this.agendaCount.set(agendaList?.length || 0);
        this.faqCount.set(faqList?.length || 0);
        this.partnersCount.set(partnersList?.length || 0);

        const photos = eventDoc?.gallery || [];
        this.galleryPhotosCount.set(photos.length);
        this.albumsCount.set(eventDoc?.albums?.length || 0);

        this.isLoadingModules.set(false);
      },
      error: () => {
        this.isLoadingModules.set(false);
      },
    });
  }

  async setAsLiveEdition(): Promise<void> {
    const targetEdition = this.selectedEditionId();
    if (!targetEdition || this.isSettingLive()) return;
    this.isSettingLive.set(true);

    try {
      await this.fs.saveSiteSettings({ currentEditionId: targetEdition });
      this.liveEditionId.set(targetEdition);
      this.statusMessage.set(`L'édition ${targetEdition} est maintenant active sur le site public !`);
      setTimeout(() => this.statusMessage.set(null), 4000);
    } catch (err: any) {
      alert(err?.message || 'Erreur lors de l\'activation de l\'édition.');
    } finally {
      this.isSettingLive.set(false);
    }
  }

  openModal(modal: 'config' | 'speakers' | 'agenda' | 'faq' | 'gallery' | 'partners' | 'dp-template'): void {
    this.activeModal.set(modal);
  }

  closeModal(): void {
    this.activeModal.set(null);
  }

  onDataUpdated(): void {
    this.loadEditionData(this.selectedEditionId());
  }

  onNewEditionCreated(newEditionId: string): void {
    this.selectedEditionId.set(newEditionId);
    this.loadEditionData(newEditionId);
    this.statusMessage.set(`Nouvelle édition ${newEditionId} créée et sélectionnée.`);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
export default AdminCms;
