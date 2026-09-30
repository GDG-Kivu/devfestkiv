import { Component } from '@angular/core';
import { NavBar } from '../components/toolbar/nav-bar';
import { RouterOutlet } from '@angular/router';
import { Footer } from '../../../shared/components/footer/footer';

@Component({
  selector: 'app-live-question',
  imports: [NavBar, RouterOutlet, Footer],
  template: `
    <app-nav-bar />
    <main class="lq-main">
      <router-outlet />
    </main>
    <app-footer />
  `,
  styles: `
    :host {
      display: block;
      overflow-x: hidden;
      width: 100%;
      max-width: 100vw;
    }
    .lq-main {
      min-height: calc(100dvh - 64px);
      width: 100%;
      overflow-x: hidden;
    }
  `,
})
export default class LiveQuestion {}

