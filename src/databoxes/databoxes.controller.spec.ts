import { Test, TestingModule } from '@nestjs/testing';
import { DataboxesController } from './databoxes.controller';

describe('DataboxesController', () => {
  let controller: DataboxesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DataboxesController],
    }).compile();

    controller = module.get<DataboxesController>(DataboxesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
