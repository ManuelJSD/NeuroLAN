import { TestBed } from '@angular/core/testing';

import { LmStudio } from './lm-studio';

describe('LmStudio', () => {
  let service: LmStudio;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LmStudio);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
