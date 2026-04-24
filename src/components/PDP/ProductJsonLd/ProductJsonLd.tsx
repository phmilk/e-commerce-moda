import type { ProductDetail } from "#/server/products";

/** Props for the {@link ProductJsonLd} component. */
export interface ProductJsonLdProps {
	/** Product detail payload. */
	product: ProductDetail;
	/** Absolute base URL (used to build product and image URLs). */
	siteUrl: string;
}

/**
 * Emits a `schema.org/Product` JSON-LD block so crawlers can extract
 * rich-result data (name, brand, images, offer). Rendered inline in
 * the SSR HTML — JSON-LD appended after hydration is frequently
 * ignored.
 */
export function ProductJsonLd({ product, siteUrl }: ProductJsonLdProps) {
	const json = {
		"@context": "https://schema.org",
		"@type": "Product",
		name: product.name,
		sku: product.sku,
		description: product.description,
		url: `${siteUrl}/produto/${product.slug}`,
		brand: { "@type": "Brand", name: product.brand.name },
		image: product.images.map((img) => `${siteUrl}${img.path}`),
		offers: {
			"@type": "Offer",
			price: (product.priceCents / 100).toFixed(2),
			priceCurrency: product.currency,
			availability: "https://schema.org/InStock",
			url: `${siteUrl}/produto/${product.slug}`,
			itemCondition:
				product.condition.slug === "novo"
					? "https://schema.org/NewCondition"
					: "https://schema.org/UsedCondition",
		},
	};

	return (
		<script
			type="application/ld+json"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD must ship as inline JSON
			dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
		/>
	);
}
