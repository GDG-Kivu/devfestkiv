import { Routes } from '@angular/router';
import { adminGuard } from './core/auth/admin.guard';
import { presenterGuard } from './core/auth/presenter.guard';

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
    loadComponent: () =>
      import('./features/live-question/components/question-space/question-space'),
  },
  {
    path: 'presenter',
    canActivate: [presenterGuard],
    loadComponent: () => import('./features/live-question/components/presentation/presentation'),
  },
  {
    path: 'remote',
    canActivate: [presenterGuard],
    loadComponent: () => import('./features/live-question/remote/remote'),
  },
  { path: '**', redirectTo: '/' },
];
