import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { File } from './models/file.model';
import * as fs from 'fs';
import { constants } from 'buffer';
import { SettingsService } from 'src/settings/settings.service';
import { FileManagerService } from 'src/file-manager/file-manager.service';
import { Library } from 'src/library/models/library.model';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class FileService {
	constructor(
		@InjectModel(File)
		private fileModel: typeof File,
		private settingsService: SettingsService,
		private fileManagerService: FileManagerService
	) {}

	/**
	 * Register a file in the Database
	 * @param filePath The path to the file to register, excluding base dataFolder & parent library path
	 * @param parentLibrary The parent Library the new file will be registered under
	 */
	async registerFile(filePath: string, parentLibrary: Library): Promise<File> {
		const baseDatafolder = this.settingsService.getDataFolder();
		const libraryPath = `${baseDatafolder}/${parentLibrary.path}`;
		const fullFilePath = `${libraryPath}/${filePath}`;
		fs.access(fullFilePath, fs.constants.R_OK, (isNotReadable) => {
			if (isNotReadable)
				throw new NotFoundException(`${fullFilePath}: File not accessible`)
		});

		return await this.fileModel.create({
			path: filePath,
			registerDate: new Date(),
			md5Checksum: this.fileManagerService.getMd5Checksum(fullFilePath),
			library: parentLibrary.id
		});
	}

	/**
	 * Find File entites whose path is contained in the filePaths parameters
	 * @param filePaths an array of file paths, without base folder or parent library's base folder
	 * @returns 
	 */
	async findFilesFromPath(filePaths: string[]) {
		return this.fileModel.findAll({
			where: Sequelize.or(
				{ path: filePaths },
			)
		});
	}
}
