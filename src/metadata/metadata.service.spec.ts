import { Test } from "@nestjs/testing";
import { TrackType } from "@prisma/client";
import { AlbumModule } from "src/album/album.module";
import { ArtistModule } from "src/artist/artist.module";
import { FileManagerModule } from "src/file-manager/file-manager.module";
import { FileManagerService } from "src/file-manager/file-manager.service";
import { ReleaseModule } from "src/release/release.module";
import { SettingsController } from "src/settings/settings.controller";
import { SettingsModule } from "src/settings/settings.module";
import { SettingsService } from "src/settings/settings.service";
import { SongModule } from "src/song/song.module";
import { TrackModule } from "src/track/track.module";
import { FakeFileManagerService } from "test/FakeFileManagerModule";
import { PathParsingException } from "./metadata.exceptions";
import { MetadataModule } from "./metadata.module";
import { MetadataService } from "./metadata.service";
import { Metadata } from "./models/metadata";

describe('Metadata Service', () => {
	let metadataService: MetadataService

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [MetadataModule, TrackModule, SongModule, AlbumModule, ReleaseModule, SettingsModule, FileManagerModule, ArtistModule],
			providers: [MetadataService],
		}).overrideProvider(FileManagerService).useClass(FakeFileManagerService).compile();
		metadataService = moduleRef.get<MetadataService>(MetadataService);
	});

	it('should be defined', () => {
		expect(metadataService).toBeDefined();
	});

	describe('Parse Metadata from path', () => {
		it("should throw, as the path does not math any regexes", () => {
			const test = () => {
				metadataService.parseMetadataFromPath('trololol');
			}
			expect(test).toThrow(PathParsingException);
		});

		it("should extract the metadata values from the path (all fields)", () => {
			let parsedValues: Metadata = metadataService.parseMetadataFromPath(
				'/data/My Artist/My Album (2006)/1-02 My Track.m4a'
			);
			
			expect(parsedValues).toStrictEqual(<Metadata>{
				albumArtist: 'My Artist',
				album: 'My Album',
				release: undefined,
				releaseDate: new Date('2006'),
				discIndex: 1,
				index: 2,
				name: 'My Track'
			});
		});

		it("should extract the metadata values from the path (missing fields)", () => {
			let parsedValues: Metadata = metadataService.parseMetadataFromPath(
				'/data/My Artist/My Album/02 My Track.m4a'
			);
			
			expect(parsedValues).toStrictEqual(<Metadata>{
				albumArtist: 'My Artist',
				album: 'My Album',
				release: undefined,
				releaseDate: undefined,
				discIndex: undefined,
				index: 2,
				name: 'My Track'
			});
		});

		it("should extract the metadata values from the file's tags", async () => {
			let parsedValues: Metadata = await metadataService.parseMetadata(
				'test/assets/dreams.m4a'
			);
			
			expect(parsedValues).toStrictEqual(<Metadata>{
				compilation: false,
				artist: 'My Artist',
				albumArtist: 'My Album Artist',
				album: 'My Album',
				release: 'My Album',
				name: 'Dreams',
				releaseDate: new Date('2007'),
				index: 3,
				discIndex: 2,
				bitrate: 133,
				duration: 210,
				type: TrackType.Audio,
			});
		});
	});
})