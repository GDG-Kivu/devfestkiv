import { Component, Input } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule, NgClass],
  templateUrl: './profil.html',
})
export class Profil {
  @Input() fullName: string = '';
  @Input() previewImage: string | ArrayBuffer | null = null;
  @Input() uiState: 'initial' | 'imageVisible' | 'templateVisible' = 'initial';
  @Input() profileTheme: 'yellow' | 'blue' | 'green' | 'red' = 'yellow';
  @Input() profileStyle: 'classic' | 'minimalist' = 'classic';

  
}
