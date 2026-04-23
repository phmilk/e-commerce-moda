import { Link } from "@tanstack/react-router";

import { cn } from "#/lib/utils";

interface LogoProps {
	className?: string;
}

function Logo({ className }: LogoProps) {
	return (
		<Link
			to="/"
			aria-label="Ir para a página inicial"
			className={cn(
				"text-lg font-bold tracking-tight sm:text-xl",
				"transition-opacity hover:opacity-80",
				className,
			)}
		>
			logo
		</Link>
	);
}

export { Logo };
