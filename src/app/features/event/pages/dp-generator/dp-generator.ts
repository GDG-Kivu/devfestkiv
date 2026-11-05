import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  inject,
  ElementRef,
  ViewChild,
  computed,
  effect,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Profil } from './profil/profil';
import { Generator } from './generator/generator';
import html2canvas from 'html2canvas-pro';
import { ImageCropperComponent, ImageCroppedEvent } from 'ngx-image-cropper';
import { EventConfigService } from '../../services/event-config.service';
import { RoleService } from '../../../../core/auth/services/role.service';
import {
  ROLE_LIST,
  ROLE_META,
  ParticipantRole,
  DpTemplate,
  ROLE_THEME,
} from '../../models/participant-role.model';
import { DpTemplateConfig } from '../../models/event.model';
import { ShareService } from '../../services/share.service';

@Component({
  selector: 'app-dp-generator',
  imports: [CommonModule, FormsModule, Profil, Generator, ImageCropperComponent],
  templateUrl: './dp-generator.html',
})
export default class DpGenerator implements OnInit, OnDestroy {
  eventConfig = inject(EventConfigService);
  roleService = inject(RoleService);
  private shareService = inject(ShareService);

  readonly roles = ROLE_LIST;
  readonly roleTheme = ROLE_THEME;
  readonly roleMeta = ROLE_META;
  readonly maxNameLength = 50;
  private uiTimer?: ReturnType<typeof setTimeout>;
  isSharing = signal(false);
  toast = signal<{ text: string; kind: 'success' | 'error' } | null>(null);
  private toastTimer?: ReturnType<typeof setTimeout>;
  isPreparingImage = false;

  private bodyScrollY = 0;
  private bodyScrollLocked = false;

  // Panneau de secours : partage natif bloqué (iOS) ou desktop sans partage de fichiers
  sharePanel = signal<{ file: File; canNative: boolean } | null>(null);

  private readonly roleIntro: Record<ParticipantRole, string> = {
    attendee: 'Je serai au',
    speaker: 'Je serai speaker au',
    organizer: "Je fais partie de l'équipe organisatrice du",
    Facilitator: 'Je serai bénévole au',
  };

  get shareLink(): string {
    return typeof window !== 'undefined' ? `${window.location.origin}/dp-generator` : '';
  }

  shareMessage = computed(() => {
    const hashtag = this.dpConfig()?.hashtag || `#DevFestKivu${this.eventConfig.year}`;
    return (
      `${this.roleIntro[this.effectiveRole()]} ${this.eventConfig.fullName} !\n` +
      `${this.eventConfig.getFormattedDateBadge()}\n` +
      `Crée ton badge : ${this.shareLink}\n${hashtag}`
    );
  });

  selectedRole = signal<ParticipantRole>('attendee');
  selectedTemplate = signal<DpTemplate>('classic');

  // Config DP lue depuis le document de l'édition (events/{editionId}.dpTemplate)
  dpConfig = computed<DpTemplateConfig | null>(
    () => this.eventConfig.eventDocument()?.dpTemplate ?? null,
  );

  // Garde-fou : c'est CETTE valeur qui est envoyée au Generator
  effectiveRole = computed<ParticipantRole>(() =>
    this.roleService.isAdmin() ? this.selectedRole() : 'attendee',
  );

  constructor(private cdr: ChangeDetectorRef) {
    // Déconnexion / perte du rôle admin => retour à 'attendee'
    effect(() => {
      if (!this.roleService.isAdmin()) {
        this.selectedRole.set('attendee');
      }
    });
  }

  @ViewChild('desktopPreviewWrapper') desktopPreviewWrapper!: ElementRef<HTMLDivElement>;

  desktopScale = 1;
  private resizeObserver?: ResizeObserver;

  activeTab: 'profile' | 'dp' = 'dp';
  uiState: 'initial' | 'imageVisible' | 'templateVisible' = 'initial';

  fullName = '';
  quote = '';
  previewImage: string | ArrayBuffer | null = null;
  isDraggingOver = false;

  // === Recadrage ===
  showCropper = false;
  imageBase64: string | undefined = undefined;
  tempCroppedImage: string | null = null;

  // Thèmes pour Photo de Profil
  profileTheme: 'yellow' | 'blue' | 'green' | 'red' = 'yellow';
  profileStyle: 'classic' | 'minimalist' = 'classic';

