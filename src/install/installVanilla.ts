import type { Bridge } from "@serverkgg/bridge";
import {
	IMMUTABLE_CACHE_SECONDS,
	MANIFEST_CACHE_SECONDS,
	MOJANG_MANIFEST,
	type MojangManifest,
	type MojangVersion,
	SERVER_JAR,
} from "../shared";
import { jarLaunch } from "./launchPlan";

export const installVanilla = async (context: Bridge.Context, gameVersion: string) => {
	const manifest = await context.net.json<MojangManifest>(MOJANG_MANIFEST, {
		cacheSeconds: MANIFEST_CACHE_SECONDS,
	});

	const entry = manifest.versions.find((candidate) => candidate.id === gameVersion);

	if (!entry) {
		throw new Error(`unknown minecraft version "${gameVersion}"`);
	}

	const version = await context.net.json<MojangVersion>(entry.url, {
		cacheSeconds: IMMUTABLE_CACHE_SECONDS,
	});

	await context.files.download(SERVER_JAR, version.downloads.server.url, {
		digest: `sha1:${version.downloads.server.sha1}`,
		sizeBytes: version.downloads.server.size,
	});

	return jarLaunch;
};
