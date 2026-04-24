import type { ProductCardData } from "#/server/products";

/** Props for the {@link ProductsJsonLd} component. */
export interface ProductsJsonLdProps {
	/** Products currently displayed on the PLP page. */
	products: ProductCardData[];
	/** Absolute base URL (used to build product URLs inside the JSON). */
	siteUrl: string;
}

/**
 * Emits a `schema.org/ItemList` JSON-LD block for the current PLP page,
 * improving rich-result eligibility (product cards with price, brand,
 * and condition) in search engines.
 *
 * Rendered inline in the component tree (not in `head`) so it ships in
 * the SSR HTML — many crawlers index JSON-LD only when present on first
 * render, not after hydration.
 */
export function ProductsJsonLd({ products, siteUrl }: ProductsJsonLdProps) {
	const json = {
		"@context": "https://schema.org",
		"@type": "ItemList",
		itemListElement: products.map((p, idx) => ({
			"@type": "ListItem",
			position: idx + 1,
			url: `${siteUrl}/produto/${p.slug}`,
			item: {
				"@type": "Product",
				name: p.name,
				sku: p.sku,
				brand: { "@type": "Brand", name: p.brand.name },
				image: p.primaryImage ? `${siteUrl}${p.primaryImage.path}` : undefined,
				offers: {
					"@type": "Offer",
					price: (p.priceCents / 100).toFixed(2),
					priceCurrency: p.currency,
					availability: "https://schema.org/InStock",
					itemCondition:
						p.condition.slug === "novo"
							? "https://schema.org/NewCondition"
							: "https://schema.org/UsedCondition",
				},
			},
		})),
	};

	return (
		<script
			type="application/ld+json"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD must ship as inline JSON
			dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
		/>
	);
}
