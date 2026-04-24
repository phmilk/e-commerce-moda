import { Skeleton } from "#/components/ui/skeleton";

/** Props for the {@link ProductGridSkeleton} component. */
export interface ProductGridSkeletonProps {
	/** How many skeleton tiles to render. Defaults to `8`. */
	count?: number;
}

/**
 * Renders a placeholder grid while product data is loading, matching the
 * layout of the real `ProductGrid` to prevent layout shift (CLS) on
 * hydration or filter transitions.
 */
export function ProductGridSkeleton({ count = 8 }: ProductGridSkeletonProps) {
	return (
		<output
			aria-busy="true"
			aria-label="Carregando produtos"
			className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
		>
			{Array.from({ length: count }).map((_, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: placeholders have no identity
				<div key={i} className="flex flex-col gap-2">
					<Skeleton className="aspect-3/4 w-full rounded-xl" />
					<Skeleton className="h-3 w-1/3" />
					<Skeleton className="h-4 w-3/4" />
					<Skeleton className="h-4 w-1/3" />
				</div>
			))}
		</output>
	);
}
