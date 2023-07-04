import {
  Controller,
  Get,
  Query,
  Render,
  Req,
  Res,
  Session,
} from '@nestjs/common';
import { AppService } from './app.service';
import * as secureSession from '@fastify/secure-session';
import { ConfigService } from '@nestjs/config';
import { randomString } from 'utils/string';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private configService: ConfigService,
  ) {}

  @Get()
  @Render('index')
  index(@Session() session: secureSession.Session) {
    const isLoggedIn = session.get('isLogged');
    const hduhelpId = session.get('hduhelpId');
    return {
      isLoggedIn,
      hduhelpId,
      CURRENT_YEAR: new Date().getFullYear(),
    };
  }

  @Get('jump')
  jump(@Session() session: secureSession.Session, @Res() res: any) {
    const hduhelpEntry = this.configService.get('hduhelp.entry');
    const hduhelpClientId = this.configService.get('hduhelp.client_id');
    const hduhelpRedirectUri = this.configService.get('hduhelp.redirect_uri');
    const tempState = randomString(32);
    session.set('hduhelp.state', tempState);
    // 生成 oauth 跳转链接
    const oauthUrl = new URL(
      hduhelpEntry,
      `/oauth/authorize?response_type=code&client_id=${hduhelpClientId}&redirect_uri=${hduhelpRedirectUri}&state=${tempState}`,
    );

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
    // referer 不是 hduhelpEntry，403
    const hduhelpEntry = this.configService.get('hduhelp.entry');
    if (
      new URL(res.req.headers.referer).origin !== new URL(hduhelpEntry).origin
    ) {
      res.status(403).send('403 Forbidden');
      return;
    }

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
      session.set('isLogged', true);
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
