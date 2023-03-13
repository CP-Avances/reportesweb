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


const routes: Routes = [

  {
    path:'menu',
  component:PagesComponent,
  canActivate: [ AuthGuard ],
  children: [

    {path:'', component:MenuComponent},
    {path:'usuarios', component:UsuariosComponent},
    {path:'evaluacion', component:EvaluacionComponent},
    {path:'atencion', component:AtencionComponent},
    {path:'ocupacion', component:OcupacionComponent},
    //aqui va satisfacciones
    {path:'distestadoturnos', component:DistestadoturnosComponent},
    {path:'ingresoclientes', component:IngresoclientesComponent},
    {path:'atendidosmultiples', component:AtendidosmultiplesComponent},
    {path:'opinion', component:OpinionComponent}
  ]
},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PagesRoutingModule {}
