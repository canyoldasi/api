import { Body, Controller, Get, Param,  ParseUUIDPipe, Post, UseGuards, UseInterceptors, ValidationPipe } from '@nestjs/common';
import { CatsService as CatService } from './cat.service'
import { CatCreateDto } from './cat-create.dto';
import { CustomExecutionTimeInterceptor } from 'src/providers/custom-execution-time.intercepter';
import { EARequiredRoles as EARoles } from 'src/providers/ea.role.decorator';
import { EARole } from 'src/providers/ea-role.enum';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('cats')
@UseGuards(AuthGuard)
export class CatController {
    constructor (private catService: CatService){

    }

    @Get(':id')
    listeleCanim(@Param('id', ParseUUIDPipe) id:string):string {
        return "Listelendi: " + id;
    }
    
    @Post("create")
    @UseInterceptors(CustomExecutionTimeInterceptor)
    @EARoles(EARole.Admin, EARole.User)
    async create(@Body(new ValidationPipe()) dto: CatCreateDto) {
        //throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
        return {Oldu: dto.name};
    }
}
