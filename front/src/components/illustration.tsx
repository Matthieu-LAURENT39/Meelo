import { Box } from "@mui/material";
import Image from "next/image";
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
} & React.ImgHTMLAttributes<HTMLImageElement>

const Illustration = (props: IllustrationProps) => {
	const [illustrationURL, setIllustrationURL] = useState(props.url);
	const [illustration, setIllustration] = useState<string | null>(null);
	useEffect(() => {
		fetch(API.getIllustrationURL(illustrationURL), { redirect: 'follow' }).then((response) => {
			if (response.redirected) {
				setIllustrationURL(new URL(response.url).pathname);
			} else {
				response.blob().then((blob) => setIllustration(URL.createObjectURL(blob)));
			}
		});
	}, [illustrationURL]);

	if (illustration == null)
		return <></>;
	return <FadeIn>
		<Box
			{...props}
        	component="img"
        	sx={{ borderRadius: '3%' }}
        	src={illustration}
      	/>
		
	</FadeIn>
}

export default Illustration;