import { Controller, DefaultValuePipe, forwardRef, Get, Inject, Param, ParseBoolPipe, Query, Req } from '@nestjs/common';
import AlbumService from 'src/album/album.service';
import AlbumQueryParameters from 'src/album/models/album.query-parameters';
import PaginatedResponse from 'src/pagination/models/paginated-response';
import { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import ParsePaginationParameterPipe from 'src/pagination/pagination.pipe';
import SongQueryParameters from 'src/song/models/song.query-params';
import SongService from 'src/song/song.service';
import ParseArtistIdentifierPipe from './artist.pipe';
import ArtistService from './artist.service';
import ArtistQueryParameters from './models/artist.query-parameters';
import type { Request } from 'express';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import TrackQueryParameters from 'src/track/models/track.query-parameters';
import TrackService from 'src/track/track.service';
import { Artist, TrackType } from '@prisma/client';

@ApiTags("Artists")
@Controller('artists')
export default class ArtistController {
	constructor(
		@Inject(forwardRef(() => ArtistService))
		private artistService: ArtistService,
		@Inject(forwardRef(() => AlbumService))
		private albumService: AlbumService,
		@Inject(forwardRef(() => SongService))
		private songService: SongService,
		@Inject(forwardRef(() => TrackService))
		private trackService: TrackService
	) {}

	@ApiOperation({
		summary: 'Get all artists'
	})
	@ApiQuery({
		name: 'albumArtistOnly',
		required: false
	})
	@Get()
	async getMany(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', ArtistQueryParameters.ParseRelationIncludePipe)
		include: ArtistQueryParameters.RelationInclude,
		@Query(ArtistQueryParameters.ParseSortingParameterPipe)
		sortingParameter: ArtistQueryParameters.SortingParameter,
		@Query('albumArtistOnly', new DefaultValuePipe(false), ParseBoolPipe)
		albumArtistsOnly: boolean = false,
		@Req() request: Request
	) {
		let artists: Artist[];
		if (albumArtistsOnly) {
			artists = await this.artistService.getAlbumsArtists(
				{}, paginationParameters, include, sortingParameter
			);
		} else {
			artists = await this.artistService.getMany(
				{}, paginationParameters, include, sortingParameter
			);
		}
		return new PaginatedResponse(
			await Promise.all(artists.map((artist) => this.artistService.buildResponse(artist))),
			request
		);
	}

	@ApiOperation({
		summary: 'Get one artist'
	})
	@Get(':idOrSlug')
	async get(
		@Param(ParseArtistIdentifierPipe)
		where: ArtistQueryParameters.WhereInput,
		@Query('with', ArtistQueryParameters.ParseRelationIncludePipe)
		include: ArtistQueryParameters.RelationInclude
	) {
		let artist = await this.artistService.get(where, include);
		return await this.artistService.buildResponse(artist);
	}

	@ApiOperation({
		summary: 'Get all the video tracks from an artist'
	})
	@Get(':idOrSlug/videos')
	async getArtistVideos(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', TrackQueryParameters.ParseRelationIncludePipe)
		include: TrackQueryParameters.RelationInclude,
		@Query(TrackQueryParameters.ParseSortingParameterPipe)
		sortingParameter: TrackQueryParameters.SortingParameter,
		@Param(ParseArtistIdentifierPipe)
		where: ArtistQueryParameters.WhereInput,
		@Req() request: Request
	) {
		const videoTracks = await this.trackService.getMany(
			{ byArtist: where, type: TrackType.Video }, paginationParameters, include, sortingParameter, 
		);
		if (videoTracks.length == 0)
			await this.artistService.throwIfNotExist(where);
		return new PaginatedResponse(
			await Promise.all(videoTracks.map(
				(videoTrack) => this.trackService.buildResponse(videoTrack)
			)),
			request
		);
	}

	@ApiOperation({
		summary: 'Get all albums from an artist'
	})
	@Get(':idOrSlug/albums')
	async getArtistAlbums(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Param(ParseArtistIdentifierPipe)
		where: ArtistQueryParameters.WhereInput,
		@Query(AlbumQueryParameters.ParseSortingParameterPipe)
		sortingParameter: AlbumQueryParameters.SortingParameter,
		@Query('with', AlbumQueryParameters.ParseRelationIncludePipe)
		include: AlbumQueryParameters.RelationInclude,
		@Req() request: Request
	) {
		let albums = await this.albumService.getMany(
			{ byArtist: where }, paginationParameters, include, sortingParameter
		);
		if (albums.length == 0)
			await this.artistService.throwIfNotExist(where);
		return new PaginatedResponse(
			await Promise.all(albums.map((album) => this.albumService.buildResponse(album))),
			request
		);
	}

	@ApiOperation({
		summary: 'Get all songs from an artist',
	})
	@Get(':idOrSlug/songs')
	async getArtistSongs(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Param(ParseArtistIdentifierPipe)
		where: ArtistQueryParameters.WhereInput,
		@Query(SongQueryParameters.ParseSortingParameterPipe)
		sortingParameter: SongQueryParameters.SortingParameter,
		@Query('with', SongQueryParameters.ParseRelationIncludePipe)
		include: SongQueryParameters.RelationInclude,
		@Req() request: Request
	) {
		let songs = await this.songService.getMany(
			{ artist: where }, paginationParameters, include, sortingParameter
		);
		if (songs.length == 0)
			await this.artistService.throwIfNotExist(where);
		return new PaginatedResponse(
			await Promise.all(songs.map((song) => this.songService.buildResponse(song))),
			request
		);
	}
}
