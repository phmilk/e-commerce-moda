import { Link } from "@tanstack/react-router";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "#/components/ui/breadcrumb";
import type { ProductDetail } from "#/server/products";

/** Props for the {@link PDPBreadcrumb} component. */
export interface PDPBreadcrumbProps {
	/**
	 * Category chain from root to leaf, already resolved on the server
	 * via `Category.parentId`.
	 */
	breadcrumb: ProductDetail["breadcrumb"];
	/** Current product name — rendered as the final, non-clickable item. */
	productName: string;
}

/**
 * Renders the product's canonical breadcrumb. Intermediate items link
 * back to the PLP pre-filtered by that category slug (`/?categoria=<slug>`);
 * the last item is the product name, rendered as `<BreadcrumbPage>`.
 * Replaces the conventional "back" button with richer context.
 */
export function PDPBreadcrumb({ breadcrumb, productName }: PDPBreadcrumbProps) {
	return (
		<Breadcrumb className="mb-4">
			<BreadcrumbList>
				<BreadcrumbItem>
					<BreadcrumbLink asChild>
						<Link to="/" search={{}}>
							Catálogo
						</Link>
					</BreadcrumbLink>
				</BreadcrumbItem>
				{breadcrumb.map((node) => (
					<span key={node.slug} className="contents">
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link to="/" search={{ categoria: [node.slug] }}>
									{node.displayName ?? node.name}
								</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
					</span>
				))}
				<BreadcrumbSeparator />
				<BreadcrumbItem>
					<BreadcrumbPage>{productName}</BreadcrumbPage>
				</BreadcrumbItem>
			</BreadcrumbList>
		</Breadcrumb>
	);
}
