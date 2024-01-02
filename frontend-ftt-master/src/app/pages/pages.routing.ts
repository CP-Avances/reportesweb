import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from '../guards/auth.guard';
import { NgModule } from '@angular/core';


import { AtendidosmultiplesComponent } from './atendidosmultiples/atendidosmultiples.component';
import { DistestadoturnosComponent } from './distestadoturnos/distestadoturnos.component';
import { IngresoclientesComponent } from './ingresoclientes/ingresoclientes.component';
import { ConfiguracionComponent } from './configuracion/configuracion.component';
import { EvaluacionComponent } from './evaluacion/evaluacion.component';
import { OcupacionComponent } from './ocupacion/ocupacion.component';
import { UsuariosComponent } from './usuarios/usuarios.component';
import { AtencionComponent } from './atencion/atencion.component';
import { OpinionComponent } from './opinion/opinion.component';
import { PagesComponent } from './pages.component';
import { MenuComponent } from './menu/menu.component';

const routes: Routes = [

  {
    path: 'menu',
    component: PagesComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', component: MenuComponent, canActivate: [AuthGuard] },
      { path: 'usuarios', component: UsuariosComponent, canActivate: [AuthGuard] },
      { path: 'atencion', component: AtencionComponent, canActivate: [AuthGuard] },
      { path: 'ocupacion', component: OcupacionComponent, canActivate: [AuthGuard] },
      { path: 'evaluacion', component: EvaluacionComponent, canActivate: [AuthGuard] },
      { path: 'atendidosmultiples', component: AtendidosmultiplesComponent, canActivate: [AuthGuard] },
      { path: 'distestadoturnos', component: DistestadoturnosComponent, canActivate: [AuthGuard] },
      { path: 'ingresoclientes', component: IngresoclientesComponent, canActivate: [AuthGuard] },
      { path: 'configuracion', component: ConfiguracionComponent, canActivate: [AuthGuard] },
      { path: 'opinion', component: OpinionComponent, canActivate: [AuthGuard] },
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PagesRoutingModule { }
