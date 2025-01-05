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

import { InfoIcon } from "../icons";
import Action from "./action";
import { useConfirm } from "material-ui-confirm";
import API from "../../api/api";
import { openTrackFileInfoModal } from "../track-file-info";
import { QueryClient } from "../../api/use-query";

export const ShowTrackFileInfoAction = (
	confirm: ReturnType<typeof useConfirm>,
	trackId: number,
): Action => ({
	icon: <InfoIcon />,
	label: "moreInfo",
	onClick: () => openTrackFileInfoModal(confirm, trackId),
});

export const ShowMasterTrackFileInfoAction = (
	confirm: ReturnType<typeof useConfirm>,
	queryClient: QueryClient,
	songId: number,
): Action => ({
	icon: <InfoIcon />,
	label: "moreInfo",
	onClick: () =>
		queryClient
			.fetchQuery(API.getSongMasterTrack(songId))
			.then((track) => openTrackFileInfoModal(confirm, track.id)),
});
