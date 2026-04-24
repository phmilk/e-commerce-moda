import { Badge } from "#/components/ui/badge";
import { formatBRL } from "#/lib/format/price";
import type { ProductDetail } from "#/server/products";
import { PDPSizes } from "../PDPSizes";

/** Props for the {@link PDPInfo} component. */
export interface PDPInfoProps {
	/** Full product detail payload. */
	product: ProductDetail;
}

/**
 * Textual side of the PDP: brand, name, condition badge, price,
 * description, and available sizes. Built to stack readably on
 * mobile and sit side-by-side with the gallery on desktop.
 */
export function PDPInfo({ product }: PDPInfoProps) {
	return (
		<section className="flex flex-col gap-5">
			<header className="flex flex-col gap-2">
				<span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
					{product.brand.name}
				</span>
				<h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
					{product.name}
				</h1>
				<div className="flex items-center gap-2">
					<Badge variant="secondary">{product.condition.name}</Badge>
					<span className="text-xs text-muted-foreground">SKU {product.sku}</span>
				</div>
			</header>

			<p className="text-3xl font-semibold tracking-tight">
				{formatBRL(product.priceCents)}
			</p>

			<PDPSizes sizes={product.sizes} />

			{product.description ? (
				<section
					aria-label="Descrição do produto"
					className="flex flex-col gap-2"
				>
					<h2 className="text-sm font-medium text-foreground">Descrição</h2>
					<p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
						{product.description}
					</p>
				</section>
			) : null}
		</section>
	);
}
