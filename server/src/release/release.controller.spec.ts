import { createTestingModule } from "test/test-module";
import type { TestingModule } from "@nestjs/testing";
import type { Album, Release, Track } from "src/prisma/models";
import AlbumModule from "src/album/album.module";
import AlbumService from "src/album/album.service";
import ArtistModule from "src/artist/artist.module";
import ArtistService from "src/artist/artist.service";
import PrismaModule from "src/prisma/prisma.module";
import PrismaService from "src/prisma/prisma.service";
import ReleaseService from "./release.service";
import ReleaseController from "./release.controller";
import request from "supertest";
import { INestApplication } from "@nestjs/common";
import ReleaseModule from "./release.module";
import TrackModule from "src/track/track.module";
import IllustrationModule from "src/illustration/illustration.module";
import SongModule from "src/song/song.module";
import MetadataModule from "src/metadata/metadata.module";
import type Tracklist from "src/track/models/tracklist.model";
import GenreModule from "src/genre/genre.module";
import TestPrismaService from "test/test-prisma.service";
import type ReassignReleaseDTO from "./models/reassign-release.dto";
import FileModule from "src/file/file.module";
import SetupApp from "test/setup-app";
import { expectedReleaseResponse, expectedAlbumResponse, expectedTrackResponse, expectedSongResponse, expectedArtistResponse } from "test/expected-responses";
import ProvidersModule from "src/providers/providers.module";

