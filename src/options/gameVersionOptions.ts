import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import {
	compareVersionDesc,
	FABRIC_META,
	type FabricEntry,
	FORGE_PROMOTIONS,
	type ForgePromotions,
	isStable,
	MANIFEST_CACHE_SECONDS,
	MOJANG_MANIFEST,
	type MojangManifest,
	mavenVersions,
	NEOFORGE_MAVEN_METADATA,
	neoForgeBuildPrefix,
	neoForgePrefix,
	PAPER_PROJECT,
	type PaperProject,
	PURPUR_PROJECT,
	type PurpurProject,
	ServerVariant,
	toOptions,
	variantOf,
} from "../shared";

const vanillaVersions = async (context: Bridge.Context) => {
	const manifest = await context.net.json<MojangManifest>(MOJANG_MANIFEST, {
		cacheSeconds: MANIFEST_CACHE_SECONDS,
	});

	return toOptions(
		manifest.versions.filter((entry) => entry.type === "release").map((entry) => entry.id),
		true,
	);
};

const paperVersions = async (context: Bridge.Context) => {
	const project = await context.net.json<PaperProject>(PAPER_PROJECT, {
		cacheSeconds: MANIFEST_CACHE_SECONDS,
	});

	return toOptions(Object.values(project.versions).flat().filter(isStable).sort(compareVersionDesc), true);
};

const purpurVersions = async (context: Bridge.Context) => {
	const project = await context.net.json<PurpurProject>(PURPUR_PROJECT, {
		cacheSeconds: MANIFEST_CACHE_SECONDS,
	});

	return toOptions(
		[
			...project.versions,
		].reverse(),
		true,
	);
};

const fabricVersions = async (context: Bridge.Context) => {
	const entries = await context.net.json<FabricEntry[]>(`${FABRIC_META}/game`, {
		cacheSeconds: MANIFEST_CACHE_SECONDS,
	});

	return toOptions(
		entries.filter((entry) => entry.stable).map((entry) => entry.version),
		true,
	);
};

const forgeVersions = async (context: Bridge.Context) => {
	const promotions = await context.net.json<ForgePromotions>(FORGE_PROMOTIONS, {
		cacheSeconds: MANIFEST_CACHE_SECONDS,
	});
	const seen = new Set<string>();

	for (const key of Object.keys(promotions.promos)) {
		if (key.endsWith("-recommended")) {
			seen.add(key.slice(0, -"-recommended".length));
		}
	}

	return toOptions(
		[
			...seen,
		].reverse(),
		true,
	);
};

const neoForgeVersions = async (context: Bridge.Context) => {
	const metadata = await context.net.text(NEOFORGE_MAVEN_METADATA, {
		cacheSeconds: MANIFEST_CACHE_SECONDS,
	});
	const prefixes = new Set(mavenVersions(metadata).map(neoForgeBuildPrefix));
	const manifest = await context.net.json<MojangManifest>(MOJANG_MANIFEST);

	return toOptions(
		manifest.versions
			.filter((entry) => entry.type === "release")
			.map((entry) => entry.id)
			.filter((id) => prefixes.has(neoForgePrefix(id))),
		true,
	);
};

const VERSIONS_BY_VARIANT: Record<ServerVariant, (context: Bridge.Context) => Promise<Bridge.Option[]>> = {
	[ServerVariant.Fabric]: fabricVersions,
	[ServerVariant.Forge]: forgeVersions,
	[ServerVariant.NeoForge]: neoForgeVersions,
	[ServerVariant.Paper]: paperVersions,
	[ServerVariant.Purpur]: purpurVersions,
	[ServerVariant.Vanilla]: vanillaVersions,
};

export const gameVersion: Bridge.Options = {
	kind: BridgeKind.Options,
	dependsOn: [
		"SERVER_TYPE",
	],
	ttlSeconds: 3600,
	async list(context) {
		return await VERSIONS_BY_VARIANT[variantOf(context)](context);
	},
};
