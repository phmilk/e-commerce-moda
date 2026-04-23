import { User } from "lucide-react";

import { Button } from "#/components/ui/button";
import { cn } from "#/lib/utils";

interface LoginButtonProps {
	className?: string;
}

function LoginButton({ className }: LoginButtonProps) {
	return (
		<>
			<Button
				type="button"
				variant="ghost"
				size="icon"
				aria-label="Entrar na conta"
				className={cn("size-10 shrink-0 sm:hidden", className)}
			>
				<User />
			</Button>
			<Button
				type="button"
				variant="outline"
				size="sm"
				className={cn("hidden h-10 sm:inline-flex", className)}
			>
				<User />
				Entrar
			</Button>
		</>
	);
}

export { LoginButton };
