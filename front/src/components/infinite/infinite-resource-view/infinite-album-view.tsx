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

import {
	AlbumSortingKeys,
	AlbumType,
	AlbumWithRelations,
} from "../../../models/album";
import AlbumItem from "../../list-item/album-item";
import AlbumTile from "../../tile/album-tile";
import Controls, { OptionState } from "../../controls/controls";
import InfiniteView from "../infinite-view";
import { useRouter } from "next/router";
import { useState } from "react";
import InfiniteResourceViewProps from "./infinite-resource-view-props";
import { translate, useLanguage } from "../../../i18n/translate";

type AdditionalProps = { type?: AlbumType };

const InfiniteAlbumView = (
	props: InfiniteResourceViewProps<
		AlbumWithRelations<"artist">,
		typeof AlbumSortingKeys,
		AdditionalProps
	> &
		Pick<Parameters<typeof AlbumTile>[0], "formatSubtitle"> & {
			defaultAlbumType: AlbumType | null;
		},
) => {
	const router = useRouter();
	const [options, setOptions] = useState<
		OptionState<typeof AlbumSortingKeys, AdditionalProps>
	>({
		type: props.defaultAlbumType ?? undefined,
		library: null,
		order: props.initialSortingOrder ?? "asc",
		sortBy: props.initialSortingField ?? "name",
		view: props.defaultLayout ?? "grid",
	});
	const language = useLanguage();

	return (
		<>
			<Controls
				options={[
					{
						label: translate((options?.type as AlbumType) ?? "All"),
						name: "type",
						values: ["All", ...AlbumType],
						currentValue: options?.type ?? undefined,
					},
				]}
				onChange={setOptions}
				sortingKeys={AlbumSortingKeys}
				defaultSortingOrder={props.initialSortingOrder}
				defaultSortingKey={props.initialSortingField}
				router={props.light == true ? undefined : router}
				defaultLayout={props.defaultLayout ?? "grid"}
			/>
			<InfiniteView
				view={options?.view ?? props.defaultLayout ?? "grid"}
				query={() =>
					props.query({
						library: options?.library,
						view: options?.view ?? props.defaultLayout ?? "grid",
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						type:
							// @ts-ignore
							options?.type == "All" ? undefined : options?.type,
						sortBy: options?.sortBy ?? AlbumSortingKeys[0],
						order: options?.order ?? "asc",
					})
				}
				renderListItem={(item: AlbumWithRelations<"artist">) => (
					<AlbumItem
						album={item}
						key={item.id}
						formatSubtitle={props.formatSubtitle}
					/>
				)}
				renderGridItem={(item: AlbumWithRelations<"artist">) => (
					<AlbumTile
						album={item}
						key={item.id}
						formatSubtitle={props.formatSubtitle}
					/>
				)}
			/>
		</>
	);
};

export default InfiniteAlbumView;
