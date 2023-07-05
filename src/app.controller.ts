import {
  Controller,
  Get,
  Param,
  Query,
  Render,
  Res,
  Session,
} from '@nestjs/common';
import { AppService } from './app.service';
import * as secureSession from '@fastify/secure-session';
import { ConfigService } from '@nestjs/config';
import { ellipsisUuid, getUrl, randomString } from './utils/string';
import { UsersService } from './users/users.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private configService: ConfigService,
    private usersService: UsersService,
  ) {}

  @Get('privacy')
  @Render('privacy')
  privacy() {
    return {
      CURRENT_YEAR: new Date().getFullYear(),
    };
  }

  @Get('whatis')
  @Render('whatis')
  whatis() {
    return {
      CURRENT_YEAR: new Date().getFullYear(),
    };
  }

  @Get()
  @Render('index')
  async index(@Session() session: secureSession.Session) {
    const hduhelpId = session.get('hduhelpId');
    const isLoggedIn = !!hduhelpId;
    if (!isLoggedIn) {
      return {
        isLoggedIn,
      };
    } else {
      const userData = await this.usersService.findOneByHduhelpId(hduhelpId);
      let nickname;
      if (userData && userData.uuid_mojang) {
        nickname = await this.usersService.findNicknameByUuidMojang(
          userData.uuid_mojang,
        );
      }
      return {
        isLoggedIn,
        hduhelpId: ellipsisUuid(hduhelpId),
        mojangUuid: userData && userData.uuid_mojang,
        mojangName: nickname,
        CURRENT_YEAR: new Date().getFullYear(),
      };
    }
  }

  @Get('logout')
  logout(@Session() session: secureSession.Session, @Res() res: any) {
    session.delete();
    res.status(302).redirect('/');
  }

  @Get('jump')
  jump(@Session() session: secureSession.Session, @Res() res: any) {
    const hduhelpEntry = this.configService.get('hduhelp.entry');
    const hduhelpClientId = this.configService.get('hduhelp.client_id');
    const hduhelpRedirectUri = this.configService.get('hduhelp.redirect_uri');
    const tempState = randomString(32);
    session.set('hduhelp.state', tempState);

    // 生成 oauth 跳转链接
    const oauthUrl = getUrl(hduhelpEntry, '/oauth/authorize', {
      response_type: 'code',
      client_id: hduhelpClientId,
      redirect_uri: hduhelpRedirectUri,
      state: tempState,
    });

    // 重定向
    res.status(302).redirect(oauthUrl.toString());
  }

  @Get('callback')
  async callback(
    @Session() session: secureSession.Session,
    @Res() res: any,
    @Query('code') code: string,
    @Query('state') state: string,
  ) {
    // state 不一致，403
    if (
      state &&
      session.get('hduhelp.state') &&
      state !== session.get('hduhelp.state')
    ) {
      res.status(403).send('403 Forbidden');
      return;
    }

    // 重置 state
    session.set('hduhelp.state', null);

    // 获取 token
    try {
      const userInfo = await this.appService.getHduhelpUserByCode(code, state);
      // 保存 session
      session.set('hduhelpId', userInfo.user_id);
      // 获取重定向目标
      const redirectUrl = session.get('redirectUrl');
      console.log(redirectUrl);
      // session.set('redirectUrl', null);
      // 重定向
      res.status(302).redirect(redirectUrl || '/');
    } catch (error) {
      res.status(403).send('403 Forbidden');
    }
  }

  @Get('verify/:code/:uuid')
  @Render('verify')
  async verify(
    @Res() res: any,
    @Param('code') code: string,
    @Param('uuid') uuid: string,
    @Session() session: secureSession.Session,
  ) {
    const verifyCode = await this.usersService.findVerifyCodeByUuidMojang(uuid);
    if (!verifyCode) {
      return {
        error: true,
        msg: '链接无效',
        CURRENT_YEAR: new Date().getFullYear(),
      };
    }
    if (verifyCode.code !== code) {
      return {
        error: true,
        msg: '链接无效',
        CURRENT_YEAR: new Date().getFullYear(),
      };
    }
    const hduhelpId = session.get('hduhelpId');
    const isLoggedIn = !!hduhelpId;
    if (!isLoggedIn) {
      session.set('redirectUrl', `/verify/${code}/${uuid}`);
      res.status(302).redirect('/');
      return;
    } else {
      session.set('verify_code', code);
      session.set('verify_uuid', uuid);
      const nickname = await this.usersService.findNicknameByUuidMojang(uuid);
      return {
        error: false,
        isLoggedIn,
        hduhelpId: ellipsisUuid(hduhelpId),
        mojangUuid: uuid,
        mojangName: nickname,
        verifyCode: code,
        CURRENT_YEAR: new Date().getFullYear(),
      };
    }
  }

  @Get('verify/:code/:uuid/deny')
  @Render('verify')
  async verifyDeny(
    @Res() res: any,
    @Param('code') code: string,
    @Param('uuid') uuid: string,
    @Session() session: secureSession.Session,
  ) {
    const prev_code = session.get('verify_code');
    const prev_uuid = session.get('verify_uuid');
    if (prev_code !== code || prev_uuid !== uuid) {
      res.status(302).redirect('/verify/' + code + '/' + uuid);
      return;
    }
    const verifyCode = await this.usersService.findVerifyCodeByUuidMojang(uuid);
    if (!verifyCode) {
      return {
        error: true,
        msg: '链接无效',
        CURRENT_YEAR: new Date().getFullYear(),
      };
    }
    if (verifyCode.code !== code) {
      return {
        error: true,
        msg: '链接无效',
        CURRENT_YEAR: new Date().getFullYear(),
      };
    }
    const hduhelpId = session.get('hduhelpId');
    const isLoggedIn = !!hduhelpId;
    if (!isLoggedIn) {
      return {
        error: true,
        msg: '会话过期，请重新登录',
        CURRENT_YEAR: new Date().getFullYear(),
      };
    } else {
      session.set('verify_code', null);
      session.set('verify_uuid', null);
      await this.usersService.removeVerifyCodeByUuidMojang(uuid);
      res.status(302).redirect('/');
      return;
    }
  }

  @Get('verify/:code/:uuid/confirm')
  @Render('verify')
  async verifyConfirm(
    @Res() res: any,
    @Param('code') code: string,
    @Param('uuid') uuid: string,
    @Session() session: secureSession.Session,
  ) {
    const prev_code = session.get('verify_code');
    const prev_uuid = session.get('verify_uuid');
    if (prev_code !== code || prev_uuid !== uuid) {
      res.status(302).redirect('/verify/' + code + '/' + uuid);
      return;
    }
    const verifyCode = await this.usersService.findVerifyCodeByUuidMojang(uuid);
    if (!verifyCode) {
      return {
        error: true,
        msg: '链接无效',
        CURRENT_YEAR: new Date().getFullYear(),
      };
    }
    if (verifyCode.code !== code) {
      return {
        error: true,
        msg: '链接无效',
        CURRENT_YEAR: new Date().getFullYear(),
      };
    }
    const hduhelpId = session.get('hduhelpId');
    const isLoggedIn = !!hduhelpId;
    if (!isLoggedIn) {
      return {
        error: true,
        msg: '会话过期，请重新登录',
        CURRENT_YEAR: new Date().getFullYear(),
      };
    } else {
      session.set('verify_code', null);
      session.set('verify_uuid', null);
      await this.usersService.removeVerifyCodeByUuidMojang(uuid);

      this.usersService.create({
        hduhelp_id: hduhelpId,
        uuid_mojang: uuid,
      });

      res.status(302).redirect('/');
      return;
    }
  }
}
