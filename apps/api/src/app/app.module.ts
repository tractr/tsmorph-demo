import { Module } from '@nestjs/common';
import { RightController } from './generated/right/right.controller';
import { RoleController } from './generated/role/role.controller';
import { TagController } from './generated/tag/tag.controller';

import { UserController } from './generated/user/user.controller';

@Module({
  controllers: [RightController, RoleController, UserController, TagController],
})
export class AppModule {}
