import * as IScroll from 'react-infinite-scroller';
import Resource from "../../models/resource";
import { PaginatedResponse } from "../../models/pagination";
import { MeeloInfiniteQueryFn, useInfiniteQuery } from "../../api/use-query";

export type InfiniteFetchFn<T> = (lastPage: Page<T>) => Promise<PaginatedResponse<T>>;

type InfiniteScrollProps<T extends Resource> = {
	/**
	 * The method to render all items
	 */
	render: (items: T[]) => JSX.Element;
	/**
	 * Query to use
	 */
	query: MeeloInfiniteQueryFn<T>
	/**
	 * Component to display on first load
	 */
	firstLoader: () => JSX.Element
	/**
	 * Component to display on page fetching (except first)
	 */
	loader: () => JSX.Element
}

/**
 * Data type for infinite data fetching
 */
export type Page<T> = {
	/**
	 * List of items that where fetched
	 * not including previously fetched data
	 */
	items: T[],
	/**
	 * The index of the page, usually the last page's + 1
	 */
	index: number,
	/**
	 * True if the fetching should stop there
	 */
	end: boolean,
	/**
	 * Size of the page
	 */
	pageSize: number
}

/**
 * Infinite scroll list w/ loading animation
 * @param props
 * @returns a dynamic list component
 */
const InfiniteScroll = <T extends Resource>(props: InfiniteScrollProps<T>) => {
	const {
		isFetching,
		data,
		hasNextPage,
		fetchNextPage,
		isFetchingNextPage
	} = useInfiniteQuery(props.query);

	return <>
		{ isFetching && !data && props.firstLoader() }
		<IScroll.default
			pageStart={0}
			loadMore={() => {
				if (hasNextPage && !isFetchingNextPage) {
					fetchNextPage();
				}
			}}
			hasMore={hasNextPage}
		>
			{ data && props.render(data.pages.map((page) => page.items).flat()) }
			{ isFetchingNextPage && props.loader() }
		</IScroll.default>
	</>;
};

export default InfiniteScroll;
