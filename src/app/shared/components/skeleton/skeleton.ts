import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Skeleton loading component.
 * Usage:
 *   <app-skeleton variant="questions" [count]="3" />
 *   <app-skeleton variant="sessions" [count]="4" />
 *   <app-skeleton variant="card" [count]="6" />
 */
@Component({
  selector: 'app-skeleton',
  imports: [CommonModule],
  template: `
    <!-- Question list skeleton (vertical cards) -->
    @if (variant === 'questions') {
      <div class="space-y-3 animate-pulse" aria-busy="true" aria-label="Chargement des questions...">
        @for (i of items; track i) {
          <div class="bg-white rounded-xl border border-gray-100 p-4 shadow-2xs">
            <div class="flex items-center gap-2 mb-3">
              <div class="w-2 h-2 rounded-full bg-gray-200"></div>
              <div class="h-3 bg-gray-200 rounded w-24"></div>
            </div>
            <div class="space-y-2">
              <div class="h-3.5 bg-gray-200 rounded w-full"></div>
              <div class="h-3.5 bg-gray-200 rounded w-4/5"></div>
              <div class="h-3.5 bg-gray-100 rounded w-3/5"></div>
            </div>
            <div class="flex justify-between items-center mt-3">
              <div class="h-2.5 bg-gray-100 rounded w-16"></div>
            </div>
          </div>
        }
      </div>
    }

    <!-- Session sidebar list skeleton -->
    @if (variant === 'sessions') {
      <div class="space-y-2 p-3 animate-pulse" aria-busy="true" aria-label="Chargement des sessions...">
        @for (i of items; track i) {
          <div class="px-4 py-4 rounded-xl bg-gray-50 border border-gray-100">
            <div class="flex items-center justify-between">
              <div class="flex-1 space-y-2">
                <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                <div class="h-3 bg-gray-100 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        }
      </div>
    }

    <!-- Admin session cards skeleton (grid) -->
    @if (variant === 'card') {
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse" aria-busy="true" aria-label="Chargement des sessions...">
        @for (i of items; track i) {
          <div class="relative rounded-xl overflow-hidden shadow-sm border border-gray-200 min-h-[300px] bg-white">
            <div class="absolute inset-0 bg-gray-50"></div>
            <div class="relative z-10 p-6 flex flex-col justify-between min-h-[300px]">
              <!-- Header row -->
              <div>
                <div class="flex items-start justify-between mb-4">
                  <div class="h-5 w-20 bg-gray-200 rounded-full"></div>
                  <div class="h-3 w-12 bg-gray-100 rounded"></div>
                </div>
                <!-- Theme title -->
                <div class="space-y-2 mb-4">
                  <div class="h-6 bg-gray-200 rounded w-4/5"></div>
                  <div class="h-6 bg-gray-200 rounded w-2/3"></div>
                </div>
                <!-- Speaker -->
                <div class="flex items-center gap-2 mb-3">
                  <div class="w-4 h-4 bg-gray-200 rounded-full"></div>
                  <div class="h-3 bg-gray-200 rounded w-28"></div>
                </div>
                <div class="h-3 bg-gray-100 rounded w-20"></div>
              </div>
              <!-- Description -->
              <div class="space-y-1.5 my-4">
                <div class="h-3 bg-gray-100 rounded w-full"></div>
                <div class="h-3 bg-gray-100 rounded w-5/6"></div>
                <div class="h-3 bg-gray-100 rounded w-3/4"></div>
              </div>
              <!-- Footer -->
              <div class="border-t border-gray-200 pt-3 space-y-3">
                <div class="flex justify-between">
                  <div class="h-3 bg-gray-200 rounded w-24"></div>
                  <div class="h-5 w-12 bg-gray-200 rounded-full"></div>
                </div>
                <div class="border-t border-gray-100 pt-3 flex gap-2">
                  <div class="h-7 w-12 bg-gray-200 rounded-lg"></div>
                  <div class="h-7 w-16 bg-gray-200 rounded-lg"></div>
                  <div class="h-7 w-20 bg-gray-200 rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class Skeleton {
  /** Visual variant: 'questions' | 'sessions' | 'card' */
  @Input() variant: 'questions' | 'sessions' | 'card' = 'questions';
  /** Number of skeleton items to display */
  @Input() count: number = 3;

  get items(): number[] {
    return Array.from({ length: this.count }, (_, i) => i);
  }
}
