import { Badge } from "#/components/ui/badge";
import { Card, CardContent } from "#/components/ui/card";
import { formatBRL } from "#/lib/format/price";
import type { ProductCardData } from "#/server/products";

/** Props for the {@link ProductCard} component. */
export interface ProductCardProps {
	/** Product data for one card slot. */
	product: ProductCardData;
	/**
	 * When `true`, the image is loaded eagerly with high fetch priority —
	 * used for the cards in the first fold to minimize LCP.
	 */
	priority?: boolean;
}

/**
 * Renders one product tile (image + brand + name + breadcrumb + price).
 *
 * Semantics: each card is wrapped in a single `<a>` so the whole tile is
 * clickable and reads as one link to assistive tech — cheaper for SEO
 * than an image-only link plus a text-only link to the same URL.
 */
export function ProductCard({ product, priority = false }: ProductCardProps) {
	const breadcrumb = product.categoriesBreadcrumb
		.map((c) => c.name)
		.join(" / ");

	return (
		<Card className="group gap-3 overflow-hidden p-0 transition hover:shadow-md focus-within:shadow-md">
			<a
				href={`/produto/${product.slug}`}
				className="flex flex-col rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				aria-label={`Ver detalhes de ${product.name}`}
			>
				<div className="aspect-3/4 w-full overflow-hidden bg-muted">
					{product.primaryImage ? (
						<img
							src={product.primaryImage.path}
							alt={product.primaryImage.alt}
							width={600}
							height={800}
							loading={priority ? "eager" : "lazy"}
							decoding="async"
							{...(priority ? { fetchPriority: "high" as const } : {})}
							sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
							className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
							Sem imagem
						</div>
					)}
				</div>

				<CardContent className="flex flex-col gap-1.5 px-3 pt-1 pb-3">
					<div className="flex items-center justify-between gap-2">
						<span className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
							{product.brand.name}
						</span>
						<Badge variant="secondary" className="shrink-0 text-[10px]">
							{product.condition.name}
						</Badge>
					</div>

					<h3 className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
						{product.name}
					</h3>

					{breadcrumb ? (
						<p
							className="truncate text-[11px] text-muted-foreground"
							title={breadcrumb}
						>
							{breadcrumb}
						</p>
					) : null}

					<p className="mt-1 text-base font-semibold tracking-tight">
						{formatBRL(product.priceCents)}
					</p>
				</CardContent>
			</a>
		</Card>
	);
}
