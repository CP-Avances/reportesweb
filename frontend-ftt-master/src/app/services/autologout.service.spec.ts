import { TestBed } from '@angular/core/testing';

import { AutologoutService } from './autologout.service';

describe('AutologoutService', () => {
  let service: AutologoutService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AutologoutService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
