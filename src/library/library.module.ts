import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Library } from './models/library.model';
import { LibraryController } from './library.controller';
import { LibraryService } from './library.service';
import { FileManagerModule } from 'src/file-manager/file-manager.module';
import { FileModule } from 'src/file/file.module';
import { SettingsModule } from 'src/settings/settings.module';
import { MetadataModule } from 'src/metadata/metadata.module';

@Module({
	imports: [
		SequelizeModule.forFeature([
			Library
		]),
		FileManagerModule,
		FileModule,
		MetadataModule
	],
	controllers: [LibraryController],
	providers: [LibraryService]
})
export class LibraryModule {}
