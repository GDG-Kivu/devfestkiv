import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../shared/components/navbar/navbar';
import { Footer } from '../shared/components/footer/footer';

@Component({
  selector: 'app-site',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Navbar, Footer, RouterOutlet],
  template: `
    <a href="#main-content" class="skip-link">Aller au contenu principal</a>
    <app-navbar />
    <main id="main-content" tabindex="-1" class="site-main">
      <router-outlet />
    </main>
    <app-footer />
  `,
  styles: `
    .site-main {
      min-height: calc(100dvh - 64px);
    }
    .skip-link {
    position: absolute;
    left: 0.5rem;
    top: -4rem;
    z-index: 100;
    padding: 0.5rem 1rem;
    background: #1a1a1a;
    color: #fff;
    border-radius: 0.5rem;
    }
    .skip-link:focus {
    top: 0.5rem;
    }
  `,
})
export default class Site {}
