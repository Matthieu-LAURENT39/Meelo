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

import { useRouter } from "next/router";
import { useState } from "react";
import {
	SongSortingKeys,
	SongType,
	SongWithRelations,
} from "../../../models/song";
import Controls, { OptionState } from "../../controls/controls";
import SongItem from "../../list-item/song-item";
import InfiniteView from "../infinite-view";
import InfiniteResourceViewProps from "./infinite-resource-view-props";
import { useLanguage } from "../../../i18n/translate";

type AdditionalProps = {
	type?: SongType;
};

const InfiniteSongView = (
	props: InfiniteResourceViewProps<
		SongWithRelations<"artist" | "featuring">,
		typeof SongSortingKeys,
		AdditionalProps
	> &
		Pick<Parameters<typeof SongItem>[0], "formatSubtitle">,
) => {
	const router = useRouter();
	const [options, setOptions] =
		useState<OptionState<typeof SongSortingKeys, AdditionalProps>>();
	const language = useLanguage();

	return (
		<>
			<Controls
				options={[
					{
						label: (options?.type as SongType) ?? "All",
						name: "type",
						values: [
							"All",
							...SongType.filter((type) => type != "Unknown"),
						],
						currentValue: options?.type,
					},
				]}
				onChange={setOptions}
				sortingKeys={SongSortingKeys}
				defaultSortingOrder={props.initialSortingOrder}
				defaultSortingKey={props.initialSortingField}
				router={props.light == true ? undefined : router}
				disableLayoutToggle
				defaultLayout={"list"}
			/>
			<InfiniteView
				view={options?.view ?? "list"}
				query={() =>
					props.query({
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						type:
							options?.type == "All"
								? undefined
								: (options?.type as SongType),
						sortBy: options?.sortBy ?? "name",
						order: options?.order ?? "asc",
						view: "grid",
						library: options?.library ?? null,
					})
				}
				renderListItem={(
					item: SongWithRelations<"artist" | "featuring">,
				) => (
					<SongItem
						song={item}
						key={item.id}
						formatSubtitle={props.formatSubtitle}
					/>
				)}
				renderGridItem={(
					item: SongWithRelations<"artist" | "featuring">,
				) => <></>}
			/>
		</>
	);
};

export default InfiniteSongView;
