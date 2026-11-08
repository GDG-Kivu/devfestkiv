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
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-tshirt-showcase',
  standalone: true,
  imports: [RouterLink],
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
      // Suppress noisy Lit development-only diagnostic warnings in the console
      const globalObj = window as any;
      globalObj.litIssuedWarnings ??= new Set();
      globalObj.litIssuedWarnings.add('dev-mode');
      globalObj.litIssuedWarnings.add('change-in-update');

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

}
