import { Skeleton } from "#/components/ui/skeleton";

/**
 * Placeholder matching the PDP layout. Mounted only while the client
 * cache is cold (rare with SSR loader priming). Shares aspect ratios
 * with the real gallery and text blocks to prevent CLS.
 */
export function PDPSkeleton() {
	return (
		<output
			aria-busy="true"
			aria-label="Carregando produto"
			className="grid w-full gap-8 md:grid-cols-2"
		>
			<div className="flex flex-col gap-3 md:flex-row-reverse md:gap-4">
				<Skeleton className="aspect-3/4 flex-1 rounded-xl" />
				<div className="flex gap-2 md:flex-col">
					{Array.from({ length: 4 }).map((_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
						<Skeleton key={i} className="size-16 rounded-md md:size-20" />
					))}
				</div>
			</div>

			<div className="flex flex-col gap-5">
				<Skeleton className="h-3 w-16" />
				<Skeleton className="h-8 w-3/4" />
				<Skeleton className="h-6 w-24" />
				<Skeleton className="h-10 w-32" />
				<Skeleton className="h-4 w-20" />
				<div className="flex gap-2">
					{Array.from({ length: 4 }).map((_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
						<Skeleton key={i} className="h-8 w-12 rounded-md" />
					))}
				</div>
				<Skeleton className="h-4 w-24" />
				<Skeleton className="h-24 w-full" />
			</div>
		</output>
	);
}
