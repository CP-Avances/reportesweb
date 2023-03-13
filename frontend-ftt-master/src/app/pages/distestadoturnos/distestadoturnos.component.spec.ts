import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DistestadoturnosComponent } from './distestadoturnos.component';

describe('DistestadoturnosComponent', () => {
  let component: DistestadoturnosComponent;
  let fixture: ComponentFixture<DistestadoturnosComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DistestadoturnosComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DistestadoturnosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
