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

import { RequireExactlyOne } from "type-fest";
import API from "../../api/api";
import Artist from "../../models/artist";
import { useQuery } from "../../api/use-query";
import ArtistContextualMenu from "../contextual-menu/artist-contextual-menu";
import { WideLoadingComponent } from "../loading/loading";
import RelationPageHeader from "./relation-page-header";
import ArtistAvatar from "../artist-avatar";

type ArtistRelationPageHeaderProps = RequireExactlyOne<{
	artistSlugOrId: number | string;
	artist: Artist;
}>;

const ArtistRelationPageHeader = (props: ArtistRelationPageHeaderProps) => {
	const artist = useQuery(
		(id) => API.getArtist(id, []),
		props.artistSlugOrId,
	);
	const artistData = props.artist ?? artist.data;

	if (!artistData) {
		return <WideLoadingComponent />;
	}
	return (
		<RelationPageHeader
			illustration={<ArtistAvatar artist={artistData} quality="med" />}
			title={artistData.name}
			trailing={<ArtistContextualMenu artist={artistData} />}
		/>
	);
};

export default ArtistRelationPageHeader;
