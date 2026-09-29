import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

type QaItem = {
  id: number;
  question: string;
  answer: string;
  category?: 'Logistique' | 'Inscription' | 'Speakers' | 'Technique' | 'Autre';
  tags?: string[];
};

@Component({
  selector: 'app-qa',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './qa.html',
})
export default class QaComponent implements OnInit {
  // Only state we need for now
  openId: number | null = null;

  ngOnInit(): void {
    // Scroll to top when component initializes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  qaItems: QaItem[] = [
    {
      id: 1,
      question: 'Le DevFest Kivu est-il gratuit ?',
      answer:
        'Oui. L’événement est entièrement gratuit et ouvert à tous les amoureux du numérique.',
    },
    {
      id: 2,
      question: 'Dois-je réserver ma place ?',
      answer:
        'Oui. L’accès est gratuit, mais les places sont limitées. Réservez votre place à l’avance pour garantir votre participation.',
    },
    {
      id: 3,
      question: 'Comment m’inscrire ?',
      answer:
        'Il suffit de cliquer sur le bouton RSVP sur la page officielle du DevFest Kivu et de remplir le formulaire d’inscription.',
    },
    {
      id: 4,
      question: 'Je n’ai pas d’ordinateur portable. Puis-je venir ?',
      answer:
        'Oui. Venez comme vous êtes. Ce qui compte, c’est votre envie d’apprendre, de partager et de découvrir.',
    },
    {
      id: 5,
      question: 'Puis-je proposer une session ou un atelier ?',
      answer:
        'Oui. Vous pouvez soumettre votre sujet via le Call for Speakers. Si votre proposition est sélectionnée, vous serez notifié par l’équipe.',
    },
    {
      id: 6,
      question: 'Que vais-je apprendre pendant le DevFest ?',
      answer:
        'Vous explorerez les dernières innovations en web, mobile, IA et cloud. Vous participerez à des conférences, démos et ateliers animés par des experts locaux et internationaux.',
    },
    {
      id: 7,
      question: 'Qui peut participer ?',
      answer:
        'Tout le monde est le bienvenu : étudiants, développeurs, designers, entrepreneurs et passionnés de technologie.',
    },
    {
      id: 8,
      question: 'Où et quand aura lieu l’événement ?',
      answer: 'Le DevFest Kivu se tiendra à l’Hôtel Panorama, de 11h à 17h30.',
    },
    {
      id: 9,
      question: 'J’aimerais devenir sponsor. Comment faire ?',
      answer:
        'Oui, c’est possible. Veuillez remplir le formulaire de sponsoring disponible sur notre site. L’équipe vous contactera rapidement.',
    },
  ];

  // Open only one card at a time
  toggle(id: number) {
    this.openId = this.openId === id ? null : id;
  }

  isOpen(id: number) {
    return this.openId === id;
  }

  // Article click handler: ignore clicks on interactive elements
  onArticleClick(event: MouseEvent, id: number) {
    const target = event.target as HTMLElement;
    if (this.isInteractiveElement(target)) return;
    this.toggle(id);
  }

  // Keyboard handler: Enter/Space on focused article should toggle
  onArticleKeydown(event: KeyboardEvent, id: number) {
    const code = event.key;
    if (code === 'Enter' || code === ' ') {
      event.preventDefault();
      this.toggle(id);
    }
  }

  private isInteractiveElement(el: HTMLElement | null): boolean {
    if (!el) return false;
    const interactive = ['button', 'a', 'input', 'textarea', 'select', 'label'];
    let node: HTMLElement | null = el;
    for (let depth = 0; depth < 6 && node; depth++) {
      if (interactive.includes(node.tagName.toLowerCase())) return true;
      node = node.parentElement;
    }
    return false;
  }

  // Filtered list (no UI for search/filter in this refactor) — keep it simple
  get filtered() {
    return this.qaItems;
  }
}
