import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuComponent } from './menu/menu.component';
import { PagesComponent } from './pages.component';
import { UsuariosComponent } from './usuarios/usuarios.component';
import { AtencionComponent } from './atencion/atencion.component';
import { EvaluacionComponent } from './evaluacion/evaluacion.component';
import { OcupacionComponent } from './ocupacion/ocupacion.component';
import { DistestadoturnosComponent } from './distestadoturnos/distestadoturnos.component';
import { IngresoclientesComponent } from './ingresoclientes/ingresoclientes.component';
import { AtendidosmultiplesComponent } from './atendidosmultiples/atendidosmultiples.component';
import { SharedModule } from '../shared/shared.module';
import { AppRoutingModule } from '../app-routing.module';

import { NgxPaginationModule } from 'ngx-pagination';
import { OpinionComponent } from './opinion/opinion.component';
import { ConfiguracionComponent } from './configuracion/configuracion.component';

@NgModule({
  declarations: [
    MenuComponent,
    UsuariosComponent,
    AtencionComponent,
    EvaluacionComponent,
    OcupacionComponent,
    DistestadoturnosComponent,
    IngresoclientesComponent,
    AtendidosmultiplesComponent,
    PagesComponent,
    OpinionComponent,
    ConfiguracionComponent,
  ],
  exports: [
    MenuComponent,
    UsuariosComponent,
    AtencionComponent,
    EvaluacionComponent,
    OcupacionComponent,
    DistestadoturnosComponent,
    IngresoclientesComponent,
    AtendidosmultiplesComponent,
    PagesComponent,
    OpinionComponent,
    ConfiguracionComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    AppRoutingModule,
    NgxPaginationModule
  ]
})
export class PagesModule { }
