import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UserCreateDto } from './user-create.dto';
import { UserService } from './user.service';
import { AuthGuard } from 'src/auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('users')
export class UserController {
    constructor (
        private userService: UserService
    ) {
    }

    @Post()
    async add(@Body() dto: UserCreateDto){
        return await this.userService.add(dto);
    }

    @Get(":id")
    getById(@Param() params: any){
        return this.userService.getOneById(params.id)
    }

    @Delete(":id")
    removeById(@Param() params: any){
        return this.userService.removeOneById(params.id)
    }

    @Get()
    getAll(){
        return this.userService.getAll()
    }
}
