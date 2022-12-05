import { Delete } from "@mui/icons-material";
import {
	Box, Button, Grid, IconButton
} from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "react-query";
import API from "../../api/api";
import Library from "../../models/library";
import { Page } from "../infinite/infinite-scroll";
import AdminGrid from "../admin-grid";
import {
	CleanAllLibrariesAction, CleanLibraryAction,
	ScanAllLibrariesAction, ScanLibraryAction
} from "../actions/library-task";

const librariesQuery = () => ({
	key: ['libraries'],
	exec: (lastPage: Page<Library>) => API.getAllLibraries(lastPage)
});

const actionButtonStyle = {
	overflow: 'hidden',
	textOverflow: 'ellipsis'
};

const LibrariesSettings = () => {
	const queryClient = useQueryClient();
	const scanAllLibaries = ScanAllLibrariesAction;
	const cleanAllLibaries = CleanAllLibrariesAction;
	const deletionMutation = useMutation((libraryId: number) =>
		API.deleteLibrary(libraryId)
			.catch(() => toast.error("Deleting library failed, try again"))
			.then(() => {
				toast.success("Library deleted");
				queryClient.invalidateQueries();
			}));
	const columns: GridColDef<Library>[] = [
		{ field: 'name', headerName: 'Name', flex: 5 },
		{ field: 'clean', headerName: 'Clean', flex: 3, renderCell: ({ row: library }) => {
			const cleanAction = CleanLibraryAction(library.id);

			return <Button variant='outlined' color='secondary' size='small'
				startIcon={cleanAction.icon} onClick={cleanAction.onClick} sx={actionButtonStyle}
			>
				{cleanAction.label}
			</Button>;
		} },
		{ field: 'scan', headerName: 'Scan', flex: 3, renderCell: ({ row: library }) => {
			const scanAction = ScanLibraryAction(library.id);

			return <Button variant='contained' color='secondary' size='small'
				startIcon={scanAction.icon} onClick={scanAction.onClick} sx={actionButtonStyle}
			>
				{scanAction.label}
			</Button>;
		} },
		{ field: 'delete', headerName: 'Delete', flex: 1, renderCell: ({ row: library }) => {
			return <IconButton color='error'>
				<Delete/>
			</IconButton>;
		} }
	];

	return <Box sx={{ paddingBottom: 2 }}>
		<Grid container sx={{ justifyContent: { xs: 'space-evenly', md: 'flex-end' }, paddingY: 2 }} spacing={{ xs: 0, md: 2 }}>
			<Grid item>
				<Button variant='outlined' color='secondary'
					startIcon={cleanAllLibaries.icon} onClick={cleanAllLibaries.onClick}
				>
					{cleanAllLibaries.label}
				</Button>
			</Grid>
			<Grid item>
				<Button variant='contained' color='secondary'
					startIcon={scanAllLibaries.icon} onClick={scanAllLibaries.onClick}
				>
					{scanAllLibaries.label}
				</Button>
			</Grid>
		</Grid>
		<AdminGrid
			infiniteQuery={librariesQuery}
			columns={columns.map((column) => ({
				...column,
				headerAlign: column.field == 'name' ? 'left' : 'center',
				align: column.field == 'name' ? 'left' : 'center',
			}))}
		/>
	</Box>;
};

export default LibrariesSettings;
