import { useState } from "react";
import { cn } from "#/lib/utils";
import type { ProductDetail } from "#/server/products";

/** Props for the {@link PDPGallery} component. */
export interface PDPGalleryProps {
	/** Product images, already ordered by `ProductImage.position`. */
	images: ProductDetail["images"];
}

/**
 * Product image gallery: one large hero image and a strip/column of
 * thumbnails. Active index is local state — the gallery is
 * self-contained and doesn't influence the URL.
 *
 * Accessibility: thumbnails follow the `role="tab"` pattern with
 * `aria-selected`; ←/→ on the list navigates.
 *
 * Performance: the first image opts into `loading="eager"` and
 * `fetchPriority="high"` so the LCP image starts loading before JS
 * hydrates; others stay lazy.
 */
export function PDPGallery({ images }: PDPGalleryProps) {
	const [active, setActive] = useState(0);

	if (images.length === 0) {
		return (
			<div className="flex aspect-3/4 w-full items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">
				Sem imagem
			</div>
		);
	}

	const current = images[Math.min(active, images.length - 1)];

	function handleKey(e: React.KeyboardEvent<HTMLDivElement>) {
		if (e.key === "ArrowRight") {
			e.preventDefault();
			setActive((i) => Math.min(i + 1, images.length - 1));
		} else if (e.key === "ArrowLeft") {
			e.preventDefault();
			setActive((i) => Math.max(i - 1, 0));
		}
	}

	return (
		<div className="flex flex-col gap-3 md:flex-row-reverse md:gap-4">
			<div className="flex-1 overflow-hidden rounded-xl bg-muted">
				<img
					src={current.path}
					alt={current.alt}
					width={800}
					height={1067}
					loading="eager"
					decoding="async"
					fetchPriority="high"
					sizes="(min-width: 1024px) 50vw, 100vw"
					className="aspect-3/4 h-auto w-full object-cover"
				/>
			</div>

			{images.length > 1 ? (
				// biome-ignore lint/a11y/useSemanticElements: tablist is the intended role
				<div
					role="tablist"
					aria-label="Miniaturas do produto"
					onKeyDown={handleKey}
					className="flex gap-2 overflow-x-auto md:flex-col md:overflow-y-auto"
				>
					{images.map((img, idx) => {
						const selected = idx === active;
						return (
							<button
								key={img.path}
								type="button"
								role="tab"
								aria-selected={selected}
								tabIndex={selected ? 0 : -1}
								onClick={() => setActive(idx)}
								className={cn(
									"relative size-16 shrink-0 overflow-hidden rounded-md border-2 transition md:size-20",
									selected
										? "border-foreground"
										: "border-transparent hover:border-border",
								)}
							>
								<img
									src={img.path}
									alt=""
									width={80}
									height={107}
									loading="lazy"
									decoding="async"
									className="h-full w-full object-cover"
								/>
							</button>
						);
					})}
				</div>
			) : null}
		</div>
	);
}
