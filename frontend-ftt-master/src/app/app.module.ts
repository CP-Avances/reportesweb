import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgChartsModule } from 'ng2-charts';
import { DpDatePickerModule } from 'ng2-date-picker';//usando esta libreria

///////////Paginacion//////////
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { FilterPipe } from './pipes/filter.pipe';
import { PagesModule } from './pages/pages.module';
import { AuthModule } from './auth/auth.module';
import { DatePipe } from '@angular/common';
//////////Mostrar numeros en graficos
import { Chart } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
Chart.register(ChartDataLabels);
import { ToastrModule } from 'ngx-toastr';
import {BrowserAnimationsModule} from '@Angular/platform-browser/animations';

@NgModule({
  declarations: [
    AppComponent,
    FilterPipe,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    NgChartsModule,
    FormsModule,
    DpDatePickerModule,
    PagesModule,
    AuthModule,
    ToastrModule.forRoot(),
  ],
  providers: [
    DatePipe,
    { provide: LocationStrategy, useClass: HashLocationStrategy }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
