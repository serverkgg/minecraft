import { describe, expect, test } from "bun:test";
import { manifestSchema } from "@serverkgg/bridge/manifest";
import { CROSSPLAY } from "./companion";

const MANIFEST_PATH = `${import.meta.dir}/../../serverk.yml`;

const manifest = manifestSchema.parse(Bun.YAML.parse(await Bun.file(MANIFEST_PATH).text()));

describe("the bedrock address only exists when crossplay can run", () => {
	test("the bedrock port is live on the server types Geyser supports, with crossplay on", () => {
		const bedrock = manifest.container.ports.find((port) => port.key === "bedrock");

		expect(bedrock?.activeWhen).toMatchObject([
			{
				variable: "SERVER_TYPE",
				values: CROSSPLAY.variants,
			},
			{
				variable: CROSSPLAY.variable,
				values: [
					"true",
				],
			},
		]);
	});

	test("the java port is always live", () => {
		const game = manifest.container.ports.find((port) => port.key === "game");

		expect(game?.activeWhen).toEqual([]);
	});
});
