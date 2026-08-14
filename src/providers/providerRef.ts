const SEPARATOR = ":";

export interface ProviderRef {
	provider: string;
	project: string;
}

export const encodeProviderRef = (provider: string, project: string) => {
	return `${provider}${SEPARATOR}${project}`;
};

export const decodeProviderRef = (id: string): ProviderRef | null => {
	const index = id.indexOf(SEPARATOR);

	if (index <= 0 || index === id.length - 1) {
		return null;
	}

	return {
		provider: id.slice(0, index),
		project: id.slice(index + 1),
	};
};
