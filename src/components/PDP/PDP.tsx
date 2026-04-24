import { SITE_URL } from "#/lib/products/seo";
import { useProduct } from "./hooks/useProduct";
import { PDPBreadcrumb } from "./PDPBreadcrumb";
import { PDPGallery } from "./PDPGallery";
import { PDPInfo } from "./PDPInfo";
import { PDPSkeleton } from "./PDPSkeleton";
import { ProductJsonLd } from "./ProductJsonLd";

/** Props for the {@link PDP} component. */
export interface PDPProps {
	/** Product slug from the route params. */
	slug: string;
}

/**
 * Product Detail Page composition. Reads from the SSR-primed cache
 * via `useProduct` and renders:
 *   - canonical breadcrumb linking back to PLP filters
 *   - interactive image gallery
 *   - info column (brand, name, price, condition, sizes, description)
 *   - inline JSON-LD Product schema for SEO
 */
export function PDP({ slug }: PDPProps) {
	const { data: product } = useProduct(slug);

	return (
		<main className="mx-auto w-full max-w-7xl px-4 py-6 md:py-10">
			{product ? (
				<>
					<ProductJsonLd product={product} siteUrl={SITE_URL} />
					<PDPBreadcrumb
						breadcrumb={product.breadcrumb}
						productName={product.name}
					/>
					<div className="grid gap-8 md:grid-cols-2">
						<PDPGallery images={product.images} />
						<PDPInfo product={product} />
					</div>
				</>
			) : (
				<PDPSkeleton />
			)}
		</main>
	);
}
