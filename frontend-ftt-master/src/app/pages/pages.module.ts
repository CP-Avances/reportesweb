import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgxPaginationModule } from 'ngx-pagination';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AppRoutingModule } from '../app-routing.module';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { FormsModule } from '@angular/forms';

import { DistestadoturnosComponent } from './distestadoturnos/distestadoturnos.component';
import { ConfiguracionComponent } from './configuracion/configuracion.component';
import { EvaluacionComponent } from './evaluacion/evaluacion.component';
import { UsuariosComponent } from './usuarios/usuarios.component';
import { OpinionComponent } from './opinion/opinion.component';
import { PagesComponent } from './pages.component';
import { MenuComponent } from './menu/menu.component';
import { CajerosComponent } from './cajeros/cajeros.component';

@NgModule({
  declarations: [
    MenuComponent,
    UsuariosComponent,
    EvaluacionComponent,
    DistestadoturnosComponent,
    PagesComponent,
    OpinionComponent,
    ConfiguracionComponent,
    CajerosComponent,
  ],
  exports: [
    MenuComponent,
    UsuariosComponent,
    EvaluacionComponent,
    DistestadoturnosComponent,
    PagesComponent,
    OpinionComponent,
    ConfiguracionComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    AppRoutingModule,
    NgxPaginationModule,
    NgSelectModule,
    FormsModule,
    MatSelectModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
  ],
  schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
})
export class PagesModule { }
