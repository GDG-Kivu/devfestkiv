import { Injectable } from '@angular/core';


@Injectable({ providedIn: 'root' })
export class ShareService {
  /** L'appareil sait-il partager ce fichier via la feuille de partage native ? */
  canShareFiles(file: File): boolean {
    if (
      typeof navigator === 'undefined' ||
      typeof navigator.share !== 'function' ||
      typeof navigator.canShare !== 'function'
    ) {
      return false;
    }
    try {
      return navigator.canShare({ files: [file] });
    } catch {
      return false;
    }
  }

  async shareUrl(title: string, text: string, url: string): Promise<boolean> {
    if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return false;
    return this.run(() => navigator.share({ title, text, url }));
  }

  async shareFile(file: File, title: string, text: string): Promise<boolean> {
    if (!this.canShareFiles(file)) return false;
    return this.run(() => navigator.share({ files: [file], title, text }));
  }

  /** `false` si le presse-papier est indisponible (HTTP, permission refusée…) : à l'appelant d'afficher son fallback. */
  async copyToClipboard(text: string): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) return false;
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  private async run(action: () => Promise<void>): Promise<boolean> {
    try {
      await action();
      return true;
    } catch (err) {
      // Feuille de partage fermée par l'utilisateur : ce n'est pas une erreur
      if (err instanceof DOMException && err.name === 'AbortError') return true;
      console.warn('Partage natif indisponible ou bloqué:', err);
      return false;
    }
  }
}
