import type { Bridge } from "@serverkgg/bridge";

const SIDECAR = ".serverk-companions.json";

export interface CompanionRecord {
	jar: string;
	gameVersion: string;
	source: string;
	version: string;
}

export interface CompanionSidecar {
	entries: Record<string, CompanionRecord>;
}

const isRecord = (value: unknown): value is CompanionRecord => {
	if (value === null || typeof value !== "object") {
		return false;
	}

	const candidate = value as Partial<CompanionRecord>;

	return (
		typeof candidate.jar === "string"
		&& typeof candidate.gameVersion === "string"
		&& typeof candidate.source === "string"
		&& typeof candidate.version === "string"
	);
};

export const readCompanionSidecar = async (context: Bridge.Context): Promise<CompanionSidecar> => {
	if (!(await context.files.exists(SIDECAR))) {
		return {
			entries: {},
		};
	}

	try {
		const parsed = JSON.parse(await context.files.read(SIDECAR)) as {
			entries?: unknown;
		};
		const entries = parsed.entries;

		if (entries === null || typeof entries !== "object" || Array.isArray(entries)) {
			return {
				entries: {},
			};
		}

		return {
			entries: Object.fromEntries(Object.entries(entries).filter(([, value]) => isRecord(value))) as Record<
				string,
				CompanionRecord
			>,
		};
	} catch {
		return {
			entries: {},
		};
	}
};

export const writeCompanionSidecar = async (context: Bridge.Context, sidecar: CompanionSidecar) => {
	await context.files.write(SIDECAR, `${JSON.stringify(sidecar, null, 2)}\n`);
};
