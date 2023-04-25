import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { PagesComponent } from './pages.component';
import { MenuComponent } from './menu/menu.component';
import { UsuariosComponent } from './usuarios/usuarios.component';
import { EvaluacionComponent } from './evaluacion/evaluacion.component';
import { AtencionComponent } from './atencion/atencion.component';
import { OcupacionComponent } from './ocupacion/ocupacion.component';
import { DistestadoturnosComponent } from './distestadoturnos/distestadoturnos.component';
import { IngresoclientesComponent } from './ingresoclientes/ingresoclientes.component';
import { AtendidosmultiplesComponent } from './atendidosmultiples/atendidosmultiples.component';
import { AuthGuard } from '../guards/auth.guard';
import { OpinionComponent } from './opinion/opinion.component';
import { ConfiguracionComponent } from './configuracion/configuracion.component';


const routes: Routes = [

  {
    path:'menu',
  component:PagesComponent,
  canActivate: [ AuthGuard ],
  children: [

    {path:'', component:MenuComponent, canActivate: [ AuthGuard ]},
    {path:'usuarios', component:UsuariosComponent, canActivate: [ AuthGuard ]},
    {path:'evaluacion', component:EvaluacionComponent, canActivate: [ AuthGuard ]},
    {path:'atencion', component:AtencionComponent, canActivate: [ AuthGuard ]},
    {path:'ocupacion', component:OcupacionComponent, canActivate: [ AuthGuard ]},
    //aqui va satisfacciones
    {path:'distestadoturnos', component:DistestadoturnosComponent, canActivate: [ AuthGuard ]},
    {path:'ingresoclientes', component:IngresoclientesComponent, canActivate: [ AuthGuard ]},
    {path:'atendidosmultiples', component:AtendidosmultiplesComponent, canActivate: [ AuthGuard ]},
    {path:'opinion', component:OpinionComponent, canActivate: [ AuthGuard ]},
    {path: 'configuracion', component: ConfiguracionComponent, canActivate: [ AuthGuard ]}
  ]
},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PagesRoutingModule {}
