import { Injectable } from '@nestjs/common';
import { CatsService } from 'src/cat/cat.service';

@Injectable()
export class AppService {
  constructor (private catService: CatsService) {

  }
  getHello(): string {
    this.catService.log()
    return 'Hello World!';
  }
}
