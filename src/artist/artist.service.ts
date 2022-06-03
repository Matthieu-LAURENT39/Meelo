import { Injectable } from '@nestjs/common';
import { Slug } from 'src/slug/slug';
import { ArtistalreadyExistsException, ArtistNotFoundException } from './artist.exceptions';
import { Artist, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ArtistService {
	constructor(
		private prismaService: PrismaService
	) {}
	/**
	 * Find an artist by its slug
	 * @param artistSlug the slug of the artist to find
	 */
	async getArtist(artistSlug: Slug, include?: Prisma.ArtistInclude): Promise<Artist> {
		try {
			return await this.prismaService.artist.findFirst({
				rejectOnNotFound: true,
				where: {
					slug: {
						equals: artistSlug.toString()
					}
				},
				include: include
			});
		} catch {
			throw new ArtistNotFoundException(artistSlug);
		};
	}

	async createArtist(artistName: string): Promise<Artist> {
		let artistSlug: Slug = new Slug(artistName);
		try {
			return await this.prismaService.artist.create({
				data: {
					name: artistName,
					slug: artistSlug.toString(),
				}
			});
		} catch {
			throw new ArtistalreadyExistsException(artistSlug);
		}
	}

	/**
	 * Find an artist by its name, or creates one if not found
	 * @param artistName the slug of the artist to find
	 */
	 async getOrCreateArtist(artistName: string): Promise<Artist> {
		try {
			return await this.getArtist(new Slug(artistName));
		} catch {
			return await this.createArtist(artistName);
		}
	}
}
