import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UserDocument } from './schemas/user.schema';

@Controller('users')
export class UsersController {
  @Get('me')
  getMe(@CurrentUser() user: UserDocument) {
    // passwordHash already excluded by JwtStrategy.validate()
    return user;
  }
}
