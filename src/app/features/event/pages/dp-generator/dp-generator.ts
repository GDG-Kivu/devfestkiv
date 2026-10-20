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
import { AuthService } from '../../../../core/auth/services/auth.service';
import { RoleService } from '../../../../core/auth/services/role.service';
import {
  ROLE_LIST,
  ROLE_META,
  ParticipantRole,
  DpTemplate,
} from '../../models/participant-role.model';
import { DpTemplateConfig } from '../../models/event.model';

@Component({
  selector: 'app-dp-generator',
  imports: [CommonModule, FormsModule, Profil, Generator, ImageCropperComponent],
  templateUrl: './dp-generator.html',
})
export default class DpGenerator implements OnInit, OnDestroy {
  eventConfig = inject(EventConfigService);
  roleService = inject(RoleService);
  authService = inject(AuthService);

  readonly roles = ROLE_LIST;
  readonly roleMeta = ROLE_META;

  selectedRole = signal<ParticipantRole>('attendee');
  selectedTemplate = signal<DpTemplate>('classic');

  // Modal de connexion pour rôles réservés
  showAuthModal = signal(false);
  pendingRole = signal<ParticipantRole | null>(null);
  isLoggingIn = signal(false);
  authError = signal<string | null>(null);

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

  private checkIsMobile() {
    this.isMobile = typeof window !== 'undefined' ? window.innerWidth <= 768 : false;

    if (this.isMobile && typeof window !== 'undefined') {
      const availableWidth = Math.min(window.innerWidth - 32, 420);
      // Sur mobile, l'overlay a un header (~45px) et les contrôles/inputs (~210px), plus les marges (~40px)
      // La hauteur maximale allouée pour le canvas d'aperçu est d'environ 38vh à 42vh
      const maxCanvasHeight = Math.max(180, window.innerHeight * 0.38);
      const scaleByWidth = availableWidth / 837;
      const scaleByHeight = maxCanvasHeight / 837;
      // On prend le min pour que le canvas ET les contrôles tiennent sur l'écran sans masquer les boutons
      this.mobileScale = Math.min(scaleByWidth, scaleByHeight);
    } else {
      this.mobileScale = 1;
    }
  }

  // Body scroll helpers
  private preventBodyScroll() {
    try {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.touchAction = 'none';
    } catch (e) {
      // silent
    }
  }

  private restoreBodyScroll() {
    try {
      document.body.style.overflow = '';
      document.documentElement.style.touchAction = '';
    } catch (e) {
      // silent
    }
  }

  openMobileOverlay() {
    this.showOverlay = true;
    this.showPreviewOverlay = true;
    this.preventBodyScroll();
  }

  closeMobileOverlay() {
    this.showOverlay = false;
    this.showPreviewOverlay = false;
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
    if (this.previewImage) {
      this.uiState = 'imageVisible';
      setTimeout(() => (this.uiState = 'templateVisible'), 10);
    } else {
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
      this.pendingRole.set(role);
      this.authError.set(null);
      this.showAuthModal.set(true);
      return;
    }
    this.selectedRole.set(role);
  }

  closeAuthModal() {
    this.showAuthModal.set(false);
    this.pendingRole.set(null);
    this.authError.set(null);
  }

