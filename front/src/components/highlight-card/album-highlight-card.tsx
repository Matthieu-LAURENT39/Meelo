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

import { useTranslation } from "react-i18next";
import { AlbumWithRelations } from "../../models/album";
import getYear from "../../utils/getYear";
import HighlightCard from "./highlight-card";

type AlbumHighlightCardProps = {
	album: AlbumWithRelations<"artist" | "externalIds" | "genres"> | undefined;
};
const AlbumHighlightCard = ({ album }: AlbumHighlightCardProps) => {
	const { t } = useTranslation();
	return (
		<HighlightCard
			title={album?.name}
			headline={album?.name}
			body={
				album?.externalIds
					.map((id) => id.description)
					.filter((desc): desc is string => desc !== null)
					.sort((descA, descB) => descA.length - descB.length)
					.at(0) ||
				[
					album ? album.artist?.name ?? t("compilation") : undefined,
					album ? getYear(album.releaseDate) : undefined,
				]
					.filter((elem) => elem != null)
					.join(" - ")
			}
			tags={
				album?.genres.map(({ name, slug }) => ({
					label: name,
					href: `/genres/${slug}`,
				})) ?? []
			}
			illustration={album?.illustration}
			href={
				album
					? `/albums/${album.artist?.slug ?? "compilations"}+${
							album.slug
						}`
					: undefined
			}
		/>
	);
};

export default AlbumHighlightCard;
