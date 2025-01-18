import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AddUserDto } from './add-user.dto';
import { UserService } from './user.service';
import { AuthGuard } from 'src/providers/auth.guard';
import { Roles } from 'src/providers/roles.decorator';
import { RoleEnum } from 'src/providers/role.enum';

@UseGuards(AuthGuard)
@Controller('users')
export class UserController {
    constructor (
        private userService: UserService
    ) {
    }

    @Delete(":id")
    removeById(@Param() params: any){
        return this.userService.removeOneById(params.id)
    }

    @Get()
    @Roles(RoleEnum.Admin)
    getAll(){
        return this.userService.getAll()
    }
}
