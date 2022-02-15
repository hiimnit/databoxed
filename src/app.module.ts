import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DataboxesModule } from './databoxes/databoxes.module';

@Module({
  imports: [DataboxesModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
