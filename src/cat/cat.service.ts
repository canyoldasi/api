import { Injectable } from '@nestjs/common';
import { Cat } from 'src/cat/cat.interface';

@Injectable()
export class CatsService {
    private cats: Cat[] = [];

    create(cat: Cat){
        this.cats.push(cat)
    }

    findAll(): Cat[] {
        return this.cats;
    }

    log(){
        console.log("Diğer modüldeki servis loglama yaptı!")
    }
}
