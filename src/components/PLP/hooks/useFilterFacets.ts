import { useQuery } from "@tanstack/react-query";
import {
	normalizeSearchKey,
	type ProductListSearch,
} from "#/lib/products/search-params";
import { listFilterFacets } from "#/server/products";

/**
 * Reads the filter facet options contextualized by the current search.
 * Counts update every time a filter changes so the sheet reflects what
 * the user would see if they toggled each option.
 *
 * @param search - Active PLP search params.
 */
export function useFilterFacets(search: ProductListSearch) {
	return useQuery({
		queryKey: ["product-facets", normalizeSearchKey(search)] as const,
		queryFn: () => listFilterFacets({ data: search }),
	});
}
