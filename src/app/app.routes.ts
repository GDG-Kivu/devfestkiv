import { Routes } from '@angular/router';
import { adminGuard } from './core/auth/guards/admin.guard';
import { presenterGuard } from './core/auth/guards/presenter.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./site/site'),
    children: [
      {
        path: '',
        pathMatch: 'full',
        data: {
          description:
            'Rejoignez le DevFest Kivu 2026 : conférences, ateliers, innovation, networking et technologies Google à Bukavu.',
        },
        loadComponent: () => import('./features/event/pages/home/home'),
      },
      {
        path: 'agenda',
        title: 'Agenda',
        data: {
          description:
            'Le programme complet du DevFest Kivu : sessions, ateliers, horaires et lieu de l’événement.',
        },
        loadComponent: () => import('./features/event/pages/agenda/agenda'),
      },
      {
        path: 'speakers',
        title: 'Speakers',
        data: {
          description:
            'Découvrez les intervenants du DevFest Kivu, experts en IA, mobile, web et cloud.',
        },
        loadComponent: () => import('./features/event/pages/speakers/speakers'),
      },
      {
        path: 'sponsor',
        title: 'Sponsors et partenaires',
        data: {
          description:
            'Les sponsors et partenaires qui soutiennent le DevFest Kivu, et comment devenir partenaire.',
        },
        loadComponent: () => import('./features/event/pages/sponsors/sponsor'),
      },
      {
        path: 'qa',
        title: 'FAQ',
        data: {
          description:
            'Questions fréquentes sur le DevFest Kivu : inscription, programme, accès et organisation.',
        },
        loadComponent: () => import('./features/event/pages/faq/qa'),
      },
      {
        path: 'dp-generator',
        title: 'Générateur de badge',
        data: {
          description:
            'Créez votre photo de profil personnalisée du DevFest Kivu et partagez-la avec votre réseau.',
        },
        loadComponent: () => import('./features/event/pages/dp-generator/dp-generator'),
      },
      {
        path: 'contact',
        title: 'Contact',
        data: {
          description:
            'Contactez l’équipe organisatrice du DevFest Kivu pour toute question ou proposition de partenariat.',
        },

        loadComponent: () => import('./features/event/pages/contact/contact'),
      },
    ],
  },
  {
    path: 'live_q',
    loadComponent: () => import('./features/live-question/pages/live-question'),
    children: [
      {
        path: '',
        title: 'Questions en direct',
        data: {
          description: 'Posez vos questions aux intervenants du DevFest Kivu en temps réel.',
        },
        loadComponent: () => import('./features/live-question/pages/live-home/home'),
      },
      {
        path: 'admin',
        title: 'Administration des questions',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/live-question/pages/admin/admin'),
      },
    ],
  },
  {
    path: 'question-space',
    title: 'Espace questions',
    data: {
      description: 'Posez vos questions aux intervenants du DevFest Kivu en temps réel.',
    },
    loadComponent: () =>
      import('./features/live-question/pages/question-space/question-space'),
  },
  {
    path: 'presenter',
    title: 'Présentation',
    canActivate: [presenterGuard],
    loadComponent: () => import('./features/live-question/pages/presentation/presentation'),
  },
  {
    path: 'remote',
    title: 'Télécommande',
    canActivate: [presenterGuard],
    loadComponent: () => import('./features/live-question/pages/remote/remote'),
  },
  { path: '**', redirectTo: '/' },
];
