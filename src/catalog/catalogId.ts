const SEPARATOR = ":";

export interface CatalogId {
	provider: string;
	project: string;
}

export const encodeCatalogId = (provider: string, project: string) => {
	return `${provider}${SEPARATOR}${project}`;
};

export const decodeCatalogId = (id: string): CatalogId | null => {
	const index = id.indexOf(SEPARATOR);

	if (index <= 0 || index === id.length - 1) {
		return null;
	}

	return {
		provider: id.slice(0, index),
		project: id.slice(index + 1),
	};
};
