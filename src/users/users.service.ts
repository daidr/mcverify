import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private entityRepository: Repository<User>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
  ) {}

  async findOne(id: number): Promise<User> {
    return await this.entityRepository.findOneBy({ id });
  }

  async findOneByHduhelpId(hduhelp_id: string): Promise<User> {
    return await this.entityRepository.findOneBy({ hduhelp_id });
  }

  async findOneByUuidMojang(uuid_mojang: string): Promise<User> {
    return await this.entityRepository.findOneBy({ uuid_mojang });
  }

  async create(entity: Omit<User, 'id'>): Promise<User> {
    const user = new User();
    user.hduhelp_id = entity.hduhelp_id;
    user.uuid_mojang = entity.uuid_mojang;
    return await this.entityRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    await this.entityRepository.delete(id);
  }

  async removeVerifyCodeByUuidMojang(uuid_mojang: string): Promise<void> {
    await this.cacheManager.del(`MCVERIFY:verify_code:${uuid_mojang}`);
  }

  async findVerifyCodeByUuidMojang(uuid_mojang: string): Promise<{
    code: string;
    createdAt: number;
  }> {
    const result = await this.cacheManager.get<{
      code: string;
      createdAt: number;
    }>(`MCVERIFY:verify_code:${uuid_mojang}`);

    return result;
  }

  async setVerifyCodeByUuidMojang(
    uuid_mojang: string,
    code: string,
  ): Promise<{
    code: string;
    createdAt: number;
  }> {
    const data = {
      code,
      createdAt: Date.now(),
    };
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await this.cacheManager.set(`MCVERIFY:verify_code:${uuid_mojang}`, data, {
      ttl: 5 * 60,
    });
    return data;
  }

  async findNicknameByUuidMojang(uuid_mojang: string): Promise<string> {
    const result = await this.cacheManager.get<string>(
      `MCVERIFY:mojang_nickname:${uuid_mojang}`,
    );

    if (!result) {
      const result = await fetch(
        `https://sessionserver.mojang.com/session/minecraft/profile/${uuid_mojang.replaceAll(
          '-',
          '',
        )}`,
      );
      const data = await result.json();

      await this.cacheManager.set(
        `MCVERIFY:mojang_nickname:${uuid_mojang}`,
        data.name,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        {
          ttl: 24 * 60 * 60,
        },
      );

      return data.name;
    }

    return result;
  }

  async getBase64AvatarByUuidMojang(uuid_mojang: string): Promise<string> {
    const result = await this.cacheManager.get<string>(
      `MCVERIFY:mojang_avatar:${uuid_mojang}`,
    );

    if (!result) {
      const apiEntry = this.configService.get<string>('crafatar.entry');
      const api = `/avatars/${uuid_mojang}?size=100&overlay`;
      const result = await fetch(apiEntry + api);
      const data = await result.arrayBuffer();
      const base64 = Buffer.from(data).toString('base64');
      const base64Avatar = `data:image/png;base64,${base64}`;
      await this.cacheManager.set(
        `MCVERIFY:mojang_avatar:${uuid_mojang}`,
        base64Avatar,
      );
      return base64Avatar;
    }

    return result;
  }
}
