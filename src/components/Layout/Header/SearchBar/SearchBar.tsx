import { Search } from "lucide-react";

import { Input } from "#/components/ui/input";
import { cn } from "#/lib/utils";

interface SearchBarProps {
	className?: string;
}

function SearchBar({ className }: SearchBarProps) {
	return (
		<div className={cn("relative flex-1", className)}>
			<Search
				aria-hidden="true"
				className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
			/>
			<Input
				type="search"
				role="searchbox"
				aria-label="Buscar produtos"
				placeholder="Buscar produtos..."
				className="h-10 pl-9"
			/>
		</div>
	);
}

export { SearchBar };
