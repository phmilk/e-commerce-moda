import type { ProductListSearch } from "#/lib/products/search-params";
import { SITE_URL } from "#/lib/products/seo";
import { EmptyState } from "./EmptyState";
import { FilterSheet } from "./FilterSheet";
import { useFilterFacets } from "./hooks/useFilterFacets";
import { useProducts } from "./hooks/useProducts";
import { PLPHeader } from "./PLPHeader";
import { PLPPagination } from "./PLPPagination";
import { ProductGrid } from "./ProductGrid";
import { ProductGridSkeleton } from "./ProductGridSkeleton";
import { ProductsJsonLd } from "./ProductsJsonLd";

/** Props for the {@link PLP} component. */
export interface PLPProps {
	/** Current search params read from the route. */
	search: ProductListSearch;
}

/**
 * Product Listing Page top-level component. Orchestrates:
 *   - the filter sheet (controlled by the Header's filter button, also
 *     carries the sort control)
 *   - the product grid (with SSR-primed React Query cache)
 *   - pagination + empty state
 *   - the inline JSON-LD `ItemList` for SEO
 *
 * Intentionally a thin composition layer — individual responsibilities
 * live in their own component folders.
 */
export function PLP({ search }: PLPProps) {
	const { data: list, isFetching } = useProducts(search);
	const { data: facets } = useFilterFacets(search);

	return (
		<main className="mx-auto w-full max-w-7xl px-4 py-6 md:py-10">
			{list ? <ProductsJsonLd products={list.items} siteUrl={SITE_URL} /> : null}

			<PLPHeader
				search={search}
				total={list?.total ?? 0}
				facets={facets}
			/>

			{!list ? (
				<ProductGridSkeleton count={8} />
			) : list.items.length === 0 ? (
				<EmptyState search={search} />
			) : (
				<div className={isFetching ? "opacity-70 transition-opacity" : ""}>
					<ProductGrid products={list.items} />
					<div className="mt-6">
						<PLPPagination
							page={list.page}
							totalPages={list.totalPages}
							search={search}
						/>
					</div>
				</div>
			)}

			{facets ? <FilterSheet search={search} facets={facets} /> : null}
		</main>
	);
}