describe('Release Controller', () => {
	let dummyRepository: TestPrismaService;
	let app: INestApplication;

	let module: TestingModule;
	beforeAll(async () => {
		module = await createTestingModule({
			imports: [PrismaModule, AlbumModule, ArtistModule, ReleaseModule, TrackModule, IllustrationModule, SongModule, FileModule, MetadataModule, GenreModule, ProvidersModule],
			providers: [ReleaseService, AlbumService, ArtistService, ReleaseController],
		}).overrideProvider(PrismaService).useClass(TestPrismaService).compile();
		app = await SetupApp(module);
		dummyRepository = module.get(PrismaService);
		await dummyRepository.onModuleInit();
	});

	afterAll(() => {
		module.close();
		app.close();
	});

	describe('Get Releases (GET /releases)', () => {

		it("should return every releases", () => {
			return request(app.getHttpServer())
				.get('/releases')
				.expect(200)
				.expect((res) => {
					const releases: Release[] = res.body.items;
					expect(releases.length).toBe(4);
					expect(releases[0]).toStrictEqual(expectedReleaseResponse(dummyRepository.releaseA1_1));
					expect(releases[1]).toStrictEqual(expectedReleaseResponse(dummyRepository.releaseA1_2));
					expect(releases[2]).toStrictEqual(expectedReleaseResponse(dummyRepository.releaseB1_1));
					expect(releases[3]).toStrictEqual(expectedReleaseResponse(dummyRepository.compilationReleaseA1));
				});
		});

		it("should return every releases, sorted by name", () => {
			return request(app.getHttpServer())
				.get('/releases?sortBy=name')
				.expect(200)
				.expect((res) => {
					const releases: Release[] = res.body.items;
					expect(releases.length).toBe(4);
					expect(releases[0]).toStrictEqual(expectedReleaseResponse(dummyRepository.releaseA1_1));
					expect(releases[1]).toStrictEqual(expectedReleaseResponse(dummyRepository.releaseA1_2));
					expect(releases[2]).toStrictEqual(expectedReleaseResponse(dummyRepository.compilationReleaseA1));
					expect(releases[3]).toStrictEqual(expectedReleaseResponse(dummyRepository.releaseB1_1));
				});
		});

		it("should return some releases (w/ pagination)", () => {
			return request(app.getHttpServer())
				.get('/releases?take=1&skip=2')
				.expect(200)
				.expect((res) => {
					const releases: Release[] = res.body.items;
					expect(releases.length).toBe(1);
					expect(releases[0]).toStrictEqual(expectedReleaseResponse(dummyRepository.releaseB1_1));
				});
		});

		it("should return releases w/ related albums", () => {
			return request(app.getHttpServer())
				.get('/releases?with=album')
				.expect(200)
				.expect((res) => {
					const releases: (Release & { album: Album }) [] = res.body.items;
					expect(releases.length).toBe(4);
					expect(releases[0]).toStrictEqual({
						...expectedReleaseResponse(dummyRepository.releaseA1_1),
						album: expectedAlbumResponse(dummyRepository.albumA1)
					});
					expect(releases[1]).toStrictEqual({
						...expectedReleaseResponse(dummyRepository.releaseA1_2),
						album: expectedAlbumResponse(dummyRepository.albumA1)
					});
					expect(releases[2]).toStrictEqual({
						...expectedReleaseResponse(dummyRepository.releaseB1_1),
						album: expectedAlbumResponse(dummyRepository.albumB1)
					});
					expect(releases[3]).toStrictEqual({
						...expectedReleaseResponse(dummyRepository.compilationReleaseA1),
						album: expectedAlbumResponse(dummyRepository.compilationAlbumA)
					});
				});
		});
	});

	describe("Get Release (GET /release/:id)", () => {
		it("should return the release", () => {
			return request(app.getHttpServer())
				.get(`/releases/${dummyRepository.releaseA1_1.id}`)
				.expect(200)
				.expect((res) => {
					const release: Release = res.body
					expect(release).toStrictEqual(expectedReleaseResponse(dummyRepository.releaseA1_1));
				});
		});

		it("should return the compilation release from slug", () => {
			return request(app.getHttpServer())
				.get(`/releases/compilations+${dummyRepository.compilationAlbumA.slug}+${dummyRepository.compilationReleaseA1.slug}`)
				.expect(200)
				.expect((res) => {
					const release: Release = res.body
					expect(release).toStrictEqual(expectedReleaseResponse(dummyRepository.compilationReleaseA1));
				});
		});

		it("should return the release from slug", () => {
			return request(app.getHttpServer())
				.get(`/releases/${dummyRepository.artistA.slug}+${dummyRepository.albumA1.slug}+${dummyRepository.releaseA1_2.slug}`)
				.expect(200)
				.expect((res) => {
					const release: Release = res.body
					expect(release).toStrictEqual(expectedReleaseResponse(dummyRepository.releaseA1_2));
				});
		});

		it("should throw, as the release does not exist", () => {
			return request(app.getHttpServer())
				.get(`/releases/-1`)
				.expect(404);
		});

		it("should return an error, as the string is badly formed", () => {
			return request(app.getHttpServer())
				.get(`/releases/${dummyRepository.artistA.slug}`)
				.expect(400);
		});

		it("should return the release, w/ parent album", () => {
			return request(app.getHttpServer())
				.get(`/releases/${dummyRepository.releaseA1_2.id}?with=album`)
				.expect(200)
				.expect((res) => {
					const release: Release & { album: Album, tracks: Track[] } = res.body
					expect(release.id).toBe(dummyRepository.releaseA1_2.id);
					expect(release.album).toStrictEqual(expectedAlbumResponse(dummyRepository.albumA1));
				});
		});
	});

	describe("Get Releases by Album", () => {
		it("Should return all album's releases", () => {
			return request(app.getHttpServer())
				.get(`/releases?album=${dummyRepository.albumA1.id}`)
				.expect(200)
				.expect((res) => {
					const releases: Release[] = res.body.items;
					expect(releases.length).toBe(2);
					expect(releases[0]).toStrictEqual(expectedReleaseResponse(dummyRepository.releaseA1_1));
					expect(releases[1]).toStrictEqual(expectedReleaseResponse(dummyRepository.releaseA1_2));
				});
		});
		it("Should return all album's releases, sorted by id, desc", () => {
			return request(app.getHttpServer())
				.get(`/releases?album=${dummyRepository.albumA1.id}&sortBy=id&order=desc`)
				.expect(200)
				.expect((res) => {
					const releases: Release[] = res.body.items;
					expect(releases.length).toBe(2);
					expect(releases[0]).toStrictEqual(expectedReleaseResponse(dummyRepository.releaseA1_2));
					expect(releases[1]).toStrictEqual(expectedReleaseResponse(dummyRepository.releaseA1_1));
				});
		});
		it("Should return all album's releases (by slug)", () => {
			return request(app.getHttpServer())
				.get(`/releases?album=${dummyRepository.artistB.slug}+${dummyRepository.albumB1.slug}`)
				.expect(200)
				.expect((res) => {
					const releases: Release[] = res.body.items;
					expect(releases.length).toBe(1);
					expect(releases[0]).toStrictEqual(expectedReleaseResponse(dummyRepository.releaseB1_1));
				});
		});
		it("Should return some album's releases (w/ pagination)", () => {
			return request(app.getHttpServer())
				.get(`/releases?album=${dummyRepository.albumA1.id}&take=1`)
				.expect(200)
				.expect((res) => {
					const releases: Release[] = res.body.items;
					expect(releases.length).toBe(1);
					expect(releases[0]).toStrictEqual(expectedReleaseResponse(dummyRepository.releaseA1_1));
				});
		});
		it("Should include parent album", () => {
			return request(app.getHttpServer())
				.get(`/releases?album=${dummyRepository.compilationAlbumA.id}&with=album`)
				.expect(200)
				.expect((res) => {
					const releases: Release[] = res.body.items;
					expect(releases.length).toBe(1);
					expect(releases[0]).toStrictEqual({
						...expectedReleaseResponse(dummyRepository.compilationReleaseA1),
						album: expectedAlbumResponse(dummyRepository.compilationAlbumA)
					});
				});
		});
	});

	describe('Get Releases by library', () => {
		it("should return every releases, w/ tracks & parent album", () => {
			return request(app.getHttpServer())
				.get(`/releases?library=${dummyRepository.library1.id}&with=album`)
				.expect(200)
				.expect((res) => {
					const releases: Release[] = res.body.items;
					expect(releases.length).toBe(3);
					expect(releases).toContainEqual({
						...expectedReleaseResponse(dummyRepository.releaseA1_1),
						album: expectedAlbumResponse(dummyRepository.albumA1)
					});
					expect(releases).toContainEqual({
						...expectedReleaseResponse(dummyRepository.releaseA1_2),
						album: expectedAlbumResponse(dummyRepository.albumA1)
					});
					expect(releases).toContainEqual({
						...expectedReleaseResponse(dummyRepository.compilationReleaseA1),
						album: expectedAlbumResponse(dummyRepository.compilationAlbumA)
					});
				});
		});
		it("should return every releases, sorted by name", () => {
			return request(app.getHttpServer())
				.get(`/releases?library=${dummyRepository.library1.id}&sortBy=name&order=desc&with=album`)
				.expect(200)
				.expect((res) => {
					const releases: Release[] = res.body.items;
					expect(releases.length).toBe(3);
					expect(releases[0]).toStrictEqual({
						...expectedReleaseResponse(dummyRepository.compilationReleaseA1),
						album: expectedAlbumResponse(dummyRepository.compilationAlbumA)
					});
					expect(releases[1]).toStrictEqual({
						...expectedReleaseResponse(dummyRepository.releaseA1_2),
						album: expectedAlbumResponse(dummyRepository.albumA1)
					});
					expect(releases[2]).toStrictEqual({
						...expectedReleaseResponse(dummyRepository.releaseA1_1),
						album: expectedAlbumResponse(dummyRepository.albumA1)
					});
				});
		});
	});

	describe("Get Tracklist", () => {
		it("should get the tracklist", () => {
			return request(app.getHttpServer())
				.get(`/releases/${dummyRepository.releaseA1_2.id}/tracklist`)
				.expect(200)
				.expect((res) => {
					const tracklist: Tracklist = res.body;
					expect(tracklist).toStrictEqual({
						'1': [expectedTrackResponse(dummyRepository.trackA2_1)],
						'2': [expectedTrackResponse(dummyRepository.trackA1_2Video)],
					});
				});
		});

		it("should get the tracklist, w/ related song", () => {
			return request(app.getHttpServer())
				.get(`/releases/${dummyRepository.releaseA1_2.id}/tracklist?with=song`)
				.expect(200)
				.expect((res) => {
					const tracklist: Tracklist = res.body;
					expect(tracklist).toStrictEqual({
						'1': [{
							...expectedTrackResponse(dummyRepository.trackA2_1),
							song: expectedSongResponse(dummyRepository.songA2)
						}],
						'2': [{
							...expectedTrackResponse(dummyRepository.trackA1_2Video),
							song: expectedSongResponse(dummyRepository.songA1)
						}],
					});
				});
		});

		it("should return an error, as the release does not exist", () => {
			return request(app.getHttpServer())
				.get(`/releases/${-1}/tracklist`)
				.expect(404);
		});
	});

	describe("Get Playlist", () => {
		it("should get the Playlist", () => {
			return request(app.getHttpServer())
				.get(`/releases/${dummyRepository.releaseA1_2.id}/playlist`)
				.expect(200)
				.expect((res) => {
					const tracklist: Track[] = res.body;
					expect(tracklist).toStrictEqual([
						expectedTrackResponse(dummyRepository.trackA2_1),
						expectedTrackResponse(dummyRepository.trackA1_2Video),
					]);
				});
		});

		it("should get the playlist, w/ related song", () => {
			return request(app.getHttpServer())
				.get(`/releases/${dummyRepository.releaseA1_2.id}/playlist?with=song`)
				.expect(200)
				.expect((res) => {
					const tracklist: Track[] = res.body;
					expect(tracklist).toStrictEqual([
						{
							...expectedTrackResponse(dummyRepository.trackA2_1),
							song: expectedSongResponse(dummyRepository.songA2)
						},
						{
							...expectedTrackResponse(dummyRepository.trackA1_2Video),
							song: expectedSongResponse(dummyRepository.songA1)
						},
					]);
				});
		});

		it("should return an error, as the release does not exist", () => {
			return request(app.getHttpServer())
				.get(`/releases/${-1}/playlist`)
				.expect(404);
		});
	});

	describe("Get Related Album", () => {
		it("should get the album", () => {
			return request(app.getHttpServer())
				.get(`/releases/${dummyRepository.releaseB1_1.id}/album`)
				.expect(200)
				.expect((res) => {
					const fetchedAlbum: Album = res.body;
					expect(fetchedAlbum).toStrictEqual(expectedAlbumResponse(dummyRepository.albumB1));
				});
		});
		it("should get the compilation album", () => {
			return request(app.getHttpServer())
				.get(`/releases/${dummyRepository.compilationReleaseA1.id}/album`)
				.expect(200)
				.expect((res) => {
					const fetchedAlbum: Album = res.body;
					expect(fetchedAlbum).toStrictEqual(expectedAlbumResponse(dummyRepository.compilationAlbumA));
				});
		});
		it("should get compilation album w/ related artist", () => {
			return request(app.getHttpServer())
				.get(`/releases/${dummyRepository.compilationReleaseA1.id}/album?with=artist`)
				.expect(200)
				.expect((res) => {
					const fetchedAlbum: Album = res.body;
					expect(fetchedAlbum).toStrictEqual({
						...expectedAlbumResponse(dummyRepository.compilationAlbumA),
						artist: null
					});
				});
		});
		it("should get album w/ parent artist", () => {
			return request(app.getHttpServer())
				.get(`/releases/${dummyRepository.releaseB1_1.id}/album?with=artist`)
				.expect(200)
				.expect((res) => {
					const fetchedAlbum: Album = res.body;
					expect(fetchedAlbum).toStrictEqual({
						...expectedAlbumResponse(dummyRepository.albumB1),
						artist: expectedArtistResponse(dummyRepository.artistB)
					});
				});
		});
		it("should throw, as the release does not exist", () => {
			return request(app.getHttpServer())
				.get(`/releases/-1/album`)
				.expect(404);
		});
	});

	describe("Reassign the release (POST /release/reassign)", () => {
		it("should reassign the release", () => {
			return request(app.getHttpServer())
				.post(`/releases/reassign`)
				.send(<ReassignReleaseDTO>{
					releaseId: dummyRepository.releaseB1_1.id,
					albumId: dummyRepository.albumA1.id
				})
				.expect(201)
				.expect((res) => {
					const release: Release = res.body;
					expect(release).toStrictEqual({
						...expectedReleaseResponse(dummyRepository.releaseB1_1),
						albumId: dummyRepository.albumA1.id
					});
				});
		});
	});

	describe("Set Release as master (POST /releases/:id/master)", () => {
		it("should set release as master", () => {
			return request(app.getHttpServer())
				.put(`/releases/${dummyRepository.releaseA1_2.id}/master`)
				.expect(200)
				.expect((res) => {
					const release: Release = res.body;
					expect(release).toStrictEqual({
						...expectedReleaseResponse(dummyRepository.releaseA1_2),
					});
				});
		});
	});

	
});