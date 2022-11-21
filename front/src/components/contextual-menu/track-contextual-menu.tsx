import { Star } from "@mui/icons-material";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import { useMutation, useQueryClient } from "react-query";
import API from "../../api";
import { TrackWithSong } from "../../models/track";
import {
	DownloadAction, GoToReleaseAction, PlayAfterAction, PlayNextAction
} from "./actions";
import ContextualMenu from "./contextual-menu";

type TrackContextualMenuProps = {
	track: TrackWithSong;
	onSelect?: () => void;
}

const TrackContextualMenu = (props: TrackContextualMenuProps) => {
	const router = useRouter();
	const queryClient = useQueryClient();
	const getPlayNextProps = () => API.getArtist(props.track.song.artistId)
		.then((artist) => API.getRelease(props.track.releaseId)
			.then((release) => ({ track: props.track, artist, release })));
	const masterMutation = useMutation(async () => {
		return API.setTrackAsMaster(props.track.id)
			.then(() => {
				toast.success("Track set as master!");
				queryClient.invalidateQueries();
			})
			.catch((error: Error) => toast.error(error.message));
	});

	return <ContextualMenu onSelect={props.onSelect} actions={[
		[GoToReleaseAction(props.track.releaseId),],
		[PlayNextAction(getPlayNextProps), PlayAfterAction(getPlayNextProps)],
		[
			{
				label: "Set as as Master",
				disabled: props.track.master,
				icon: <Star/>,
				onClick: () => masterMutation.mutate()
			}
		],
		[DownloadAction(router, props.track.stream)]
	]}/>;
};

export default TrackContextualMenu;
