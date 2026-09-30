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
        loadComponent: () => import('./features/event/pages/home/home'),
      },
      {
        path: 'agenda',
        loadComponent: () => import('./features/event/pages/agenda/agenda'),
      },
      {
        path: 'speakers',
        loadComponent: () => import('./features/event/pages/speakers/speakers'),
      },
      {
        path: 'sponsor',
        loadComponent: () => import('./features/event/pages/sponsors/sponsor'),
      },
      {
        path: 'qa',
        loadComponent: () => import('./features/event/pages/faq/qa'),
      },
      {
        path: 'dp-generator',
        loadComponent: () => import('./features/event/pages/dp-generator/dp-generator'),
      },
    ],
  },
  {
    path: 'live_q',
    loadComponent: () => import('./features/live-question/pages/live-question'),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/live-question/pages/live-home/home'),
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/live-question/pages/admin/admin'),
      },
    ],
  },
  {
    path: 'question-space',
    loadComponent: () =>
      import('./features/live-question/pages/question-space/question-space'),
  },
  {
    path: 'presenter',
    canActivate: [presenterGuard],
    loadComponent: () => import('./features/live-question/pages/presentation/presentation'),
  },
  {
    path: 'remote',
    canActivate: [presenterGuard],
    loadComponent: () => import('./features/live-question/pages/remote/remote'),
  },
  { path: '**', redirectTo: '/' },
];
