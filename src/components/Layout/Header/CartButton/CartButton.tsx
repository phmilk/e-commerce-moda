import { ShoppingBag } from "lucide-react";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { cn } from "#/lib/utils";

interface CartButtonProps {
	itemCount?: number;
	className?: string;
}

function CartButton({ itemCount = 0, className }: CartButtonProps) {
	const hasItems = itemCount > 0;
	const displayCount = itemCount > 99 ? "99+" : itemCount;

	return (
		<Button
			type="button"
			variant="ghost"
			size="icon"
			aria-label={
				hasItems
					? `Sacola de compras (${itemCount} itens)`
					: "Sacola de compras"
			}
			className={cn("relative size-10 shrink-0", className)}
		>
			<ShoppingBag />
			{hasItems ? (
				<Badge
					aria-hidden="true"
					className="absolute -top-0.5 -right-0.5 h-5 min-w-5 justify-center px-1 text-[10px] tabular-nums"
				>
					{displayCount}
				</Badge>
			) : null}
		</Button>
	);
}

export { CartButton };
