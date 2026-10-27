import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { EventConfigService } from '../../features/event/services/event-config.service';

const SITE_URL = 'https://www.devfestkivu.site';
const DEFAULT_DESCRIPTION =
  'Rejoignez le DevFest Kivu : conférences, ateliers, innovation, networking et technologies Google à Bukavu.';

@Injectable({ providedIn: 'root' })
export class AppTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private readonly eventConfig = inject(EventConfigService);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const brand = `DevFest Kivu ${this.eventConfig.year}`;
    const pageTitle = this.buildTitle(snapshot);
    const fullTitle = pageTitle
      ? `${pageTitle} | ${brand}`
      : `${brand} | L'événement tech incontournable`;

    let route = snapshot.root;
    while (route.firstChild) route = route.firstChild;
    const description: string = route.data['description'] ?? DEFAULT_DESCRIPTION;
    const noindex: boolean = route.data['noindex'] === true;

    const path = snapshot.url.split(/[?#]/)[0];
    const url = `${SITE_URL}${path}`;

    this.title.setTitle(fullTitle);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({
      name: 'robots',
      content: noindex ? 'noindex, nofollow' : 'index, follow',
    });

    this.meta.updateTag({ property: 'og:title', content: fullTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: url });

    this.meta.updateTag({ name: 'twitter:title', content: fullTitle });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:url', content: url });

    this.setCanonical(url);
  }

  private setCanonical(url: string): void {
    let link = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}