  async loginWithGoogle() {
    if (this.isLoggingIn()) return;
    this.isLoggingIn.set(true);
    this.authError.set(null);

    try {
      const user = await this.authService.signInWithGoogle();
      if (user) {
        // Laisser à RoleService le temps de synchroniser le profil
        await this.roleService.ensureProfile(user);
        if (this.roleService.isAdmin()) {
          const roleToApply = this.pendingRole();
          if (roleToApply) {
            this.selectedRole.set(roleToApply);
          }
          this.closeAuthModal();
        } else {
          this.authError.set(
            "Ce compte est connecté mais ne dispose pas des privilèges organisateur requis pour ce badge.",
          );
        }
      }
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        this.authError.set(err?.message || 'Erreur lors de la connexion.');
      }
    } finally {
      this.isLoggingIn.set(false);
    }
  }

  setTemplate(t: DpTemplate) {
    // nom, photo, citation et rôle vivent dans ce composant : rien n'est perdu
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
    if (file && file.type.startsWith('image/')) {
      this.openCropper(file);
    }
  }

  openFileInput() {
    if (!this.isFormReadyForUpload) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) this.openCropper(file);
    };
    input.click();
  }

  // Cropper
  openCropper(file: File) {
    const MAX_MB = 5;
    if (file.size > MAX_MB * 1024 * 1024) {
      alert(
        `Image trop grosse (${(file.size / (1024 * 1024)).toFixed(1)}MB). Limite: ${MAX_MB}MB.`,
      );
      return;
    }
    if (!file.type.startsWith('image/')) {
      alert('Fichier non supporté. Choisissez une image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.imageBase64 = reader.result as string;
      this.showCropper = true;
      this.tempCroppedImage = null;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  onImageCropped(event: ImageCroppedEvent) {
    this.tempCroppedImage = event.base64 ?? null;
    this.cdr.detectChanges();
  }

  confirmCrop() {
    if (this.tempCroppedImage) {
      this.previewImage = this.tempCroppedImage;

      this.uiState = 'imageVisible';
      this.cdr.detectChanges();

      requestAnimationFrame(() => {
        setTimeout(() => {
          this.uiState = 'templateVisible';
          this.cdr.detectChanges();
        }, 50);
      });

      if (this.isMobile) {
        this.openMobileOverlay();
      }
    }
    this.showCropper = false;
    this.tempCroppedImage = null;
  }

  imageCropperCancelled() {
    this.showCropper = false;
    this.tempCroppedImage = null;
  }

  suggestQuote() {
    const fromConfig = this.dpConfig()?.suggestedQuotes;
    const list = fromConfig?.length ? fromConfig : this.suggestedQuotes;
    this.quote = list[this.quoteIndex % list.length];
    this.quoteIndex = (this.quoteIndex + 1) % list.length;
  }

  // Capture & Download
  private async captureElement(elementId: string, fileName: string) {
    const elById = document.getElementById(elementId);
    const elByData = document.querySelector(
      `[data-capture-zone="${elementId}"]`,
    ) as HTMLElement | null;
    const el =
      elById || elByData || (document.querySelector(`#${elementId}`) as HTMLElement | null);

    if (!el) {
      console.error(`Élément ${elementId} introuvable`);
      alert('Impossible de trouver la zone à capturer.');
      return;
    }

    const clone = el.cloneNode(true) as HTMLElement;
    clone.style.position = 'absolute';
    clone.style.top = '0';
    clone.style.left = '-9999px';
    clone.style.zIndex = '-10';
    clone.classList.add('dp-capture-clone');

    const imgs = clone.querySelectorAll('img') as NodeListOf<HTMLImageElement>;
    imgs.forEach((img) => {
      try {
        img.crossOrigin = 'anonymous';
      } catch (e) {
        // ignore
      }
    });

    document.body.appendChild(clone);
    this.isExporting = true;
    try {
      const canvas = await html2canvas(clone, {
        backgroundColor: null,
        useCORS: true,
        width: clone.offsetWidth || undefined,
        height: clone.offsetHeight || undefined,
        scale: 2,
      });

      await new Promise<void>((resolve) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            console.error('Échec de la conversion du canvas en blob');
            resolve();
            return;
          }

          const safeName = `${fileName.replace(/\s+/g, '_')}.png`;
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = safeName;
          a.rel = 'noopener noreferrer';
          document.body.appendChild(a);

          try {
            a.click();
          } catch (err) {
            const opened = window.open(url, '_blank', 'noopener,noreferrer');
            if (!opened) {
              alert(
                'Impossible de lancer le téléchargement automatiquement. Désactivez le bloqueur de pop-ups et essayez à nouveau.',
              );
            }
          } finally {
            setTimeout(() => {
              try {
                document.body.removeChild(a);
              } catch (e) {}
              URL.revokeObjectURL(url);
            }, 1500);
            resolve();
          }
        }, 'image/png');
      });
    } catch (e) {
      console.error('Erreur lors de html2canvas/capture:', e);
      alert(
        'Une erreur est survenue lors de l’exportation. Vérifiez la console pour plus d’infos.',
      );
    } finally {
      this.isExporting = false;
      if (clone.parentNode) document.body.removeChild(clone);
    }
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
}