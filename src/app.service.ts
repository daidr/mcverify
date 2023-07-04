import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface UserInfo {
  staff_id: string;
  staff_name: string;
  staff_type: '0' | '1' | '2';
  user_id: string;
}

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getHduhelpUserByCode(code: string, state: string): Promise<UserInfo> {
    const hduhelpEntry = this.configService.get('hduhelp.entry');
    const hduhelpClientId = this.configService.get('hduhelp.client_id');
    const hduhelpClientSecret = this.configService.get('hduhelp.client_secret');

    const authUrl = new URL(
      hduhelpEntry,
      `/oauth/token?client_id=${hduhelpClientId}&client_secret=${hduhelpClientSecret}&grant_type=authorization_code&code=${code}&state=${state}`,
    );

    return await fetch(authUrl.toString())
      .then((res) => res.json())
      .then((json) => {
        if (json.error) {
          throw new Error(json.error);
        }

        return {
          staff_id: json.data.staff_id,
          staff_name: json.data.staff_name,
          staff_type: json.data.staff_type,
          user_id: json.data.user_id,
        } as UserInfo;
      });
  }
}
