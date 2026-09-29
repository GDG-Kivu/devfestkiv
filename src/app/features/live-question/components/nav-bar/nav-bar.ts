import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { EventConfigService } from '../../../event/services/event-config.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { RoleService } from '../../../../core/auth/role.service';
@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class=" backdrop-blur-sm sticky top-0 z-50 shadow-xs transition-all duration-300">
      <div class="container mx-auto px-4 py-4 max-w-7xl">
        <div class="flex items-center justify-between">
          <!-- Logo -->
          <!-- Logo Section -->
          <div class="flex-shrink-0 flex items-center">
            <a routerLink="/" class="flex items-center space-x-3">
              <img
                src="/assets/logo-1.png"
                alt="DevFest Kivu Logo"
                class="h-8 w-auto sm:h-10 lg:h-10"
              />
            </a>
          </div>

          <div class="flex items-center gap-4">
            <div class="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
              <div class="flex items-center gap-1">
                <!-- Calendar Icon -->
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="size-6"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                  />
                </svg>

                <span
                  >{{ eventConfig.date.display.month }} {{ eventConfig.date.display.year }}</span
                >
              </div>
              <div class="flex items-center gap-1">
                <!-- Map Pin Icon -->
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="size-6"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                  />
                </svg>

                <span>Bukavu, RDC</span>
              </div>
            </div>

            <!-- Bouton Présentateur -->
            @if (roles.isAdmin()) {
              <a routerLink="/live_q">
                <button
                  class="flex items-center gap-2 border border-[#4285F4]/30
                       hover:bg-[#34A853]/10 bg-transparent rounded-sm px-3 py-1.5 text-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="size-6"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                    />
                  </svg>
                  <span class="hidden sm:inline">Accueil</span>
                </button>
              </a>
              <a routerLink="/presenter">
                <button
                  class="flex items-center gap-2 border border-[#4285F4]/30
                       hover:bg-[#4285F4]/10 bg-transparent rounded-sm px-3 py-1.5 text-sm"
                >
                  <!-- Presentation Icon -->
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="size-6"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605"
                    />
                  </svg>

                  <span class="hidden sm:inline">Présenter</span>
                </button>
              </a>
            }

            <!-- Bouton Admin -->
            @if (roles.isAdmin()) {
              <a routerLink="/live_q/admin">
                <button
                  class="flex items-center gap-2 border border-[#EA4335]/30
                       hover:bg-[#EA4335]/10 bg-transparent rounded-sm px-3 py-1.5 text-sm"
                >
                  <!-- Settings Icon -->

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="size-6"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                    />
                  </svg>

                  <span class="hidden sm:inline">Admin</span>
                </button>
              </a>
            }
            @if (auth.user(); as user) {
              <span class="hidden md:inline text-xs text-gray-500">{{
                user.isAnonymous ? 'Invité' : user.displayName || user.email || 'Utilisateur'
              }}</span>
              @if (user.isAnonymous) {
                <button
                  type="button"
                  (click)="signIn()"
                  class="px-3 py-1.5 text-sm border rounded-sm"
                >
                  Se connecter avec Google
                </button>
              }
              <button type="button" (click)="signOut()" class="px-2 py-1.5 text-xs">
                Se déconnecter
              </button>
            } @else {
              <button
                type="button"
                (click)="signIn()"
                class="px-3 py-1.5 text-sm border rounded-sm"
              >
                Se connecter avec Google
              </button>
            }
          </div>
        </div>
      </div>
    </header>
  `,
  styles: ``,
})
export class NavBar {
  readonly auth = inject(AuthService);
  readonly roles = inject(RoleService);
  readonly router = inject(Router);
  eventConfig = inject(EventConfigService);

  async signIn(): Promise<void> {
    try {
      const user = await this.auth.signInWithGoogle();
      if (user) {
        const profile = await this.roles.ensureProfile(user);
        if (profile?.role === 'admin' && profile.disabled !== true) {
          await this.router.navigateByUrl('/live_q/admin');
        }
      }
    } catch {
      // Popup cancellation leaves the current anonymous session intact.
    }
  }

  async signOut(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigateByUrl('/');
  }
}
