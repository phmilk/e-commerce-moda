import { CartButton } from "./CartButton";
import { FilterButton } from "./FilterButton";
import { LoginButton } from "./LoginButton";
import { Logo } from "./Logo";
import { SearchBar } from "./SearchBar";

function Header() {
	return (
		<header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
			<div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:gap-4 md:py-4">
				<div className="flex items-center justify-between gap-2 md:gap-6">
					<Logo />
					<div className="flex items-center gap-1 md:hidden">
						<CartButton />
						<LoginButton />
					</div>
				</div>

				<div className="flex flex-1 items-center gap-2">
					<SearchBar />
					<FilterButton />
				</div>

				<div className="hidden items-center gap-2 md:flex">
					<CartButton />
					<LoginButton />
				</div>
			</div>
		</header>
	);
}

export { Header };
