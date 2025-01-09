import { Body, Controller, Get, Post } from '@nestjs/common';
import { UserCreateDto } from './user-create.dto';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
    constructor (
        private userService: UserService
    ) {
    }


    @Post("create")
    create(@Body() dto: UserCreateDto){
        return dto;
    }

    @Get()
    findAll(){
        return this.userService.findOne("asdasd")
    }
}
