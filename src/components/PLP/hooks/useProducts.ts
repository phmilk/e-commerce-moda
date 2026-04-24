import { useQuery } from "@tanstack/react-query";
import {
	normalizeSearchKey,
	type ProductListSearch,
} from "#/lib/products/search-params";
import { listProducts } from "#/server/products";

/**
 * Reads the product list for the given search from the TanStack Query cache
 * (already primed by the route loader on SSR) and keeps it in sync when
 * filters change client-side.
 *
 * @param search - Active PLP search params.
 */
export function useProducts(search: ProductListSearch) {
	return useQuery({
		queryKey: ["products", normalizeSearchKey(search)] as const,
		queryFn: () => listProducts({ data: search }),
	});
}
