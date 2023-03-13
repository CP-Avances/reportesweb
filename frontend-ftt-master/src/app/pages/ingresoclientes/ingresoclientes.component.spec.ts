import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IngresoclientesComponent } from './ingresoclientes.component';

describe('IngresoclientesComponent', () => {
  let component: IngresoclientesComponent;
  let fixture: ComponentFixture<IngresoclientesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ IngresoclientesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IngresoclientesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
