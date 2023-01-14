import { AutoMode, CleaningServices } from "@mui/icons-material";
import toast from "react-hot-toast";
import API from "../../api/api";
import LibraryTaskResponse from "../../models/library-task-response";
import Action from "./action";
import SyncIcon from '@mui/icons-material/Sync';

/**
 * Using the resolved value of the task porimise, triggers an appropriate toast
 * @param task the returned promised from an API call to run a task
 */
const handleTask = <T extends LibraryTaskResponse>(
	task: Promise<T>
) => task
		.then(({ status }) => toast.success(status))
		.catch(({ status }) => toast.error(status));

export const ScanAllLibrariesAction: Action = {
	label: 'Scan Libraries',
	icon: <SyncIcon/>,
	onClick: () => handleTask(API.scanLibraries())
};

export const ScanLibraryAction = (librarySlugOrId: number | string): Action => ({
	label: 'Scan',
	icon: ScanAllLibrariesAction.icon,
	onClick: () => handleTask(API.scanLibrary(librarySlugOrId))
});

export const RefreshMetadataLibraryAction = (librarySlugOrId: number | string): Action => ({
	label: 'Refresh Metadata',
	icon: <AutoMode/>,
	onClick: () => handleTask(API.refreshMetadataInLibrary(librarySlugOrId))
});

export const CleanAllLibrariesAction: Action = {
	label: 'Clean Libraries',
	icon: <CleaningServices/>,
	onClick: () => handleTask(API.cleanLibraries())
};

export const CleanLibraryAction = (librarySlugOrId: number | string): Action => ({
	label: 'Clean',
	icon: CleanAllLibrariesAction.icon,
	onClick: () => handleTask(API.cleanLibrary(librarySlugOrId))
});
