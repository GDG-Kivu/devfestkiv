import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  inject,
  OnInit,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-tshirt-showcase',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './tshirt-showcase.html',
  styleUrl: './tshirt-showcase.css',
})
export default class TshirtShowcase implements OnInit {
  private platformId = inject(PLATFORM_ID);
  @ViewChild('modelViewer') modelViewerRef?: ElementRef<any>;

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Defer loading of heavy @google/model-viewer script until main thread is idle
      const loadModelViewer = () => {
        import('@google/model-viewer').catch((err) => {
          console.error('Failed to load @google/model-viewer script:', err);
        });
      };

      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(loadModelViewer, { timeout: 3000 });
      } else {
        setTimeout(loadModelViewer, 1000);
      }
    }
  }

  /**
   * Focus the 3D model camera on front or back view when thumbnail is clicked
   */
  setView(orbit: string): void {
    if (this.modelViewerRef?.nativeElement) {
      this.modelViewerRef.nativeElement.cameraOrbit = orbit;
    }
  }

  /**
   * Navigate to the official ticket/merchandise store.
   *
   * DEVELOPER NOTE:
   * When your ticket or merchandise shop link is ready, you can simply uncomment
   * and replace the URL below:
   *
   * Example:
   *   window.open('https://gdg.community.dev/events/.../tickets', '_blank');
   * or inject Router and navigate:
   *   this.router.navigate(['/tickets']);
   */
  navigateToOrder(): void {
    // TODO: Add your ticketing or merchandise URL here:
    // window.open('https://votre-billetterie.com', '_blank');
    console.log('Navigate to DevFest Kivu official T-shirt order page');
  }
}
