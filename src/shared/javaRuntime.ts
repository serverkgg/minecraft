import type { Bridge } from "@serverkgg/bridge";
import {
	IMMUTABLE_CACHE_SECONDS,
	MANIFEST_CACHE_SECONDS,
	MOJANG_MANIFEST,
	type MojangManifest,
	type MojangVersion,
} from "./minecraftMeta";

const JAVA_ROOT = "/opt/java";

const DEFAULT_JAVA_MAJOR = 21;

const INSTALLED_MAJORS = [
	8,
	17,
	21,
	25,
];

export const javaBinary = (major: number) => {
	const supported = INSTALLED_MAJORS.find((candidate) => candidate >= major) ?? INSTALLED_MAJORS.at(-1) ?? major;

	return `${JAVA_ROOT}/${supported}/bin/java`;
};

export const javaMajorFor = async (context: Bridge.Context, gameVersion: string) => {
	try {
		const manifest = await context.net.json<MojangManifest>(MOJANG_MANIFEST, {
			cacheSeconds: MANIFEST_CACHE_SECONDS,
		});

		const entry = manifest.versions.find((candidate) => candidate.id === gameVersion);

		if (!entry) {
			return DEFAULT_JAVA_MAJOR;
		}

		const version = await context.net.json<MojangVersion>(entry.url, {
			cacheSeconds: IMMUTABLE_CACHE_SECONDS,
		});

		return version.javaVersion?.majorVersion ?? DEFAULT_JAVA_MAJOR;
	} catch {
		return DEFAULT_JAVA_MAJOR;
	}
};
