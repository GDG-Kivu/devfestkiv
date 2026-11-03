import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// Safely import @google/model-viewer in browser environments to prevent SSR prerender errors
// (ReferenceError: customElements is not defined during Node.js server execution).
if (typeof window !== 'undefined') {
  import('@google/model-viewer');
}

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

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Ensure the @google/model-viewer custom element is registered on the client
      import('@google/model-viewer').catch((err) => {
        console.error('Failed to load @google/model-viewer script:', err);
      });
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

