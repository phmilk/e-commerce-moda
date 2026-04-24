import type { ProductCardData } from "#/server/products";
import { ProductCard } from "./ProductCard";

/** Number of leading cards that opt into eager-loading to help LCP. */
const PRIORITY_COUNT = 4;

/** Props for the {@link ProductGrid} component. */
export interface ProductGridProps {
	/** Products to render. */
	products: ProductCardData[];
}

/**
 * Responsive grid of {@link ProductCard}s. The first {@link PRIORITY_COUNT}
 * cards are flagged as high-priority so their hero images load eagerly.
 */
export function ProductGrid({ products }: ProductGridProps) {
	return (
		<ul
			className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
			aria-label="Lista de produtos"
		>
			{products.map((product, idx) => (
				<li key={product.id}>
					<ProductCard product={product} priority={idx < PRIORITY_COUNT} />
				</li>
			))}
		</ul>
	);
}
