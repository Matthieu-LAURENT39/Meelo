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

import { Chip, Grid, Skeleton, Typography, useTheme } from "@mui/material";
import Link from "next/link";
import IllustrationModel from "../../models/illustration";
import Illustration from "../illustration";
import { useMemo } from "react";
import { useAccentColor } from "../../utils/accent-color";

type HighlightCardProps = {
	title: string | undefined;
	illustration: IllustrationModel | undefined | null;
	headline: string | undefined;
	body: string | JSX.Element | undefined;
	href: string | undefined;
	tags: { label: string; href: string }[];
};

const HighlightCard = (props: HighlightCardProps) => {
	const theme = useTheme();
	const accentColor = useAccentColor(props.illustration);

	const cardColor = useMemo(() => {
		if (accentColor !== null) {
			const themePaperColor = `rgba(${theme.vars.palette.background.defaultChannel} / 0.75)`;
			return {
				[theme.getColorSchemeSelector("light")]: {
					backgroundColor: `color-mix(in srgb, ${accentColor.light} 40%, ${themePaperColor})`,
				},
				[theme.getColorSchemeSelector("dark")]: {
					backgroundColor: `color-mix(in srgb, ${accentColor.dark} 40%, ${themePaperColor})`,
				},
			};
		}
		return {
			backgroundColor: `rgba(${theme.vars.palette.background.defaultChannel} / 0.40)`,
		};
	}, [accentColor, theme]);
	const style = {
		...cardColor,
		boxShadow: "none",
		transform: "scale(1)",
		transition: "transform 0.2s",
		":hover": {
			transform: "scale(1.03)",
			boxShadow: 5,
		},
	} as const;

	return (
		<Link href={props.href ?? {}} passHref legacyBehavior>
			<Grid
				container
				sx={{
					aspectRatio: "2.5",
					width: "100%",
					height: "100%",
					flexWrap: "nowrap",
					...style,
					overflow: "hidden",
					cursor: "pointer",
				}}
				style={{ borderRadius: theme.shape.borderRadius }}
			>
				<Grid item sx={{ aspectRatio: "1", height: "100%" }}>
					<Illustration
						illustration={props.illustration}
						imgProps={{ borderRadius: 0 }}
						quality="medium"
					/>
				</Grid>
				<Grid
					item
					container
					sx={{ width: "100%", overflow: "hidden" }}
					direction="column"
					padding={2}
				>
					<Grid item sx={{ width: "100%" }}>
						<Typography
							variant="h6"
							noWrap
							style={{
								overflow: "hidden",
								textOverflow: "ellipsis",
								width: "100%",
								paddingRight: 1,
							}}
						>
							{props.headline ?? <Skeleton variant="text" />}
						</Typography>
					</Grid>
					<Grid
						item
						xs
						sx={{
							overflow: "scroll",
							marginRight: -2,
							paddingY: 1,
							paddingRight: 2,
						}}
					>
						<Typography
							variant="body1"
							color="text.disabled"
							lineHeight={1.5}
						>
							{props.body ?? <Skeleton variant="text" />}
						</Typography>
					</Grid>
					{props.tags.length > 0 && (
						<Grid
							item
							container
							columnSpacing={1}
							sx={{ height: 32, overflow: "hidden" }}
						>
							{props.tags.map((tag, index) => (
								<Grid key={index} item>
									<Link href={tag.href} key={index}>
										<Chip
											variant="filled"
											clickable
											label={tag.label}
										/>
									</Link>
								</Grid>
							))}
						</Grid>
					)}
				</Grid>
			</Grid>
		</Link>
	);
};

export default HighlightCard;
