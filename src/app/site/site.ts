import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../shared/components/navbar/navbar';
import { Footer } from '../shared/components/footer/footer';

@Component({
  selector: 'app-site',
  imports: [Navbar, Footer, RouterOutlet],
  template: `
    <app-navbar />
    <router-outlet />
    <app-footer />
  `,
  styles: ``,
})
export default class Site {}
