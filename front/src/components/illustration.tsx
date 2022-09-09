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
	return <FadeIn>
		<Box
			{...props}
        	component="img"
        	sx={{ borderRadius: '3%' }}
        	src={API.getIllustrationURL(props.url)}
      	/>
		
	</FadeIn>
}

export default Illustration;