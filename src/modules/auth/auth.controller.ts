import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Request,
    UnauthorizedException,
    UseGuards
} from '@nestjs/common';
import { AuthGuard } from '../../providers/auth.guard';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: Record<string, any>) {
    const { username, password } = loginDto;
    const user = await this.authService.checkCredentials(username, password)
    if (!user){
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.generateToken(user.id, user.roles);
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
