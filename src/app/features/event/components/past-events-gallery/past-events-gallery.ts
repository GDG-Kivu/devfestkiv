import { Component, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { EventConfigService } from '../../services/event-config.service';

@Component({
  selector: 'app-past-events-gallery',
  imports: [NgOptimizedImage],
  templateUrl: 'past-events-gallery.html',
  styleUrl: 'past-events-gallery.css',
})
export default class PastEventsGallery {
  private eventConfig = inject(EventConfigService);

  firstRowEvents = this.eventConfig.pastEvents.slice(0, 6);
  secondRowEvents = this.eventConfig.pastEvents.slice(6);
}
