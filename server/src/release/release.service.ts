/*
 * Meelo is a music server and application to enjoy your personal music files anywhere, anytime you want.
 * Copyright (C) 2023
 *
 * Meelo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Meelo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Inject, Injectable, forwardRef } from "@nestjs/common";
import AlbumService from "src/album/album.service";
import Slug from "src/slug/slug";
import { Release } from "src/prisma/models";
import { Prisma } from "@prisma/client";
import {
	MasterReleaseNotFoundException,
	ReleaseAlreadyExists,
	ReleaseNotEmptyException,
	ReleaseNotFoundException,
	ReleaseNotFoundFromIDException,
} from "./release.exceptions";
import { basename } from "path";
import PrismaService from "src/prisma/prisma.service";
import type ReleaseQueryParameters from "./models/release.query-parameters";
import type AlbumQueryParameters from "src/album/models/album.query-parameters";
import TrackService from "src/track/track.service";
import { buildStringSearchParameters } from "src/utils/search-string-input";
import ArtistService from "src/artist/artist.service";
import FileService from "src/file/file.service";
import archiver from "archiver";
// eslint-disable-next-line no-restricted-imports
import { createReadStream } from "fs";
import { Response } from "express";
import mime from "mime";
import compilationAlbumArtistKeyword from "src/constants/compilation";
import { parseIdentifierSlugs } from "src/identifier/identifier.parse-slugs";
import Identifier from "src/identifier/models/identifier";
import Logger from "src/logger/logger";
import { PrismaError } from "prisma-error-enum";
import IllustrationRepository from "src/illustration/illustration.repository";
import DiscogsProvider from "src/providers/discogs/discogs.provider";
import deepmerge from "deepmerge";
import {
	formatIdentifier,
	formatPaginationParameters,
} from "src/repository/repository.utils";
import { UnhandledORMErrorException } from "src/exceptions/orm-exceptions";
import { PaginationParameters } from "src/pagination/models/pagination-parameters";

@Injectable()
export default class ReleaseService {
	private readonly logger = new Logger(ReleaseService.name);
	constructor(
		protected prismaService: PrismaService,
		@Inject(forwardRef(() => AlbumService))
		private albumService: AlbumService,
		@Inject(forwardRef(() => FileService))
		private fileService: FileService,
		private illustrationRepository: IllustrationRepository,
		private discogsProvider: DiscogsProvider,
	) {}

	/**
	 * Create
	 */
	async create<I extends ReleaseQueryParameters.RelationInclude>(
		input: ReleaseQueryParameters.CreateInput,
		include?: I | undefined,
	) {
		const args = {
			data: {
				name: input.name,
				registeredAt: input.registeredAt,
				releaseDate: input.releaseDate,
				extensions: input.extensions,
				album: {
					connect: AlbumService.formatWhereInput(input.album),
				},
				externalIds: input.discogsId
					? {
							create: {
								provider: {
									connect: {
										name: this.discogsProvider.name,
									},
								},
								value: input.discogsId,
							},
					  }
					: undefined,
				slug: new Slug(input.name, ...input.extensions).toString(),
			},
			include: include ?? ({} as I),
		};
		const release = await this.prismaService.release
			.create<Prisma.SelectSubset<typeof args, Prisma.ReleaseCreateArgs>>(
				args,
			)
			.catch(async (error) => {
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					const parentAlbum = await this.albumService.get(
						input.album,
						{
							artist: true,
						},
					);

					if (error.code == PrismaError.UniqueConstraintViolation) {
						throw new ReleaseAlreadyExists(
							new Slug(input.name),
							parentAlbum.artist
								? new Slug(parentAlbum.artist!.slug)
								: undefined,
						);
					}
				}
				throw new UnhandledORMErrorException(error, input);
			});

		await this.albumService.updateAlbumDate({ id: release.albumId });
		return release;
	}

	async getOrCreate<I extends ReleaseQueryParameters.RelationInclude = {}>(
		input: ReleaseQueryParameters.CreateInput,
		include?: I,
	) {
		try {
			return await this.get(
				{
					bySlug: {
						slug: new Slug(input.name, ...input.extensions),
						album: input.album,
					},
				},
				include,
			);
		} catch {
			return this.create(input, include);
		}
	}

	/**
	 * Get
	 */
	static formatWhereInput(where: ReleaseQueryParameters.WhereInput) {
		return {
			id: where.id,
			slug: where.bySlug?.slug.toString(),
			album: where.bySlug
				? AlbumService.formatWhereInput(where.bySlug.album)
				: undefined,
		};
	}

	static formatManyWhereInput(where: ReleaseQueryParameters.ManyWhereInput) {
		let query: Prisma.ReleaseWhereInput = {
			name: buildStringSearchParameters(where.name),
		};

		if (where.id) {
			query = deepmerge(query, { id: where.id });
		}
		if (where.library) {
			query = deepmerge(query, {
				tracks: {
					some: TrackService.formatManyWhereInput({
						library: where.library,
					}),
				},
			});
		}
		if (where.album) {
			query = deepmerge(query, {
				album: {
					id: where.album.id,
					slug: where.album.bySlug?.slug.toString(),
					artist: where.album.bySlug
						? where.album.bySlug?.artist
							? ArtistService.formatWhereInput(
									where.album.bySlug.artist,
							  )
							: null
						: undefined,
				},
			});
		}
		return query;
	}

	static formatIdentifierToWhereInput(
		identifier: Identifier,
	): ReleaseQueryParameters.WhereInput {
		return formatIdentifier(identifier, (stringIdentifier) => {
			const slugs = parseIdentifierSlugs(stringIdentifier, 3);

			return {
				bySlug: {
					slug: slugs[2],
					album: {
						bySlug: {
							slug: slugs[1],
							artist:
								slugs[0].toString() ==
								compilationAlbumArtistKeyword
									? undefined
									: { slug: slugs[0] },
						},
					},
				},
			};
		});
	}

	formatSortingInput(
		sortingParameter: ReleaseQueryParameters.SortingParameter,
	): Prisma.ReleaseOrderByWithRelationAndSearchRelevanceInput {
		sortingParameter.order ??= "asc";
		switch (sortingParameter.sortBy) {
			case "name":
				return { slug: sortingParameter.order };
			case "trackCount":
				return { tracks: { _count: sortingParameter.order } };
			case "addDate":
				return { registeredAt: sortingParameter.order };
			case "releaseDate":
				return {
					releaseDate: {
						sort: sortingParameter.order,
						nulls: "last",
					},
				};
			default:
				return {
					[sortingParameter.sortBy ?? "id"]: sortingParameter.order,
				};
		}
	}

	async get<I extends ReleaseQueryParameters.RelationInclude = {}>(
		where: ReleaseQueryParameters.WhereInput,
		include?: I,
	) {
		const args = {
			where: ReleaseService.formatWhereInput(where),
			include: include ?? ({} as I),
		};
		return this.prismaService.release
			.findFirstOrThrow<
				Prisma.SelectSubset<
					typeof args,
					Prisma.ReleaseFindFirstOrThrowArgs
				>
			>(args)
			.catch(async (error) => {
				throw await this.onNotFound(error, where);
			});
	}

	async getMany<I extends AlbumQueryParameters.RelationInclude = {}>(
		where: ReleaseQueryParameters.ManyWhereInput,
		sort?: ReleaseQueryParameters.SortingParameter,
		pagination?: PaginationParameters,
		include?: I,
	) {
		const args = {
			include: include ?? ({} as I),
			where: ReleaseService.formatManyWhereInput(where),
			orderBy:
				sort == undefined ? undefined : this.formatSortingInput(sort),
			...formatPaginationParameters(pagination),
		};
		const releases = await this.prismaService.release.findMany<
			Prisma.SelectSubset<typeof args, Prisma.ReleaseFindManyArgs>
		>(args);
		return releases;
	}

	/**
	 * Callback on release not found
	 * @param where the query parameters that failed to get the release
	 */
	async onNotFound(error: Error, where: ReleaseQueryParameters.WhereInput) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code == PrismaError.RecordsNotFound
		) {
			if (where.id != undefined) {
				return new ReleaseNotFoundFromIDException(where.id);
			}
			const parentAlbum = await this.albumService.get(
				where.bySlug.album,
				{ artist: true },
			);
			const releaseSlug: Slug = where.bySlug!.slug;
			const parentArtistSlug = parentAlbum.artist?.slug
				? new Slug(parentAlbum.artist.slug)
				: undefined;

			return new ReleaseNotFoundException(
				releaseSlug,
				new Slug(parentAlbum.slug),
				parentArtistSlug,
			);
		}
		return new UnhandledORMErrorException(error, where);
	}

	/**
	 * Fetch the master release of an album
	 * @param where the parameters to find the parent album
	 * @param include the relation to include in the returned objects
	 * @returns
	 */
	async getMasterRelease<I extends ReleaseQueryParameters.RelationInclude>(
		where: AlbumQueryParameters.WhereInput,
		include?: I,
	) {
		const args = {
			where: { album: AlbumService.formatWhereInput(where) },
			include: include ?? ({} as I),
			orderBy: { id: "asc" as const },
		};
		return this.albumService.get(where).then(async (album) => {
			if (album.masterId != null) {
				return this.get({ id: album.masterId }, include);
			}
			return this.prismaService.release
				.findFirstOrThrow<
					Prisma.SelectSubset<
						typeof args,
						Prisma.ReleaseFindFirstOrThrowArgs
					>
				>(args)
				.catch(() => {
					throw new MasterReleaseNotFoundException(
						new Slug(album.slug),
					);
				});
		});
	}

	/**
	 * Updates the release in the database
	 * @param what the fields to update in the release
	 * @param where the query parameters to fin the release to update
	 */
	async update(
		what: ReleaseQueryParameters.UpdateInput,
		where: ReleaseQueryParameters.WhereInput,
	) {
		const updatedRelease = await this.prismaService.release
			.update({
				data: {
					...what,
					album: what.album
						? {
								connect: AlbumService.formatWhereInput(
									what.album,
								),
						  }
						: undefined,
					slug: what.name
						? new Slug(what.name).toString()
						: undefined,
				},
				where: ReleaseService.formatWhereInput(where),
			})
			.catch(async (error) => {
				throw await this.onNotFound(error, where);
			});

		await this.albumService.updateAlbumDate({ id: updatedRelease.albumId });
		return updatedRelease;
	}

	/**
	 * Deletes a release
	 * Also delete related tracks.
	 * @param where Query parameters to find the release to delete
	 */
	async delete(where: ReleaseQueryParameters.DeleteInput): Promise<Release> {
		this.illustrationRepository
			.getReleaseIllustrations(where)
			.then((relatedIllustrations) => {
				Promise.allSettled(
					relatedIllustrations.map(({ illustration }) =>
						this.illustrationRepository.deleteIllustration(
							illustration.id,
						),
					),
				);
			});
		return this.prismaService.release
			.delete({
				where: ReleaseService.formatWhereInput(where),
			})
			.then((deleted) => {
				this.logger.warn(`Release '${deleted.slug}' deleted`);
				return deleted;
			})
			.catch((error) => {
				if (
					error instanceof Prisma.PrismaClientKnownRequestError &&
					error.code == PrismaError.ForeignConstraintViolation
				) {
					throw new ReleaseNotEmptyException(where.id);
				}
				throw new UnhandledORMErrorException(error, where);
			});
	}

	/**
	 * Calls 'delete' on all releases that do not have tracks
	 */
	async housekeeping(): Promise<void> {
		const emptyReleases = await this.prismaService.release
			.findMany({
				select: {
					id: true,
					_count: {
						select: { tracks: true },
					},
				},
			})
			.then((releases) =>
				releases.filter((release) => !release._count.tracks),
			);

		await Promise.all(emptyReleases.map(({ id }) => this.delete({ id })));
	}

	async pipeArchive(where: ReleaseQueryParameters.WhereInput, res: Response) {
		const release = await this.prismaService.release
			.findFirstOrThrow({
				where: ReleaseService.formatWhereInput(where),
				include: { tracks: true, album: { include: { artist: true } } },
			})
			.catch(async (err) => {
				throw await this.onNotFound(err, where);
			});
		const illustration =
			await this.illustrationRepository.getReleaseIllustrationResponse(
				where,
			);
		const archive = archiver("zip");
		const outputName = `${release.slug}.zip`;

		await Promise.all(
			release.tracks.map((track) =>
				this.fileService.buildFullPath({ id: track.sourceFileId }),
			),
		).then((paths) =>
			paths.forEach((path) => {
				archive.append(createReadStream(path), {
					name: basename(path),
				});
			}),
		);
		if (illustration) {
			const illustrationPath =
				this.illustrationRepository.buildIllustrationPath(
					illustration.id,
				);

			archive.append(createReadStream(illustrationPath), {
				name: basename(illustrationPath),
			});
		}

		res.set({
			"Content-Disposition": `attachment; filename="${outputName}"`,
			"Content-Type":
				mime.getType(outputName) ?? "application/octet-stream",
		});
		archive.pipe(res);
		archive.finalize();
	}
}
