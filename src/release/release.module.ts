import { Module, forwardRef } from '@nestjs/common';
import AlbumModule from 'src/album/album.module';
import PrismaModule from 'src/prisma/prisma.module';
import ReleaseController from './release.controller';
import ReleaseService from './release.service';

@Module({
	imports: [
		PrismaModule,
		forwardRef(() => AlbumModule)
	],
	controllers: [ReleaseController],
	providers: [ReleaseService],
	exports: [ReleaseService]
})
export default class ReleaseModule {}
