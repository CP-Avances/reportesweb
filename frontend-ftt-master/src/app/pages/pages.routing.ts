import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from '../guards/auth.guard';
import { NgModule } from '@angular/core';
import { DistestadoturnosComponent } from './distestadoturnos/distestadoturnos.component';
import { ConfiguracionComponent } from './configuracion/configuracion.component';
import { EvaluacionComponent } from './evaluacion/evaluacion.component';
import { UsuariosComponent } from './usuarios/usuarios.component';
import { OpinionComponent } from './opinion/opinion.component';
import { PagesComponent } from './pages.component';
import { MenuComponent } from './menu/menu.component';
import { CajerosComponent } from './cajeros/cajeros.component';

const routes: Routes = [

  {
    path: 'menu',
    component: PagesComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', component: MenuComponent, canActivate: [AuthGuard] },
      { path: 'usuarios', component: UsuariosComponent, canActivate: [AuthGuard] },
      { path: 'evaluacion', component: EvaluacionComponent, canActivate: [AuthGuard] },
      { path: 'distestadoturnos', component: DistestadoturnosComponent, canActivate: [AuthGuard] },
      { path: 'configuracion', component: ConfiguracionComponent, canActivate: [AuthGuard] },
      { path: 'opinion', component: OpinionComponent, canActivate: [AuthGuard] },
      { path: 'cajeros', component: CajerosComponent, canActivate: [AuthGuard] },

    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PagesRoutingModule { }
