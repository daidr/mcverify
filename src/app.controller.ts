import {
  Controller,
  Get,
  Query,
  Render,
  Req,
  Res,
  Session,
} from '@nestjs/common';
import { AppService, HduhelpUserInfo } from './app.service';
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
      return {
        isLoggedIn,
        hduhelpId: ellipsisUuid(hduhelpId),
        mojangUuid: userData && userData.uuid_mojang,
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
      session.set('redirectUrl', null);
      // 重定向
      res.status(302).redirect(redirectUrl || '/');
    } catch (error) {
      res.status(403).send('403 Forbidden');
    }
  }
}
