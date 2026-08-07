import type { Bridge } from "@serverkgg/bridge";
import { BUILDS_CACHE_SECONDS, PAPER_PROJECT, type PaperBuild, SERVER_JAR } from "../shared";
import { jarLaunch } from "./launchPlan";

export const installPaper = async (context: Bridge.Context, gameVersion: string, build: string | null) => {
	const builds = await context.net.json<PaperBuild[]>(
		`${PAPER_PROJECT}/versions/${encodeURIComponent(gameVersion)}/builds`,
		{
			cacheSeconds: BUILDS_CACHE_SECONDS,
		},
	);

	const resolved =
		builds.find((candidate) => String(candidate.id) === build)
		?? builds.find((candidate) => candidate.channel === "STABLE");

	if (!resolved) {
		throw new Error(`no stable Paper build for ${gameVersion}`);
	}

	const download = resolved.downloads["server:default"];

	await context.files.download(SERVER_JAR, download.url, {
		digest: `sha256:${download.checksums.sha256}`,
		sizeBytes: download.size,
	});

	await context.files.ensure("plugins");

	return jarLaunch;
};
