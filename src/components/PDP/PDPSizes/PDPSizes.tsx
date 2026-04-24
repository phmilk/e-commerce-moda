import { cn } from "#/lib/utils";
import type { ProductDetail } from "#/server/products";

/** Props for the {@link PDPSizes} component. */
export interface PDPSizesProps {
	/** Sizes with per-product availability flag. */
	sizes: ProductDetail["sizes"];
}

/**
 * Displays all sizes registered for this product. Unavailable sizes
 * are greyed out and struck through — they still signal to the user
 * which sizes exist for this reference, even if out of stock. No
 * selection state yet (no cart), so each pill is a `<div>`.
 */
export function PDPSizes({ sizes }: PDPSizesProps) {
	if (sizes.length === 0) return null;
	const hasUnavailable = sizes.some((s) => !s.available);
	return (
		<section aria-label="Tamanhos" className="flex flex-col gap-2">
			<h2 className="text-sm font-medium text-foreground">
				{hasUnavailable ? "Tamanhos" : "Tamanhos disponíveis"}
			</h2>
			<ul className="flex flex-wrap gap-2">
				{sizes.map((s) => (
					<li
						key={s.slug}
						className={cn(
							"inline-flex min-w-12 items-center justify-center rounded-md border px-3 py-1.5 text-sm",
							s.available
								? "border-border text-foreground"
								: "border-dashed border-border text-muted-foreground line-through opacity-60",
						)}
						aria-disabled={!s.available}
					>
						{s.name}
					</li>
				))}
			</ul>
		</section>
	);
}
