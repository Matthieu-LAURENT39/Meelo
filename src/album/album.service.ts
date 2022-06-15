import { Injectable, Logger } from '@nestjs/common';
import { ArtistService } from 'src/artist/artist.service';
import { Slug } from 'src/slug/slug';
import { AlbumAlreadyExistsException, AlbumNotFoundException } from './album.exceptions';
import { AlbumType, Album, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AlbumService {
	constructor(
		private prismaService: PrismaService,
		private artistServce: ArtistService
	) {}

	/**
	 * Find an album from its slug and its artist's slug
	 * @param albumSlug the slug of the album to find
	 * @param artistSlug the slug of the artist of the album
	 */
	async getAlbum(albumSlug: Slug, artistSlug?: Slug, include?: Prisma.AlbumInclude) {
		try {
			return await this.prismaService.album.findFirst({
				rejectOnNotFound: true,
				where: {
					slug: {
						equals: albumSlug.toString()
					},
					artist: artistSlug !== undefined ? {
						slug: {
							equals: artistSlug!.toString()
						}
					} : undefined
				},
				include: {
					releases: include?.releases ?? false,
					artist: include?.artist ?? false
				}
			})
		} catch {
			throw new AlbumNotFoundException(albumSlug, artistSlug);
		}
	}
	/**
	 * Find an existing album from a potential release name
	 * @param releaseName the name of the potential release
	 * @param artistSlug the slug of the artist, if applicable
	 * @param include 
	 */
	async getCandidateAlbumFromReleaseName(releaseName: string, artistSlug?: Slug, include?: Prisma.AlbumInclude) {
		let releaseSlug: Slug = new Slug(releaseName);
		let albums =  await this.prismaService.album.findMany({
			where: {
				artist: artistSlug !== undefined ? {
					slug: {
						equals: artistSlug!.toString()
					}
				} : undefined
			},
			include: {
				releases: include?.releases ?? false,
				artist: include?.artist ?? false
			}
		});
		for (const album of albums) {
			if (album.slug == releaseName.toString() ||
				album.slug.includes(releaseSlug.toString()) ||
				releaseSlug.toString().includes(album.slug)
			)
			return album;
		}
		throw new AlbumNotFoundException(releaseSlug, artistSlug);
	}

	async updateAlbum(album: Album): Promise<Album> {
		return await this.prismaService.album.update({
			data: {
				name: album.name,
				releaseDate: album.releaseDate,
				type: album.type,
				artistId: album.artistId,
				slug: new Slug(album.name).toString()
			},
			where: {
				id: album.id
			}
		});
	}

	static getAlbumTypeFromName(albumName: string): AlbumType {
		albumName = albumName.toLowerCase();
		if (albumName.search(/.+(live).*/g) != -1 ||
			albumName.includes(' tour')) {
			return AlbumType.LiveRecording
		}
		if (albumName.endsWith('- single') ||
			albumName.endsWith('(remixes)')) {
			return AlbumType.Single
		}
		if (albumName.includes('best of') ||
			albumName.includes('best mixes')) {
			return AlbumType.Compilation
		}
		return AlbumType.StudioRecording;
	}

	async createAlbum(albumName: string, artistName?: string, releaseDate?: Date, include?: Prisma.AlbumInclude) {
		let albumSlug: Slug = new Slug(albumName);

		if (artistName === undefined) {
			let albumExists: boolean = false;
			try {
				await this.getAlbum(albumSlug);
				albumExists = true;
			} catch {}
			if (albumExists)
				throw new AlbumAlreadyExistsException(albumSlug);
		}
		try {
			return await this.prismaService.album.create({
				data: {
					name: albumName,
					slug: albumSlug.toString(),
					artistId: artistName ? (await this.artistServce.getOrCreateArtist(artistName!)).id : null,
					releaseDate: releaseDate,
					type: AlbumService.getAlbumTypeFromName(albumName)
				},
				include: {
					releases: include?.releases ?? false,
					artist: include?.artist ?? false
				}
			});
		} catch {
			throw new AlbumAlreadyExistsException(albumSlug, new Slug(artistName!));
		}

	}

	async findOrCreate(albumName: string, artistName?: string, include?: Prisma.AlbumInclude) {
		try {
			return await this.getAlbum(new Slug(albumName), artistName ? new Slug(artistName) : undefined, include);
		} catch {
			return await this.createAlbum(albumName, artistName, undefined, include);
		}
	}
}
