import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { ProductDetail } from "#/server/products";
import { PDPGallery } from "./PDPGallery";

afterEach(cleanup);

function makeImages(count: number): ProductDetail["images"] {
	return Array.from({ length: count }, (_, i) => ({
		path: `/upload/test/image-${i + 1}.jpg`,
		alt: `Foto ${i + 1}`,
		position: i,
	}));
}

describe("PDPGallery", () => {
	it("mostra placeholder quando não há imagens", () => {
		render(<PDPGallery images={[]} />);
		expect(screen.queryByText("Sem imagem")).not.toBeNull();
	});

	it("não renderiza tablist quando só há uma imagem", () => {
		render(<PDPGallery images={makeImages(1)} />);
		expect(screen.queryByRole("tablist")).toBeNull();
	});

	it("renderiza uma thumbnail por imagem quando há mais de uma", () => {
		render(<PDPGallery images={makeImages(4)} />);
		expect(screen.getAllByRole("tab")).toHaveLength(4);
	});

	it("marca a primeira thumbnail como selecionada por padrão", () => {
		render(<PDPGallery images={makeImages(3)} />);
		const tabs = screen.getAllByRole("tab");
		expect(tabs[0].getAttribute("aria-selected")).toBe("true");
		expect(tabs[1].getAttribute("aria-selected")).toBe("false");
		expect(tabs[2].getAttribute("aria-selected")).toBe("false");
	});

	it("clicar em uma thumbnail troca a imagem principal", () => {
		render(<PDPGallery images={makeImages(3)} />);
		const tabs = screen.getAllByRole("tab");
		const mainImg = () =>
			document.querySelector<HTMLImageElement>("img.object-cover");

		expect(mainImg()?.getAttribute("src")).toBe("/upload/test/image-1.jpg");
		fireEvent.click(tabs[2]);
		expect(mainImg()?.getAttribute("src")).toBe("/upload/test/image-3.jpg");
		expect(tabs[2].getAttribute("aria-selected")).toBe("true");
		expect(tabs[0].getAttribute("aria-selected")).toBe("false");
	});

	it("seta direita avança a thumbnail ativa", () => {
		render(<PDPGallery images={makeImages(3)} />);
		const tablist = screen.getByRole("tablist");
		fireEvent.keyDown(tablist, { key: "ArrowRight" });
		const tabs = screen.getAllByRole("tab");
		expect(tabs[1].getAttribute("aria-selected")).toBe("true");
	});

	it("seta esquerda volta a thumbnail ativa", () => {
		render(<PDPGallery images={makeImages(3)} />);
		const tablist = screen.getByRole("tablist");
		fireEvent.keyDown(tablist, { key: "ArrowRight" });
		fireEvent.keyDown(tablist, { key: "ArrowRight" });
		fireEvent.keyDown(tablist, { key: "ArrowLeft" });
		const tabs = screen.getAllByRole("tab");
		expect(tabs[1].getAttribute("aria-selected")).toBe("true");
	});

	it("setas não ultrapassam os limites", () => {
		render(<PDPGallery images={makeImages(2)} />);
		const tablist = screen.getByRole("tablist");
		const tabs = screen.getAllByRole("tab");
		// Tenta passar do fim
		fireEvent.keyDown(tablist, { key: "ArrowRight" });
		fireEvent.keyDown(tablist, { key: "ArrowRight" });
		fireEvent.keyDown(tablist, { key: "ArrowRight" });
		expect(tabs[1].getAttribute("aria-selected")).toBe("true");
		// Tenta passar do início
		fireEvent.keyDown(tablist, { key: "ArrowLeft" });
		fireEvent.keyDown(tablist, { key: "ArrowLeft" });
		fireEvent.keyDown(tablist, { key: "ArrowLeft" });
		expect(tabs[0].getAttribute("aria-selected")).toBe("true");
	});

	it("primeira imagem carrega eager e com fetchPriority alto", () => {
		render(<PDPGallery images={makeImages(3)} />);
		const main = document.querySelector<HTMLImageElement>("img.object-cover");
		expect(main?.getAttribute("loading")).toBe("eager");
		// React 19 renderiza a prop como atributo HTML canonico
		expect(main?.getAttribute("fetchpriority")).toBe("high");
	});
});
