import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { ProductDetail } from "#/server/products";
import { ProductJsonLd } from "./ProductJsonLd";

afterEach(cleanup);

const SITE = "https://example.com";

function makeProduct(
	overrides: Partial<ProductDetail> = {},
): ProductDetail {
	return {
		id: 1,
		sku: "SKU-001",
		slug: "camisa-teste",
		name: "Camisa teste",
		description: "Uma descrição qualquer",
		priceCents: 15999,
		currency: "BRL",
		brand: { name: "Kairo", slug: "kairo" },
		condition: { name: "Novo", slug: "novo" },
		images: [
			{ path: "/upload/001/image-01.jpg", alt: "Camisa teste", position: 0 },
			{ path: "/upload/001/image-02.jpg", alt: "Camisa teste", position: 1 },
		],
		sizes: [{ name: "M", slug: "m", available: true }],
		breadcrumb: [],
		...overrides,
	};
}

/**
 * Renderiza o componente, lê o `<script type="application/ld+json">`
 * gerado e parseia o JSON pra asserts detalhados.
 */
function renderAndParseJsonLd(product: ProductDetail): Record<string, unknown> {
	render(<ProductJsonLd product={product} siteUrl={SITE} />);
	const script = document.querySelector(
		'script[type="application/ld+json"]',
	);
	expect(script).not.toBeNull();
	return JSON.parse(script?.textContent ?? "{}");
}

describe("ProductJsonLd", () => {
	it("emite um objeto schema.org/Product válido", () => {
		const json = renderAndParseJsonLd(makeProduct());
		expect(json["@context"]).toBe("https://schema.org");
		expect(json["@type"]).toBe("Product");
		expect(json.name).toBe("Camisa teste");
		expect(json.sku).toBe("SKU-001");
		expect(json.url).toBe(`${SITE}/produto/camisa-teste`);
	});

	it("inclui brand e imagens absolutas", () => {
		const json = renderAndParseJsonLd(makeProduct());
		expect(json.brand).toEqual({ "@type": "Brand", name: "Kairo" });
		expect(json.image).toEqual([
			`${SITE}/upload/001/image-01.jpg`,
			`${SITE}/upload/001/image-02.jpg`,
		]);
	});

	it("converte preço em centavos para string decimal", () => {
		const json = renderAndParseJsonLd(makeProduct({ priceCents: 15999 }));
		const offer = json.offers as Record<string, unknown>;
		expect(offer.price).toBe("159.99");
		expect(offer.priceCurrency).toBe("BRL");
		expect(offer.availability).toBe("https://schema.org/InStock");
	});

	it("mapeia condição 'novo' para NewCondition", () => {
		const json = renderAndParseJsonLd(
			makeProduct({ condition: { name: "Novo", slug: "novo" } }),
		);
		const offer = json.offers as Record<string, unknown>;
		expect(offer.itemCondition).toBe("https://schema.org/NewCondition");
	});

	it("mapeia qualquer outra condição para UsedCondition", () => {
		const json = renderAndParseJsonLd(
			makeProduct({ condition: { name: "Usado", slug: "usado" } }),
		);
		const offer = json.offers as Record<string, unknown>;
		expect(offer.itemCondition).toBe("https://schema.org/UsedCondition");
	});

	it("emite array de imagens vazio quando o produto não tem fotos", () => {
		const json = renderAndParseJsonLd(makeProduct({ images: [] }));
		expect(json.image).toEqual([]);
	});
});
