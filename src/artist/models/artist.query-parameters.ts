import type { Artist, Prisma } from "@prisma/client";
import type LibraryQueryParameters from "src/library/models/library.query-parameters";
import type Slug from "src/slug/slug"
import type OmitId from "src/utils/omit-id";
import type OmitSlug from "src/utils/omit-slug";
import type RequireAtLeastOne from "src/utils/require-at-least-one";
import type RequireOnlyOne from "src/utils/require-only-one"
import { buildStringSearchParameters, SearchStringInput } from "src/utils/search-string-input";
import type { RelationInclude as BaseRelationInclude } from "src/relation-include/models/relation-include" ;
import ReleaseQueryParameters from "src/release/models/release.query-parameters";
import ParseBaseRelationIncludePipe from "src/relation-include/relation-include.pipe";

namespace ArtistQueryParameters {

	/**
	 * Parameters to create an Artist
	 */
	export type CreateInput = OmitSlug<OmitId<Artist>>;
	/**
	 * Query parameters to find one artist
	 */
	export type WhereInput = RequireOnlyOne<{
		id: number,
		slug: Slug
	}>;
	/**
	 * Build the query parameters for ORM, to select one artist
	 * @param where the query parameter to transform for ORM
	 * @returns the ORM-ready query parameters
	 */
	export function buildQueryParametersForOne(where: WhereInput) {
		return {
			id: where.id,
			slug: where.slug?.toString()
		};
	}
	
	/**
	 * Query parameters to find multiple artists
	 */
	export type ManyWhereInput = Partial<RequireAtLeastOne<{
		byLibrarySource: LibraryQueryParameters.WhereInput,
		byName: SearchStringInput,
		byIds: { in: number[] },
		
	}>>;

	/**
	 * Build the query parameters for ORM, to select multiple artists
	 * @param where the query parameter to transform for ORM
	 * @returns the ORM-ready query parameters
	 */
	export function buildQueryParametersForMany(where: ManyWhereInput): Prisma.ArtistWhereInput {
		return {
			id: where.byIds ? {
				in: where.byIds.in
			} : undefined,
			name: buildStringSearchParameters(where.byName),
			albums: where.byLibrarySource ? {
				some: {
					releases: {
						some: ReleaseQueryParameters.buildQueryParametersForMany({ library: where.byLibrarySource })
					}
				}
			} : undefined
		};
	}

	/**
	 * Parameters to update an Artist
	 */
	 export type UpdateInput = Partial<CreateInput>;
	
	/**
	 * Parameters to find or create an Artist
	 */
	export type GetOrCreateInput = CreateInput;
	
	/**
	 * Defines what relations to include in query
	 */
	export const AvailableIncludes = ['albums', 'songs'] as const;
	export type RelationInclude = BaseRelationInclude<typeof AvailableIncludes>;
	export const ParseRelationIncludePipe = new ParseBaseRelationIncludePipe(AvailableIncludes);

	/**
	 * Build the query parameters for ORM to include relations
	 * @returns the ORM-ready query parameters
	 */
	export function buildIncludeParameters(include?: RelationInclude) {
		return {
			albums: include?.albums ?? false,
			songs: include?.songs ?? false
		};
	}
}

export default ArtistQueryParameters;