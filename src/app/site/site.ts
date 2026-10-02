import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../shared/components/navbar/navbar';
import { Footer } from '../shared/components/footer/footer';

@Component({
  selector: 'app-site',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Navbar, Footer, RouterOutlet],
  template: `
    <app-navbar />
    <main class="site-main">
      <router-outlet />
    </main>
    <app-footer />
  `,
  styles: `
    .site-main {
      min-height: calc(100dvh - 64px);
    }
  `,
})
export default class Site {}
