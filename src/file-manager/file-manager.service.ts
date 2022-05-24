import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { SettingsService } from 'src/settings/settings.service';
import md5File from 'md5-file';
import * as fs from 'fs';

@Injectable()
export class FileManagerService {
	public readonly configFolderPath = '/meelo';
	constructor(
		@Inject(forwardRef(() => SettingsService))
		private settingsService: SettingsService) {}

	folderExists(folderPath: string): boolean {
		try {
			return fs.lstatSync(folderPath).isDirectory();
		} catch {
			return false;
		}
	}

	fileExists(filePath: string): boolean {
		return fs.existsSync(filePath);
	}

	fileIsReadable(filePath: string): boolean {
		try {
			fs.accessSync(filePath, fs.constants.R_OK);
			return true;
		} catch {
			return false;
		}
	}

	getFileContent(filePath: string): string {
		return fs.readFileSync(filePath, 'utf8');
	}

	/**
	 * Compute the MD5 checksum of a file
	 * @param filePath The Full Path to a file, whose MD5 checksum will be computed
	 * @returns the MD5 Checksum as a string
	 */
	getMd5Checksum(filePath: string) {
		return md5File.sync(filePath);
	}

	getIllustrationFullPath(artistSlug: string, albumSlug: string | null, releaseId: number | null) {

	}

	/**
	 * Get any file that matches the RegExps from the settings, in a Library's base folder
	 * @param libraryBaseDirectory The path to the library, without settings's dataFolder
	 * @returns A List of strings representing the path of candidate file, without dataFolder and libraryBaseDirectory
	 */
	getCandidateFilesInLibraryFolder(libraryBaseDirectory: string): string[] {
		const baseFolder = this.settingsService.getDataFolder();
		const libraryPath = `${baseFolder}/${libraryBaseDirectory}`;
		return this.getCandidateInFolder(libraryPath).map(
			(candidateFullPath) => candidateFullPath.substring(libraryPath.length + 1)
		);
	}

	/**
	 * Get all file matching RegExp from Settings service, recursively in a folder
	 * @param folderPath The path of a folder to go through
	 */
	private getCandidateInFolder(folderPath: string): string[] {
		let directoryContent = fs.readdirSync(folderPath, { withFileTypes: true });
		let candidates: string[] = [];

		directoryContent.forEach(
			(dirEntry) => {
				const entryFullPath = `${folderPath}/${dirEntry.name}`;
				if (dirEntry.isDirectory())
				candidates = candidates.concat(this.getCandidateInFolder(entryFullPath));
				else if (dirEntry.isFile()) {
					if (this.fileIsCandidate(entryFullPath))
						candidates.push(entryFullPath);
				}
			}
		);
		return candidates;
	}

	/**
	 * Checks if a file matches one of the RegExp from the settings
	 * @param filepath The Full path of a file
	 * @returns true if any of the RegExp matches
	 */
	private fileIsCandidate(filepath: string): boolean {
		let matchingRegexes = this.settingsService.getTrackRegexes().filter(
			(regex) => filepath.match(regex) != null
		);
		return matchingRegexes.length > 0;
	}
}
