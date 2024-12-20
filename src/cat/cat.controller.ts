import { Body, Controller, Get, HttpException, HttpStatus, Param, ParseIntPipe, ParseUUIDPipe, Post, UseFilters, ValidationPipe } from '@nestjs/common';
import { CatsService as CatService } from './cat.service'
import { CatCreateDto } from './cat-create.dto';

@Controller('cats')
export class CatController {

    constructor (private catService: CatService){

    }

    @Get(':id')
    listeleCanim(@Param('id', ParseUUIDPipe) id:string):string {
        return "Listelendi: " + id;
    }
    
    @Post("create")
    async create(@Body(new ValidationPipe()) dto: CatCreateDto) {
        //throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
        return {Oldu: dto.name};
    }
}
