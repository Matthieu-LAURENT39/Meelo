import { Injectable, StreamableFile } from '@nestjs/common';
import FileManagerService from 'src/file-manager/file-manager.service';
import { FileAlreadyExistsException, FileNotFoundFromIDException, FileNotFoundFromPathException, FileNotFoundFromTrackIDException, SourceFileNotFoundExceptions } from './file.exceptions';
import PrismaService from 'src/prisma/prisma.service';
import type { Library, File, Prisma, Track } from '@prisma/client';
import type FileQueryParameters from './models/file.query-parameters';
import { FileNotReadableException } from 'src/file-manager/file-manager.exceptions';
import * as fs from 'fs';
import path from 'path';
import SettingsService from 'src/settings/settings.service';
import RepositoryService from 'src/repository/repository.service';
import type { MeeloException } from 'src/exceptions/meelo-exception';
import { buildDateSearchParameters } from 'src/utils/search-date-input';
import LibraryService from 'src/library/library.service';

@Injectable()
export default class FileService extends RepositoryService<
	File,
	{ track: Track, library: Library },
	FileQueryParameters.CreateInput,
	FileQueryParameters.WhereInput,
	FileQueryParameters.ManyWhereInput,
	FileQueryParameters.UpdateInput,
	FileQueryParameters.DeleteInput,
	Prisma.FileCreateInput,
	Prisma.FileWhereInput,
	Prisma.FileWhereInput,
	Prisma.FileUpdateInput,
	Prisma.FileWhereUniqueInput
> {
	constructor(
		private prismaService: PrismaService,
		private fileManagerService: FileManagerService,
		private settingsService: SettingsService
	) {
		super(prismaService.file);
	}
	/**
	 * Create file
	 */
	formatCreateInput(input: FileQueryParameters.CreateInput) {
		return { ...input, library: {
			connect: { id: input.libraryId }
		} };
	}
	protected formatCreateInputToWhereInput(input: FileQueryParameters.CreateInput): FileQueryParameters.WhereInput {
		return { byPath: { path: input.path, library: { id: input.libraryId } } }
	}
	protected onCreationFailure(input: FileQueryParameters.CreateInput) {
		return new FileAlreadyExistsException(input.path, input.libraryId)
	}

	/**
	 * find a file
	 */
	static formatWhereInput(where: FileQueryParameters.WhereInput) {
		return {
			id: where.id,
			track: where.trackId ? {
				id: where.trackId
			} : undefined,
			path: where.byPath?.path,
			library: where.byPath
				? LibraryService.formatWhereInput(where.byPath.library)
				: undefined
		};
	}
	formatWhereInput = FileService.formatWhereInput;

	static formatManyWhereInput(where: FileQueryParameters.ManyWhereInput) {
		return {
			id: where.ids !== undefined ? {
				in: where.ids
			} : undefined,
			library: where.library
				? LibraryService.formatWhereInput(where.library)
				: undefined,
			path: where.paths !== undefined ? {
				in: where.paths
			} : undefined,
			registerDate: where.byRegistrationDate
				? buildDateSearchParameters(where.byRegistrationDate)
				: undefined
		}
	}
	formatManyWhereInput = FileService.formatManyWhereInput;

	onNotFound(where: FileQueryParameters.WhereInput): MeeloException {
		if (where.id !== undefined)
			return new FileNotFoundFromIDException(where.id);
		else if (where.trackId !== undefined)
			return new FileNotFoundFromTrackIDException(where.trackId);
		return new FileNotFoundFromPathException(where.byPath.path);
	}

	/**
	 * Update a File
	 */
	formatUpdateInput(file: FileQueryParameters.UpdateInput) {
		return file;
	}

	/**
	 * Delete a File
	 */
	formatDeleteInput(where: FileQueryParameters.DeleteInput) {
		return where;
	}
	protected formatDeleteInputToWhereInput(where: FileQueryParameters.DeleteInput) {
		return where;
	}

	async deleteMany(where: FileQueryParameters.ManyWhereInput): Promise<number> {
		return (await this.prismaService.file.deleteMany({
			where: FileService.formatManyWhereInput(where)
		})).count;
	}

	buildResponse(input: File): File {
		return input;
	}


	/**
	 * Register a file in the Database
	 * @param filePath The path to the file to register, relative to parent library path
	 * @param parentLibrary The parent Library the new file will be registered under
	 */
	async registerFile(filePath: string, parentLibrary: Library): Promise<File> {
		const libraryPath = this.fileManagerService.getLibraryFullPath(parentLibrary);
		const fullFilePath = `${libraryPath}/${filePath}`;
		if (!this.fileManagerService.fileIsReadable(fullFilePath)) {
			throw new FileNotReadableException(filePath);
		}

		return this.create({
			path: filePath,
			md5Checksum: this.fileManagerService.getMd5Checksum(fullFilePath).toString(),
			registerDate: new Date(),
			libraryId: parentLibrary.id
		});
	}

	/**
	 * 
	 * @param file the file object of the file to stream
	 * @param parentLibrary parent library of the file to stream
	 * @param res the Response Object of the request
	 * @returns a StreamableFile of the file
	 */
	streamFile(file: File, parentLibrary: Library, res: any): StreamableFile {
		const fullFilePath = `${this.settingsService.settingsValues.dataFolder}/${parentLibrary.path}/${file.path}`.normalize();
		if (this.fileManagerService.fileExists(fullFilePath) == false)
			throw new SourceFileNotFoundExceptions(file.path);
		res.set({
			'Content-Disposition': `attachment; filename="${path.parse(file.path).base}"`,
		});
		return new StreamableFile(fs.createReadStream(fullFilePath));
	}
}
