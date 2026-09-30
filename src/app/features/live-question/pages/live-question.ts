import { Component } from '@angular/core';
import { NavBar } from '../components/toolbar/nav-bar';
import { RouterOutlet } from '@angular/router';
import { Footer } from '../../../shared/components/footer/footer';
@Component({
  selector: 'app-live-question',
  imports: [NavBar, RouterOutlet, Footer],
  template: `
    <app-nav-bar />
    <router-outlet></router-outlet>
    <app-footer />
  `,
  styles: ``,
})
export default class LiveQuestion {}
