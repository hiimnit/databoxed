import { Test, TestingModule } from '@nestjs/testing';
import { DataboxesService } from './databoxes.service';

describe('DataboxesService', () => {
  let service: DataboxesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DataboxesService],
    }).compile();

    service = module.get<DataboxesService>(DataboxesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
