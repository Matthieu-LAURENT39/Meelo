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

import { ArtistWithRelations } from "../../models/artist";
import Tile from "./tile";
import ArtistContextualMenu from "../contextual-menu/artist-contextual-menu";
import ArtistAvatar from "../artist-avatar";
import { Box } from "@mui/material";

const ArtistTile = (props: {
	artist: ArtistWithRelations<"illustration"> | undefined;
}) => {
	return (
		<Tile
			cardProps={{ sx: { background: "none", boxShadow: "none" } }}
			contextualMenu={
				props.artist && <ArtistContextualMenu artist={props.artist} />
			}
			subtitle={null}
			title={props.artist?.name}
			href={props.artist && `/artists/${props.artist.slug}`}
			illustration={
				<Box sx={{ padding: 1 }}>
					<ArtistAvatar
						illustration={props.artist?.illustration}
						quality="medium"
					/>
				</Box>
			}
		/>
	);
};

export default ArtistTile;
