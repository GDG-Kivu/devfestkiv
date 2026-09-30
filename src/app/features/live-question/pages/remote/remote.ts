import { Component, inject } from '@angular/core';
import { FirestoreService } from '../../../../core/firestore/firestore.service';

@Component({
  selector: 'app-remote',
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div class="bg-white shadow-2xl rounded-3xl p-6 w-72 border border-gray-200 space-y-6">
        <!-- HEADER -->
        <div class="text-center">
          <h1 class="text-lg font-bold text-gray-800">DevFestKivu 2025</h1>
          <p class="text-sm text-gray-500">Télécommande Virtuelle</p>
        </div>

        <!-- POWER BUTTON -->
        <div class="flex justify-center">
          <button
            class="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white text-lg font-bold shadow-md active:scale-95 transition"
          >
            ⏻
          </button>
        </div>

        <!-- NAVIGATION -->
        <div class="flex justify-center">
          <div class="grid grid-cols-3 gap-2">
            <button class="bg-gray-200 hover:bg-gray-300 rounded-full p-3">▲</button>
            <div></div>
            <button class="bg-gray-200 hover:bg-gray-300 rounded-full p-3">▼</button>
            <button class="bg-gray-200 hover:bg-gray-300 rounded-full p-3">◀</button>
            <button class="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3">OK</button>
            <button class="bg-gray-200 hover:bg-gray-300 rounded-full p-3">▶</button>
          </div>
        </div>

        <!-- ACTION BUTTONS -->
        <div class="grid grid-cols-3 gap-3">
          <button
            class="bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl py-2 shadow"
            (click)="previous()"
          >
            Slide -
          </button>
          <button
            class="bg-green-500 hover:bg-green-600 text-white rounded-xl py-2 shadow"
            (click)="start()"
          >
            Start
          </button>
          <button
            class="bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl py-2 shadow"
            (click)="next()"
          >
            Slide +
          </button>
        </div>
      </div>
    </div>
  `,
  styles: ``,
})
export default class Remote {
  private fs = inject(FirestoreService);

  next() {
    console.log('Next command sent');
    this.fs.setRemote('next');
  }
  previous() {
    console.log('Previous command sent');
    this.fs.setRemote('previous');
  }
  start() {
    console.log('Start command sent');
    this.fs.setRemote('start');
  }
}
