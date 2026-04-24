import { useQuery } from "@tanstack/react-query";
import { getProductBySlug } from "#/server/products";

/**
 * Reads the detail payload for one product from the cache. The route
 * loader primes the cache with the same key on SSR, so the first
 * client render is synchronous and already hydrated.
 */
export function useProduct(slug: string) {
	return useQuery({
		queryKey: ["product", slug] as const,
		queryFn: () => getProductBySlug({ data: slug }),
	});
}
