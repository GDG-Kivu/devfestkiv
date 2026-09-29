import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventConfig } from '../../../models/event.model';

@Component({
  selector: 'app-generator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './generator.html',
})
export class Generator {
  @Input() fullName: string = '';
  @Input() previewImage: string | ArrayBuffer | null = null;
  @Input() quote: string = '';
  @Input() uiState: 'initial' | 'imageVisible' | 'templateVisible' = 'initial';
  @Input() generatorTheme: 'default' | 'white' = 'default';
  @Input() eventConfig!: EventConfig;
}
