import type { Bridge } from "@serverkgg/bridge";
import type { CatalogTarget } from "../catalogTarget";

export enum CatalogProviderId {
	CurseForge = "curseforge",
	Hangar = "hangar",
	Modrinth = "modrinth",
}

export interface CatalogFile {
	filename: string;
	url: string;
	sizeBytes: number | null;
	digest: string | null;
}

export interface CatalogRelease {
	title: string;
	version: string;
	icon: string | null;
	pageUrl: string | null;
	file: CatalogFile;
	dependencies: string[];
}

export interface CatalogSearch {
	query: string;
	page: number;
	pageSize: number;
	category: string | null;
	sort: string | null;
}

export interface CatalogResults {
	hits: Omit<Bridge.CatalogHit, "provider">[];
	total: number;
}

export interface CatalogProvider {
	id: CatalogProviderId;
	label: Bridge.Text;
	note: Bridge.Text;
	sorts: Bridge.CatalogFacet[];
	categories(target: CatalogTarget): Bridge.CatalogFacet[];
	supports(target: CatalogTarget): boolean;
	ready(context: Bridge.Context): boolean;
	search(context: Bridge.Context, target: CatalogTarget, search: CatalogSearch): Promise<CatalogResults>;
	resolve(context: Bridge.Context, target: CatalogTarget, project: string): Promise<CatalogRelease | null>;
}
