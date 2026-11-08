import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-past-events-gallery',
  templateUrl: 'past-events-gallery.html',
  styleUrl: 'past-events-gallery.css',
})
export default class PastEventsGallery {
  readonly paused = signal(false);
  readonly photos = ['first-4.jpg', 'first-5.jpg', 'second-4.jpg', 'first-2.jpg', 'second-3.jpg', 'second-5.jpg'];
  readonly events = [
    { title: 'DevFest 2022', albumUrl: 'https://photos.app.goo.gl/ZCfvXXRk4FVBUJbG9' },
    { title: 'DevFest Kivu 2023', albumUrl: 'https://photos.app.goo.gl/dLEUDy9VgXA5NMgG6' },
    { title: 'DevFest Kivu 2024', albumUrl: 'https://photos.app.goo.gl/ha4m6AS4LcAAYtm28' },
    { title: 'DevFest Kivu 2025', albumUrl: 'https://photos.app.goo.gl/ZnqAHwBeRQXn7PUS6' },
    { title: 'Build with AI 2024', albumUrl: 'https://photos.app.goo.gl/DCRcgURUK5CN7Y8t9' },
    { title: 'IO Extended 2024', albumUrl: 'https://photos.app.goo.gl/Gkc9Ura9EdvSEHjW6' },
    { title: 'Build with AI 2025', albumUrl: 'https://photos.app.goo.gl/LJ2bcew715Ks3cTu7' },
    { title: 'WTM 2025', albumUrl: 'https://photos.app.goo.gl/Yq5qBLaiXa2KbK6g9' },
    { title: 'Build with AI 2025', albumUrl: 'https://photos.app.goo.gl/1hugBeKNjQHj459h6' },
  ];
}
