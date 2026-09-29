import { Routes } from '@angular/router';
import { adminGuard } from './core/auth/admin.guard';
import { authGuard } from './core/auth/auth.guard';

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
        loadComponent: () => import('./features/cms/pages/speakers/speakers'),
      },
      {
        path: 'sponsor',
        loadComponent: () => import('./features/cms/pages/sponsors/sponsor'),
      },
      {
        path: 'qa',
        loadComponent: () => import('./features/cms/pages/faq/qa'),
      },
      {
        path: 'dp-generator',
        loadComponent: () => import('./features/event/pages/dp-generator/dp-generator'),
      },
    ],
  },
  {
    path: 'live_q',
    loadComponent: () => import('./features/live-question/live-question'),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/live-question/pages/live-home/home'),
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/live-question/components/admin/admin'),
      },
    ],
  },
  {
    path: 'question-space',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/live-question/components/question-space/question-space'),
  },
  {
    path: 'presenter',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./features/live-question/components/presentation/presentation'),
  },
  {
    path: 'remote',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./features/live-question/remote/remote'),
  },
  { path: '**', redirectTo: '/' },
];
