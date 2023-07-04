import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private entityRepository: Repository<User>,
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

  async create(entity: User): Promise<User> {
    return await this.entityRepository.save(entity);
  }

  async update(entity: User): Promise<void> {
    await this.entityRepository.update(entity.id, entity);
  }

  async remove(id: number): Promise<void> {
    await this.entityRepository.delete(id);
  }
}
