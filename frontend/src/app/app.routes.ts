import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'lobby/:codigo',
    loadComponent: () => import('./lobby/lobby.component').then(m => m.LobbyComponent),
  },
  {
    path: 'tablero/:codigo',
    loadComponent: () => import('./arena/arena.component').then(m => m.ArenaComponent),
  },
  { path: 'arena/:codigo', redirectTo: 'tablero/:codigo' },
  { path: '**', redirectTo: '' },
];