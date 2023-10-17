import { Box, Stack } from "@mui/material";
import API from "../api/api";
import prepareSSR from "../ssr";
import { useInfiniteQuery } from "../api/use-query";
import LoadingPage from "../components/loading/loading-page";
import SectionHeader from "../components/section-header";
import TileRow from "../components/tile-row";
import AlbumTile from "../components/tile/album-tile";
import ArtistTile from "../components/tile/artist-tile";
import SongGrid from "../components/song-grid";
import ReleaseTile from "../components/tile/release-tile";
import Translate from "../i18n/translate";
import Fade from "../components/fade";

const newlyAddedAlbumsQuery = API.getAlbums(
	{ },
	{ sortBy: 'addDate', order: 'desc' },
	['artist']
);

const newestAlbumsQuery = API.getAlbums(
	{ },
	{ sortBy: 'releaseDate', order: 'desc' },
	['artist']
);

const newlyAddedArtistsQuery = API.getArtists(
	{},
	{ sortBy: 'addDate', order: 'desc' },
);

const newlyAddedReleasesQuery = API.getReleases(
	{},
	{ sortBy: 'addDate', order: 'desc' },
	['album']
);

const mostListenedSongsQuery = API.getSongs(
	{ },
	{ sortBy: 'playCount', order: 'desc' },
	['artist']
);

const HomePageSection = <T, >(
	props: {
		heading: string | JSX.Element,
		queryData: { data?: { pages?: { items?: T[] }[] } },
		render: (items: T[]) => JSX.Element
	}
) => {
	const items = props.queryData.data?.pages?.at(0)?.items;

	if (!items || items.length == 0) {
		return <></>;
	}
	return <Stack spacing={3}>
		<SectionHeader heading={props.heading}/>
		<Box sx={{ maxHeight: '20%' }}>
			{props.render(items.slice(0, 12))}
		</Box>
	</Stack>;
};

export const getServerSideProps = prepareSSR(() => {
	return {
		infiniteQueries: [
			newlyAddedArtistsQuery,
			newestAlbumsQuery,
			newlyAddedAlbumsQuery,
			newlyAddedReleasesQuery,
			mostListenedSongsQuery
		]
	};
});

const HomePage = () => {
	const newlyAddedAlbums = useInfiniteQuery(() => newlyAddedAlbumsQuery);
	const newlyAddedArtists = useInfiniteQuery(() => newlyAddedArtistsQuery);
	const newlyAddedReleases = useInfiniteQuery(() => newlyAddedReleasesQuery);
	const mostListenedSongs = useInfiniteQuery(() => mostListenedSongsQuery);
	const newestAlbums = useInfiniteQuery(() => newestAlbumsQuery);
	const tileRowWindowSize = {
		xs: 3,
		sm: 5,
		md: 6,
		lg: 7,
		xl: 10
	};

	if ([newestAlbums, newlyAddedAlbums, newlyAddedArtists, mostListenedSongs, newlyAddedReleases]
		.find((query) => query.isLoading)
	) {
		return <LoadingPage/>;
	}

	return <Fade in>
		<Stack spacing={4} my={2}>
			<HomePageSection
				heading={<Translate translationKey='newlyAddedAlbums'/>}
				queryData={newlyAddedAlbums}
				render={(albums) => <TileRow tiles={
					albums.map((album, index) => <AlbumTile key={index} album={album}/>)
				} windowSize={tileRowWindowSize}/>}
			/>
			<HomePageSection
				heading={<Translate translationKey='latestAlbums'/>}
				queryData={newestAlbums}
				render={(albums) => <TileRow tiles={
					albums.map((album, index) => <AlbumTile key={index} album={album}/>)
				} windowSize={tileRowWindowSize}/>}
			/>
			<HomePageSection
				heading={<Translate translationKey='newlyAddedArtists'/>}
				queryData={newlyAddedArtists}
				render={(artists) => <TileRow tiles={
					artists.map((artist, index) => <ArtistTile key={index} artist={artist}/>)
				} windowSize={tileRowWindowSize}/>}
			/>
			<HomePageSection
				heading={<Translate translationKey='newlyAddedReleases'/>}
				queryData={newlyAddedReleases}
				render={(releases) => <TileRow tiles={
					releases.map((release, index) => <ReleaseTile key={index} release={release}/>)
				} windowSize={tileRowWindowSize}/>}
			/>
			<HomePageSection
				heading={<Translate translationKey='mostPlayedSongs'/>}
				queryData={mostListenedSongs}
				render={(songs) => <SongGrid songs={songs}/>}
			/>
		</Stack>
	</Fade>;
};

export default HomePage;
