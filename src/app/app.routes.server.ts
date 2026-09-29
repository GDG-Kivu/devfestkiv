import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'live_q', renderMode: RenderMode.Client },
  { path: 'live_q/admin', renderMode: RenderMode.Client },
  { path: 'question-space', renderMode: RenderMode.Client },
  { path: 'presenter', renderMode: RenderMode.Client },
  { path: 'remote', renderMode: RenderMode.Client },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
