import type { Bridge } from "@serverkgg/bridge";

const SIDECAR = ".serverk-catalog.json";

export const DISABLED_SUFFIX = ".disabled";

export interface SidecarEntry {
	provider: string;
	project: string;
	version: string;
	title: string;
	gameVersion: string;
	icon: string | null;
	pageUrl: string | null;
}

export type Sidecar = Record<string, SidecarEntry>;

export const sidecarPath = (directory: string) => {
	return `${directory}/${SIDECAR}`;
};

export const enabledName = (filename: string) => {
	return filename.endsWith(DISABLED_SUFFIX) ? filename.slice(0, -DISABLED_SUFFIX.length) : filename;
};

export const readSidecar = async (context: Bridge.Context, directory: string): Promise<Sidecar> => {
	const path = sidecarPath(directory);

	if (!(await context.files.exists(path))) {
		return {};
	}

	try {
		const parsed = JSON.parse(await context.files.read(path)) as unknown;

		return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Sidecar) : {};
	} catch {
		return {};
	}
};

export const writeSidecar = async (context: Bridge.Context, directory: string, sidecar: Sidecar) => {
	await context.files.write(sidecarPath(directory), `${JSON.stringify(sidecar, null, 2)}\n`);
};
