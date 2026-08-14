import type { Bridge } from "@serverkgg/bridge";

const GEYSER_DOWNLOADS = "https://download.geysermc.org/v2/projects";

const BUILD_CACHE_SECONDS = 900;

const SHA256_PATTERN = /^[a-f0-9]{64}$/;

interface GeyserBuild {
	version: string;
	build: number;
	downloads: Record<
		string,
		{
			name: string;
			sha256: string;
		}
	>;
}

export interface GeyserArtifact {
	version: string;
	url: string;
	digest: string | null;
}

export const geyserArtifact = async (
	context: Bridge.Context,
	project: string,
	artifact: string,
): Promise<GeyserArtifact | null> => {
	const build = await context.net.json<GeyserBuild>(`${GEYSER_DOWNLOADS}/${project}/versions/latest/builds/latest`, {
		cacheSeconds: BUILD_CACHE_SECONDS,
	});
	const download = build.downloads[artifact];

	if (!download || !build.version || !Number.isInteger(build.build)) {
		return null;
	}

	const sha256 = download.sha256.toLowerCase();

	return {
		version: `${build.version}-b${build.build}`,
		url: `${GEYSER_DOWNLOADS}/${project}/versions/${build.version}/builds/${build.build}/downloads/${artifact}`,
		digest: SHA256_PATTERN.test(sha256) ? `sha256:${sha256}` : null,
	};
};
