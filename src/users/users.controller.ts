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

  @Get('/api/get/mojang/:uuid')
  async bindMojang(@Param('uuid') uuid: string) {
    const _uuid = formatUuid(uuid);
    if (!_uuid) {
      return {
        code: -1,
        msg: 'invalid uuid',
      };
    }
    const user = await this.usersService.findOneByUuidMojang(_uuid);
    if (user) {
      return {
        code: 0,
        msg: 'ok',
        data: {
          binded: true,
        },
      };
    } else {
      return {
        code: 0,
        msg: 'ok',
        data: {
          binded: false,
        },
      };
    }
  }
}

const formatUuid = (uuid: string) => {
  // 如果不是uuid，返回 false
  if (uuid.length === 36) {
    return uuid;
  } else if (uuid.length === 32) {
    return `${uuid.slice(0, 8)}-${uuid.slice(8, 12)}-${uuid.slice(
      12,
      16,
    )}-${uuid.slice(16, 20)}-${uuid.slice(20)}`;
  } else {
    return false;
  }
};
