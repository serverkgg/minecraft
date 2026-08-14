import { type Bridge, BridgeNetError, BridgeSecretError } from "@serverkgg/bridge";
import { type CatalogFile, CatalogProviderId } from "./provider";
import { asRateLimit } from "./rateLimit";

export const MODRINTH = "https://api.modrinth.com/v2";

export const MODRINTH_SEARCH_CACHE_SECONDS = 60;

export const MODRINTH_PROJECT_CACHE_SECONDS = 600;

const MODRINTH_CDN = "cdn.modrinth.com";

const SECRET = "MODRINTH_API_KEY";

const SHA512_PATTERN = /^[a-f0-9]{128}$/;

const REJECTED_STATUSES = [
	401,
	403,
];

export interface ModrinthHit {
	project_id: string;
	title: string;
	description: string;
	icon_url: string | null;
	downloads: number;
	author: string | null;
	categories: string[];
	date_modified: string | null;
	slug: string;
}

export interface ModrinthSearch {
	hits: ModrinthHit[];
	total_hits: number;
}

export interface ModrinthFile {
	url: string;
	filename: string;
	primary: boolean;
	size: number;
	hashes: {
		sha512?: string;
	};
}

export interface ModrinthDependency {
	project_id: string | null;
	dependency_type: string;
}

export interface ModrinthVersion {
	id: string;
	project_id: string;
	version_number: string;
	version_type: string;
	date_published: string;
	game_versions: string[];
	loaders: string[];
	files: ModrinthFile[];
	dependencies: ModrinthDependency[];
}

export interface ModrinthProject {
	id: string;
	slug: string;
	title: string;
	icon_url: string | null;
}

const headersOf = (context: Bridge.Context) => {
	const key = context.secret(SECRET);

	return key
		? {
				authorization: key,
			}
		: undefined;
};

export const modrinthRequest = async <Result>(
	context: Bridge.Context,
	url: string,
	cacheSeconds = MODRINTH_PROJECT_CACHE_SECONDS,
): Promise<Result> => {
	const headers = headersOf(context);

	try {
		return await context.net.json<Result>(url, {
			headers,
			cacheSeconds,
		});
	} catch (error) {
		if (
			headers
			&& error instanceof BridgeNetError
			&& error.status !== null
			&& REJECTED_STATUSES.includes(error.status)
		) {
			throw new BridgeSecretError(SECRET, `modrinth rejected the configured key — ${error.message}`);
		}

		throw asRateLimit(error, CatalogProviderId.Modrinth);
	}
};

export const modrinthFile = (version: ModrinthVersion): CatalogFile | null => {
	const file = version.files.find((candidate) => candidate.primary) ?? version.files.at(0);

	if (!file || file.size <= 0) {
		return null;
	}

	if (!URL.canParse(file.url) || new URL(file.url).hostname !== MODRINTH_CDN) {
		return null;
	}

	const sha512 = file.hashes.sha512 ?? "";

	return {
		filename: file.filename,
		url: file.url,
		sizeBytes: file.size,
		digest: SHA512_PATTERN.test(sha512) ? `sha512:${sha512}` : null,
	};
};
