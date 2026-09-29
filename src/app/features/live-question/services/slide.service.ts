import { Injectable } from '@angular/core';
import { io } from 'socket.io-client';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SlideService {
  private socket = io('http://localhost:3000');

  // état actuel de la slide dans l'app Angular
  currentSlide$ = new BehaviorSubject<number>(0);

  constructor() {
    // quand le serveur envoie update
    this.socket.on('slide:update', (slideNumber: number) => {
      this.currentSlide$.next(slideNumber);
    });
  }

  nextSlide() {
    this.socket.emit('slide:next');
  }

  prevSlide() {
    this.socket.emit('slide:prev');
  }
}
