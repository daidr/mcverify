import { Controller, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { randomString } from 'src/utils/string';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('/_users/mojang/:uuid')
  async findOneByUuidMojang(@Param('uuid') uuid: string) {
    const user = await this.usersService.findOneByUuidMojang(uuid);
    if (user) {
      return {
        code: -1,
        msg: 'binded',
      };
    }

    const verifyCode = await this.usersService.findVerifyCodeByUuidMojang(uuid);

    if (!verifyCode) {
      const code = randomString(64);
      const result = await this.usersService.setVerifyCodeByUuidMojang(
        uuid,
        code,
      );
      return {
        code: 0,
        msg: 'success',
        data: result,
      };
    } else {
      return {
        code: 1,
        msg: 'exist',
        data: verifyCode,
      };
    }
  }
}
