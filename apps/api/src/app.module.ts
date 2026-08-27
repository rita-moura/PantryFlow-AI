import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PantryModule } from './pantry/pantry.module';

@Module({
  imports: [PantryModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
