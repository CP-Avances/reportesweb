import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AtendidosmultiplesComponent } from './atendidosmultiples.component';

describe('AtendidosmultiplesComponent', () => {
  let component: AtendidosmultiplesComponent;
  let fixture: ComponentFixture<AtendidosmultiplesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AtendidosmultiplesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AtendidosmultiplesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
