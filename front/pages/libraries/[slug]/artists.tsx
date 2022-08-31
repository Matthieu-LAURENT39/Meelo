import React, { useState } from 'react';
import MeeloAppBar from "../../../src/components/appbar/appbar";
import { NextPage } from "next";
import { Box, Card, Grid, CardContent, Typography, ButtonBase, CardActionArea, CardMedia, IconButton, Paper } from '@mui/material';
import API from '../../../src/api';
import { useRouter } from 'next/router';
import Artist from '../../../src/models/artist';
import FadeIn from 'react-fade-in/lib/FadeIn';

import ArtistTile from '../../../src/components/tile/artist-tile';
import { InfiniteGrid } from '../../../src/components/infinite-list';

const LibraryArtistsPage: NextPage = () => {
	const router = useRouter();
	const { slug } = router.query;
	return <>
		<MeeloAppBar/>
		<InfiniteGrid
			fetch={(lastPage, pageSize) => API.getAllArtistsInLibrary(
				slug as string,
				{ index: lastPage?.index, pageSize: pageSize }
			)}
			queryKey={['libraries', slug as string, 'artists']}
			render={(item: Artist) => <ArtistTile artist={item} />}
		/>
	</>;
}


export default LibraryArtistsPage;