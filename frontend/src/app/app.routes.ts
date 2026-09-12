import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LobbyComponent } from './lobby/lobby.component';
import { ArenaComponent } from './arena/arena.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'lobby/:codigo', component: LobbyComponent },
  { path: 'arena/:codigo', component: ArenaComponent },
  { path: '**', redirectTo: '' },
];