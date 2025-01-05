import { Body, Controller, Post } from '@nestjs/common';
import { UserCreateDto } from './user-create.dto';

@Controller('user')
export class UserController {
    @Post("create")
    create(@Body() dto: UserCreateDto){
        return dto;
    }
}