  // Thèmes pour le Générateur de DP
  generatorTheme: 'default' | 'white' = 'default';

  // suggestions (fallback local si Firestore n'en fournit pas)
  suggestedQuotes = [
    'Coder est ma passion.',
    `${this.eventConfig.fullName}, j'arrive !`,
    'Prêt à networker et innover.',
    'Talk is cheap. Show me the code.',
    'Building the future, one line at a time.',
  ];
  private quoteIndex = 0;

  // === MOBILE UX ===
  isMobile = false;
  showOverlay = false;
  showPreviewOverlay = false;
  private checkIsMobileBound = this.checkIsMobile.bind(this);

  isExporting = false;
  mobileScale = 1;

  ngOnInit() {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.checkIsMobile();
      window.addEventListener('resize', this.checkIsMobileBound);
      this.preloadAssets([
        'assets/dp-layout.png',
        'assets/logo.png',
        'assets/logo-1.png',
        'assets/border.png',
        'assets/arrow.png',
      ]);
    }
  }

  ngAfterViewInit() {
    if (typeof window !== 'undefined' && this.desktopPreviewWrapper) {
      this.setupDesktopObserver();
    }
  }

  ngOnDestroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.checkIsMobileBound);
      this.restoreBodyScroll();
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    clearTimeout(this.toastTimer);
    clearTimeout(this.uiTimer);
  }

  private setupDesktopObserver() {
    this.resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const availableWidth = entry.contentRect.width;
        this.desktopScale = Math.min(1, availableWidth / 1080);
        this.cdr.detectChanges();
      }
    });
    this.resizeObserver.observe(this.desktopPreviewWrapper.nativeElement);
  }

  private isMobileViewport(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(max-width: 47.99rem)').matches;
  }

  private checkIsMobile() {
    this.isMobile = this.isMobileViewport();

    if (this.isMobile) {
      const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
      const availableWidth = Math.min(viewportWidth - 32, 420);
      const maxCanvasHeight = Math.max(180, window.innerHeight * 0.38);
      this.mobileScale = Math.min(availableWidth / 837, maxCanvasHeight / 837);
    } else {
      this.mobileScale = 1;
      // Passage en mode large (rotation, redimensionnement) : on ferme l'overlay et on débloque le scroll
      if (this.showOverlay || this.showPreviewOverlay) this.closeMobileOverlay();
    }
  }

  private preventBodyScroll() {
    if (this.bodyScrollLocked) return;

    this.bodyScrollY = window.scrollY;

    document.body.style.position = 'fixed';
    document.body.style.top = `-${this.bodyScrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    this.bodyScrollLocked = true;
  }

  private restoreBodyScroll() {
    if (!this.bodyScrollLocked) return;

    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.overflow = '';

    window.scrollTo(0, this.bodyScrollY);

    this.bodyScrollLocked = false;
  }

  openMobileOverlay() {
    this.showOverlay = true;
    this.showPreviewOverlay = true;
    this.preventBodyScroll();
    this.cdr.detectChanges();
  }

  closeMobileOverlay() {
    this.showOverlay = false;
    this.showPreviewOverlay = false;
    this.sharePanel.set(null);
    if (this.previewImage) {
      this.uiState = 'templateVisible';
    } else {
      this.uiState = 'initial';
    }
    this.restoreBodyScroll();
  }

  // Form helpers
  get isFormReadyForUpload(): boolean {
    if (this.activeTab === 'profile') return !!this.fullName.trim();
    return !!this.fullName.trim() && !!this.quote.trim();
  }

  setActiveTab(tab: 'profile' | 'dp') {
    this.activeTab = tab;
    this.sharePanel.set(null);
    if (this.previewImage) {
      this.playEntrance();
    } else {
      clearTimeout(this.uiTimer);
      this.uiState = 'initial';
    }
  }

  setProfileTheme(theme: 'yellow' | 'blue' | 'green' | 'red') {
    this.profileTheme = theme;
  }

  toggleProfileStyle() {
    this.profileStyle = this.profileStyle === 'classic' ? 'minimalist' : 'classic';
  }

  setGeneratorTheme(theme: 'default' | 'white') {
    this.generatorTheme = theme;
  }

  // Rôle & template
  onRoleChange(role: ParticipantRole) {
    this.selectRole(role);
  }

  selectRole(role: ParticipantRole) {
    if (ROLE_META[role].adminOnly && !this.roleService.isAdmin()) {
      return;
    }
    this.selectedRole.set(role);
  }

  setTemplate(t: DpTemplate) {
    this.selectedTemplate.set(t);
  }

  // Drag & Drop & File
  onDragOver(event: DragEvent) {
    if (!this.isFormReadyForUpload) return;
    event.preventDefault();
    this.isDraggingOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDraggingOver = false;
  }

  onDrop(event: DragEvent) {
    if (!this.isFormReadyForUpload) return;

    event.preventDefault();
    this.isDraggingOver = false;

    const file = event.dataTransfer?.files?.[0];

    if (file) {
      void this.openCropper(file);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    input.value = '';

    if (file) {
      void this.openCropper(file);
    }
  }

  onImageCropped(event: ImageCroppedEvent) {
    if (event.base64) {
      this.tempCroppedImage = event.base64;
    }
  }

  imageCropperCancelled() {
    this.showCropper = false;
    this.imageBase64 = undefined;
    this.tempCroppedImage = null;
  }

  onCropperLoadFailed() {
    this.imageCropperCancelled();

    this.showToast(
      'Impossible de lire cette image. Essayez un fichier JPG, PNG ou WEBP.',
      'error',
      5000,
    );
  }

  confirmCrop() {
    if (!this.tempCroppedImage || this.isPreparingImage) return;

    this.previewImage = this.tempCroppedImage;

    this.showCropper = false;
    this.imageBase64 = undefined;
    this.tempCroppedImage = null;

    this.playEntrance();

    this.checkIsMobile();

    if (this.isMobile) {
      this.openMobileOverlay();
    }
  }

  suggestQuote() {
    const fromConfig = this.dpConfig()?.suggestedQuotes;
    const list = fromConfig?.length ? fromConfig : this.suggestedQuotes;
    this.quote = list[this.quoteIndex % list.length];
    this.quoteIndex = (this.quoteIndex + 1) % list.length;
  }

  // Capture & Download
  /** Rend la zone en PNG (clone hors écran + html2canvas-pro). null si échec. */
  private async renderToBlob(elementId: string): Promise<Blob | null> {
    this.ensureTemplateVisible();

    const el =
      document.getElementById(elementId) ||
      (document.querySelector(`[data-capture-zone="${elementId}"]`) as HTMLElement | null);

    if (!el) {
      console.error(`Élément ${elementId} introuvable`);
      this.showToast('Impossible de trouver la zone à capturer.', 'error', 5000);
      return null;
    }

    const clone = el.cloneNode(true) as HTMLElement;
    clone.style.position = 'absolute';
    clone.style.top = '0';
    clone.style.left = '-9999px';
    clone.style.zIndex = '-10';
    clone.classList.add('dp-capture-clone');

    // Les box-shadow Tailwind sont mal rendues par html2canvas sur mobile (peintes par-dessus
    // l'élément) : on les retire de la COPIE exportée, l'aperçu à l'écran n'est pas touché.
    [clone, ...Array.from(clone.querySelectorAll<HTMLElement>('*'))].forEach((node) =>
      node.style?.setProperty('box-shadow', 'none', 'important'),
    );

    clone.querySelectorAll('img').forEach((img) => {
      img.crossOrigin = 'anonymous';
    });

    document.body.appendChild(clone);
    this.isExporting = true;

    const render = async (scale: number): Promise<Blob | null> => {
      const canvas = await html2canvas(clone, {
        backgroundColor: null,
        useCORS: true,
        width: clone.offsetWidth || undefined,
        height: clone.offsetHeight || undefined,
        scale,
      });
      return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    };

    try {
      let blob: Blob | null = null;
      try {
        blob = await render(2); // qualité nominale (1674 px)
      } catch (e) {
        console.warn('Export x2 impossible, nouvel essai en x1', e);
      }
      return blob ?? (await render(1)); // téléphone limité en mémoire
    } catch (e) {
      console.error('Erreur lors de html2canvas/capture:', e);
      this.showToast('Export impossible sur cet appareil. Réessayez.', 'error', 5000);
      return null;
    } finally {
      this.isExporting = false;
      if (clone.parentNode) document.body.removeChild(clone);
    }
  }

  private toSafeName(baseName: string): string {
    return `${baseName.replace(/\s+/g, '_')}.png`;
  }

  private downloadBlob(blob: Blob, safeName: string) {
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');

    a.href = url;
    a.download = safeName;
    a.style.display = 'none';

    document.body.appendChild(a);

    try {
      if ('download' in HTMLAnchorElement.prototype) {
        a.click();
      } else {
        const opened = window.open(url, '_blank');

        if (!opened) {
          this.showToast(
            'Téléchargement non pris en charge. Ouvrez l’image et enregistrez-la manuellement.',
            'error',
            6000,
          );
        }
      }
    } catch (error) {
      console.error('Erreur de téléchargement :', error);

      this.showToast('Impossible de télécharger cette image sur ce navigateur.', 'error', 5000);
    } finally {
      setTimeout(() => {
        a.remove();
        URL.revokeObjectURL(url);
      }, 60000);
    }
  }

  private async captureElement(elementId: string, fileName: string) {
    const blob = await this.renderToBlob(elementId);
    if (blob) this.downloadBlob(blob, this.toSafeName(fileName));
  }

  private scrollToPreview() {
    const elementId =
      this.activeTab === 'profile' ? 'dp-capture-zone-profile' : 'dp-capture-zone-generator';
    const element = document.getElementById(elementId);
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async captureProfileDP() {
    await this.captureElement('dp-capture-zone-profile', `${this.fullName || 'ma-photo'}-profil`);
    this.scrollToPreview();
  }

  async captureGeneratorDP() {
    await this.captureElement('dp-capture-zone-generator', `${this.fullName || 'mon-dp'}-devfest`);
    this.scrollToPreview();
  }

  async shareCurrentDP() {
    if (this.isSharing()) return;
    this.isSharing.set(true);
    this.sharePanel.set(null);
    try {
      const isProfile = this.activeTab === 'profile';
      const elementId = isProfile ? 'dp-capture-zone-profile' : 'dp-capture-zone-generator';
      const baseName = isProfile
        ? `${this.fullName || 'ma-photo'}-profil`
        : `${this.fullName || 'mon-dp'}-devfest`;

      const blob = await this.renderToBlob(elementId);
      if (!blob) return;

      const file = new File([blob], this.toSafeName(baseName), { type: 'image/png' });

      if (this.shareService.canShareFiles(file)) {
        // Mobile (et desktop compatible) : feuille de partage native avec l'image attachée
        const done = await this.shareService.shareFile(
          file,
          this.eventConfig.fullName,
          this.shareMessage(),
        );
        if (!done) this.sharePanel.set({ file, canNative: true }); // bloqué (iOS) → 2e tap
        return;
      }

      // Desktop sans partage de fichiers : on télécharge l'image et on propose de copier le message
      this.downloadBlob(blob, file.name);
      this.sharePanel.set({ file, canNative: false });
    } finally {
      this.isSharing.set(false);
    }
  }

  async shareFromPanel() {
    const panel = this.sharePanel();
    if (!panel) return;
    const done = await this.shareService.shareFile(
      panel.file,
      this.eventConfig.fullName,
      this.shareMessage(),
    );
    if (done) this.sharePanel.set(null);
  }

  async copyShareMessage() {
    const ok = await this.shareService.copyToClipboard(this.shareMessage());
    this.showToast(
      ok
        ? 'Message copié dans le presse-papier !'
        : 'Copie impossible : sélectionnez le texte et copiez-le.',
      ok ? 'success' : 'error',
    );
  }

  closeSharePanel() {
    this.sharePanel.set(null);
  }

  private showToast(text: string, kind: 'success' | 'error' = 'success', duration = 3000) {
    clearTimeout(this.toastTimer);
    this.toast.set({ text, kind });
    this.toastTimer = setTimeout(() => this.toast.set(null), duration);
  }

  // Preload assets (best-effort)
  private preloadAssets(paths: string[]) {
    paths.forEach((p) => {
      try {
        const img = new Image();
        img.src = p;
        img.decoding = 'async' as any;
      } catch (e) {
        // ignore
      }
    });
  }

  private async prepareImageForCropper(file: File): Promise<string> {
    const MAX_DIM = 1600;

    const canvas = document.createElement('canvas');

    let bitmap: ImageBitmap | null = null;
    let objectUrl: string | null = null;
    let source: CanvasImageSource | null = null;

    let sourceWidth = 0;
    let sourceHeight = 0;

    try {
      // Décodage prioritaire
      if (typeof createImageBitmap === 'function') {
        try {
          bitmap = await createImageBitmap(file);

          source = bitmap;
          sourceWidth = bitmap.width;
          sourceHeight = bitmap.height;
        } catch {
          bitmap = null;
        }
      }

      // Compatibilité avec les anciens navigateurs
      if (!source) {
        objectUrl = URL.createObjectURL(file);

        const image = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();

          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error('Image illisible'));

          img.src = objectUrl!;
        });

        source = image;
        sourceWidth = image.naturalWidth;
        sourceHeight = image.naturalHeight;
      }

      if (!sourceWidth || !sourceHeight) {
        throw new Error('Dimensions de l’image invalides');
      }

      const ratio = Math.min(1, MAX_DIM / Math.max(sourceWidth, sourceHeight));

      const width = Math.max(1, Math.round(sourceWidth * ratio));
      const height = Math.max(1, Math.round(sourceHeight * ratio));

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d', { alpha: false });

      if (!ctx) {
        throw new Error('Canvas 2D indisponible');
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      ctx.drawImage(source, 0, 0, width, height);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (result) => {
            if (result) {
              resolve(result);
            } else {
              reject(new Error('Conversion JPEG impossible'));
            }
          },
          'image/jpeg',
          0.82,
        );
      });

      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Lecture de l’image impossible'));
          }
        };

        reader.onerror = () => reject(new Error('Erreur FileReader'));

        reader.readAsDataURL(blob);
      });
    } finally {
      bitmap?.close();

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }

      canvas.width = 0;
      canvas.height = 0;
    }
  }
  /** Rejoue l'animation d'entrée du visuel (imageVisible → templateVisible). */
  private playEntrance(delay = 50) {
    clearTimeout(this.uiTimer);
    this.uiState = 'imageVisible';
    this.cdr.detectChanges();

    requestAnimationFrame(() => {
      this.uiTimer = setTimeout(() => {
        this.uiState = 'templateVisible';
        this.cdr.detectChanges();
      }, delay);
    });
  }

  /** Garantit que le visuel est complet avant la capture. */
  private ensureTemplateVisible() {
    if (this.previewImage && this.uiState !== 'templateVisible') {
      this.uiState = 'templateVisible';
      this.cdr.detectChanges();
    }
  }

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  openFileInput() {
    if (!this.isFormReadyForUpload) return;
    this.fileInput.nativeElement.click();
  }

  async openCropper(file: File) {
    if (this.isPreparingImage) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    const allowedExtensions = /\.(jpe?g|png|webp)$/i;

    const type = file.type.toLowerCase();

    const validType =
      allowedTypes.includes(type) ||
      ((!type || type === 'application/octet-stream') && allowedExtensions.test(file.name));

    if (!validType) {
      this.showToast('Format non supporté. Utilisez JPG, JPEG, PNG ou WEBP.', 'error', 5000);
      return;
    }

    const MAX_MB = 25;

    if (!file.size) {
      this.showToast('Ce fichier est vide ou illisible.', 'error');
      return;
    }

    if (file.size > MAX_MB * 1024 * 1024) {
      this.showToast(
        `Image trop lourde (${(file.size / (1024 * 1024)).toFixed(1)} Mo). Limite : ${MAX_MB} Mo.`,
        'error',
        5000,
      );
      return;
    }

    this.isPreparingImage = true;
    this.showCropper = false;
    this.tempCroppedImage = null;

    try {
      this.imageBase64 = await this.prepareImageForCropper(file);

      this.showCropper = true;
    } catch (error) {
      console.error('Erreur de préparation de l’image :', error);

      this.imageBase64 = undefined;
      this.showCropper = false;

      this.showToast(
        'Cette image ne peut pas être ouverte sur cet appareil. Essayez une autre photo au format JPG, PNG ou WEBP.',
        'error',
        6000,
      );
    } finally {
      this.isPreparingImage = false;
      this.cdr.detectChanges();
    }
  }
}
