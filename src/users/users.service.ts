import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private entityRepository: Repository<User>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
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

      return data;
    }

    return result;
  }
}
