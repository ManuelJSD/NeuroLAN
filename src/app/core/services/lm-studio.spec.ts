import { TestBed } from '@angular/core/testing';

import { LmStudioService  } from './lm-studio';

describe('LmStudio', () => {
  let service: LmStudioService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LmStudioService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
