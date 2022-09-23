import { Box, IconButton } from "@mui/material";
import Image, { ImageProps } from "next/image";
import { useEffect, useState } from "react";
import FadeIn from "react-fade-in";
import { useQuery } from "react-query";
import API from "../api";
import LoadingComponent, { WideLoadingComponent } from "./loading/loading";

type IllustrationProps = {
	/**
	 * URL of the illustration to display
	 * Must be an URL from an API response
	 */
	url: string;
	/**
	 * An icon to display when illustration rendering failed
	 */
	fallback: JSX.Element;
} & Omit<ImageProps, 'src'>

const Illustration = (props: IllustrationProps) => {
	const [loadingFailed, setLoadingFailed] = useState(false);
	return <FadeIn>
		<Box sx={{ aspectRatio: '1', justifyContent: 'center', alignItems: 'center', display: loadingFailed ? 'flex' : undefined }}>
			{ loadingFailed
				? <IconButton disabled sx={{ fontSize: 'large' }}>
					{props.fallback}
				</IconButton>
				: <Image
					onError={() => setLoadingFailed(true)}
					loader={({ src }) => src}
					width={1}
					height={1}
					objectFit="contain"
					layout="responsive"
					{...props}
					style={{ ...props.style, borderRadius: '3%', width: 'auto' }}
					src={API.getIllustrationURL(props.url)}
				/>
			}
		</Box>
	</FadeIn>
}

export default Illustration;