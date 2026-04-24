import { createFileRoute } from "@tanstack/react-router";
import { PLP } from "#/components/PLP";
import {
	normalizeSearchKey,
	type ProductListSearch,
	validateProductSearch,
} from "#/lib/products/search-params";
import {
	buildCanonical,
	buildDescription,
	buildTitle,
	SITE_URL,
} from "#/lib/products/seo";
import { listFilterFacets, listProducts } from "#/server/products";

/**
 * Route definition for the Product Listing Page (`/`). The loader
 * primes the TanStack Query cache on SSR so the initial HTML ships
 * with product cards and JSON-LD ready — zero client waterfall.
 *
 * The SEO metadata (title, description, canonical) is computed in the
 * loader and returned as `loaderData`, since `head` has access to
 * `loaderData` but not to `search` directly in TanStack Start.
 */
export const Route = createFileRoute("/_layout/")({
	validateSearch: (input: Record<string, unknown>): ProductListSearch =>
		validateProductSearch(input),

	loaderDeps: ({ search }) => ({ search }),

	loader: async ({ context, deps }) => {
		const normalized = normalizeSearchKey(deps.search);
		const [list] = await Promise.all([
			context.queryClient.ensureQueryData({
				queryKey: ["products", normalized] as const,
				queryFn: () => listProducts({ data: deps.search }),
			}),
			context.queryClient.ensureQueryData({
				queryKey: ["product-facets", normalized] as const,
				queryFn: () => listFilterFacets({ data: deps.search }),
			}),
		]);
		const total = list.total;
		return {
			total,
			title: buildTitle(deps.search, total),
			description: buildDescription(deps.search, total),
			canonical: buildCanonical(deps.search),
		};
	},

	head: ({ loaderData }) => {
		const title = loaderData?.title ?? "Catálogo | Moda";
		const description = loaderData?.description ?? "Catálogo de moda";
		const canonical = loaderData?.canonical ?? `${SITE_URL}/`;
		return {
			meta: [
				{ title },
				{ name: "description", content: description },
				{ property: "og:type", content: "website" },
				{ property: "og:title", content: title },
				{ property: "og:description", content: description },
				{ property: "og:url", content: canonical },
				{ name: "twitter:card", content: "summary_large_image" },
			],
			links: [{ rel: "canonical", href: canonical }],
		};
	},

	component: PLPRoute,
});

/** Minimal route adapter — everything visual lives inside `<PLP />`. */
function PLPRoute() {
	const search = Route.useSearch();
	return <PLP search={search} />;
}
