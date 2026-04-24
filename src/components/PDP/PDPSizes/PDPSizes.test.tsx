import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { ProductDetail } from "#/server/products";
import { PDPSizes } from "./PDPSizes";

afterEach(cleanup);

function makeSize(
	name: string,
	available: boolean,
): ProductDetail["sizes"][number] {
	return { name, slug: name.toLowerCase(), available };
}

describe("PDPSizes", () => {
	it("não renderiza nada quando a lista está vazia", () => {
		const { container } = render(<PDPSizes sizes={[]} />);
		expect(container.firstChild).toBeNull();
	});

	it("renderiza cada tamanho como item de lista", () => {
		render(
			<PDPSizes
				sizes={[makeSize("P", true), makeSize("M", true), makeSize("G", true)]}
			/>,
		);
		expect(screen.getAllByRole("listitem")).toHaveLength(3);
		expect(screen.queryByText("P")).not.toBeNull();
		expect(screen.queryByText("M")).not.toBeNull();
		expect(screen.queryByText("G")).not.toBeNull();
	});

	it("marca aria-disabled e adiciona line-through nos indisponíveis", () => {
		render(<PDPSizes sizes={[makeSize("P", true), makeSize("M", false)]} />);
		const p = screen.getByText("P").closest("li");
		const m = screen.getByText("M").closest("li");
		expect(p?.getAttribute("aria-disabled")).toBe("false");
		expect(m?.getAttribute("aria-disabled")).toBe("true");
		expect(m?.className).toContain("line-through");
		expect(p?.className).not.toContain("line-through");
	});

	it("título fica 'Tamanhos' quando algum está indisponível", () => {
		render(<PDPSizes sizes={[makeSize("P", false)]} />);
		expect(
			screen.getByRole("heading", { name: "Tamanhos" }),
		).not.toBeNull();
	});

	it("título fica 'Tamanhos disponíveis' quando todos estão disponíveis", () => {
		render(<PDPSizes sizes={[makeSize("P", true), makeSize("M", true)]} />);
		expect(
			screen.getByRole("heading", { name: "Tamanhos disponíveis" }),
		).not.toBeNull();
	});
});
