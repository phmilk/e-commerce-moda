import { createFileRoute, notFound } from "@tanstack/react-router";
import { PDP } from "#/components/PDP";
import { SITE_URL } from "#/lib/products/seo";
import { getProductBySlug } from "#/server/products";

/**
 * Trims and collapses whitespace in a description so the meta tag
 * stays under ~160 chars and doesn't carry markdown-ish newlines.
 */
function shortenDescription(raw: string): string {
	const flat = raw.replace(/\s+/g, " ").trim();
	return flat.length > 160 ? `${flat.slice(0, 157)}…` : flat;
}

/**
 * PDP route: `/produto/:slug`. Prefetches the product via
 * `getProductBySlug` in the loader so the first paint ships with
 * data (SSR). `head()` reads `loaderData` to generate a rich meta
 * block tailored per product.
 */
export const Route = createFileRoute("/_layout/produto/$slug")({
	loader: async ({ context, params }) => {
		const product = await context.queryClient.ensureQueryData({
			queryKey: ["product", params.slug] as const,
			queryFn: () => getProductBySlug({ data: params.slug }),
		});
		if (!product) throw notFound();
		return {
			title: `${product.name} | ${product.brand.name} | Moda`,
			description: shortenDescription(product.description),
			canonical: `${SITE_URL}/produto/${product.slug}`,
			image: product.images[0]
				? `${SITE_URL}${product.images[0].path}`
				: undefined,
		};
	},

	head: ({ loaderData }) => {
		const title = loaderData?.title ?? "Produto | Moda";
		const description = loaderData?.description ?? "Detalhes do produto";
		const canonical = loaderData?.canonical ?? `${SITE_URL}/`;
		const image = loaderData?.image;
		const meta = [
			{ title },
			{ name: "description", content: description },
			{ property: "og:type", content: "product" },
			{ property: "og:title", content: title },
			{ property: "og:description", content: description },
			{ property: "og:url", content: canonical },
			{ name: "twitter:card", content: "summary_large_image" },
		];
		if (image) {
			meta.push({ property: "og:image", content: image });
			meta.push({ name: "twitter:image", content: image });
		}
		return {
			meta,
			links: [{ rel: "canonical", href: canonical }],
		};
	},

	component: PDPRoute,
});

/** Minimal route adapter — layout and data live inside `<PDP />`. */
function PDPRoute() {
	const { slug } = Route.useParams();
	return <PDP slug={slug} />;
}
