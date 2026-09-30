import { CommonModule } from '@angular/common';
import { Component, HostListener, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-questions-slides',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div
      class="relative mx-auto mt-8 p-6 rounded-2xl overflow-hidden shadow-2xl
         transition-all duration-700 ease-in-out w-4/5 min-h-[95vh] bg-white"
    >
      <img
        src="assets/logo-1.png"
        class="w-30 max-w-full"
        alt="Logo"
        class="absolute top-30 left-1/2 transform -translate-x-1/2 w-50 pointer-events-none z-50 "
      />
      <!-- Bordure top indépendante -->
      <img
        src="assets/top.png"
        class="absolute top-0 left-1/2 transform -translate-x-1/2 w-full pointer-events-none z-50 opacity-30"
        alt="bordure décorative top"
      />

      <!-- Bordure bottom indépendante -->
      <img
        src="assets/bottom.png"
        class="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full pointer-events-none z-50 opacity-30"
        alt="bordure décorative bottom"
      />
      <!-- Zone des cartes -->
      <div
        class="relative h-full flex items-center justify-center overflow-visible perspective-1000"
      >
        @if (questions.length > 0) {
          <div
            *ngFor="let q of questions; let i = index"
            class="absolute w-[90%] transition-all duration-700 ease-in-out transform origin-center rounded-xl"
            [ngStyle]="{
              'z-index': questions.length - i,
              transform: getTransform(i),
              opacity: i < currentIndex - 2 ? 0 : 1,
              'background-color': cardColors[i],
            }"
          >
            <div
              class="bg-white/90 backdrop-blur-md rounded-xl shadow-2xl p-8 text-center border border-gray-200"
            >
              <!-- Index de la question -->
              <!-- <span
              [ngStyle]="{
                color: cardColors[i]
              }"
              class="rounded-full flex items-center justify-center w-14 h-14 bg-white text-white
                 font-bold text-2xl border-[4px] border-t-[#4285F4] border-r-[#DB4437]
                 border-b-[#F4B400] border-l-[#0F9D58] mb-4 mx-auto"
            >
              {{ i + 1 }}
            </span> -->
              <div class="flex items-center justify-center gap-10 ">
                <!-- Bouton précédent -->
                <!-- <button
                (click)="prevSlide()"
                [disabled]="currentIndex === 0"
                class="px-6 py-3 text-lg font-semibold text-white bg-[#4285F4] rounded-lg shadow hover:bg-[#3367D6] transition disabled:opacity-40"
              >
                ◀
              </button> -->

                <!-- Champ d'index -->
                <input
                  type="number"
                  [(ngModel)]="inputIndex"
                  (keyup.enter)="inputIndex !== null && goToSlide(inputIndex - 1)"
                  class="w-24 text-center text-2xl font-bold p-3 rounded-lg border-4 border-t-[#4285F4] border-r-[#DB4437] border-b-[#F4B400] border-l-[#0F9D58] shadow-md focus:outline-none"
                  [min]="1"
                  [max]="questions.length"
                  placeholder="{{ currentIndex + 1 }}"
                />

                <!-- Bouton suivant -->
                <!-- <button
                (click)="nextSlide()"
                [disabled]="currentIndex === questions.length - 1"
                class="px-6 py-3 text-lg font-semibold text-white bg-[#0F9D58] rounded-lg shadow hover:bg-[#0C7A43] transition disabled:opacity-40"
              >
                ▶
              </button> -->
              </div>
              <br />

              <!-- Question avec apostrophes stylées -->
              <p class="text-3xl font-bold text-gray-900 leading-snug">
                <span class="text-[#4285F4]">'</span>
                {{ q.contenu }}
                <span class="text-[#0F9D58]">'</span>
              </p>

              <!-- Date/heure -->
              <span class="text-lg text-gray-700 italic mt-4 block">
                {{ q.time | date: 'medium' }}
              </span>
              <br />
              <p class="text-lg font-bold mb-1">
                Live Question : <span class="font-extrabold">{{ session.theme }}</span>
              </p>
              <p class="text-md">Speaker : {{ session.speaker }}</p>
            </div>
          </div>
        } @else {
          <div
            class="absolute w-[90%] transition-all duration-700 ease-in-out transform origin-center rounded-xl top-60"
          >
            <div
              class="bg-white/90 backdrop-blur-md rounded-xl shadow-2xl p-8 text-center border border-gray-200"
            >
              <div class="flex items-center justify-center gap-10  flex-col ">
                <!-- Question avec apostrophes stylées -->
                <p class="text-3xl font-bold text-gray-900 leading-snug">Aucune question</p>
                <img src="assets/illustrations/dot.png" alt="" class="w-20" />
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Navigation -->
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .perspective-1000 {
        perspective: 1000px;
      }

      /* Effet d’apparition fluide */
      @keyframes cardPop {
        0% {
          transform: scale(0.9) translateY(10px);
          opacity: 0;
        }
        100% {
          transform: scale(1) translateY(0);
          opacity: 1;
        }
      }

      div[ngStyle*='transform'] {
        animation: cardPop 0.6s ease-out;
      }
    `,
  ],
})
export class QuestionsSlides {
  @Input() session!: any;
  questions: any[] = [];
  googleColors = ['#4285F4', '#DB4437', '#F4B400', '#34a853'];
  cardColors: string[] = [];
  currentIndex = 0;
  constructor() {
    this.assignRandomColors();
  }

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    if (this.session != null) {
      this.questions = this.session.questions;
      this.assignRandomColors();
    }
    console.log(this.session);
  }
  inputIndex: number | null = null;

  goToSlide(index: number) {
    if (index >= 0 && index < this.questions.length) {
      this.currentIndex = index;
      this.inputIndex = null; // Réinitialiser le champ après navigation
    }
  }

  nextSlide() {
    console.log('click');
    if (this.currentIndex < this.questions.length - 1) {
      this.currentIndex++;
    }
  }

  assignRandomColors() {
    this.cardColors = this.questions.map(
      () => this.googleColors[Math.floor(Math.random() * this.googleColors.length)],
    );
  }

  prevSlide() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
  }
  /** Navigation via touches fléchées */
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'ArrowRight') {
      console.log('atta');
      this.nextSlide();
    } else if (event.key === 'ArrowLeft') {
      this.prevSlide();
    }
  }

  /** Gère la position et la profondeur des cartes type “push” */
  getTransform(index: number): string {
    const diff = index - this.currentIndex;

    if (diff === 0) {
      // Carte active : grande et centrée
      return 'translateY(350px) scale(1)';
    } else if (diff < 0) {
      // Cartes passées : pousser vers le bas et réduire
      const translateY = 1000; // complètement en dessous
      const scale = 0.8; // réduite
      return `translateY(${translateY}px) scale(${scale})`;
    } else {
      // Cartes suivantes : légèrement derrière, réduites
      const translateY = 330; // un petit décalage sous la carte active
      const scale = 0.9;
      return `translateY(${translateY}px) scale(${scale})`;
    }
  }
}
