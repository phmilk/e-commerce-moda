import { SlidersHorizontal } from "lucide-react";

import { Button } from "#/components/ui/button";
import { cn } from "#/lib/utils";

interface FilterButtonProps {
	className?: string;
}

function FilterButton({ className }: FilterButtonProps) {
	return (
		<Button
			type="button"
			variant="outline"
			size="icon"
			aria-label="Abrir filtros"
			className={cn("size-10 shrink-0", className)}
		>
			<SlidersHorizontal />
		</Button>
	);
}

export { FilterButton };
