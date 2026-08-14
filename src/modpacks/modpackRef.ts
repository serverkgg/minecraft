const SEPARATOR = ":";

export interface ModpackRef {
	provider: string;
	project: string;
	versionId: string;
}

export const encodeModpackRef = (provider: string, project: string, versionId: string) => {
	return [
		provider,
		project,
		versionId,
	].join(SEPARATOR);
};

export const decodeModpackRef = (value: string): ModpackRef | null => {
	const parts = value.split(SEPARATOR);

	if (parts.length !== 3) {
		return null;
	}

	const [provider, project, versionId] = parts;

	if (!provider || !project || !versionId) {
		return null;
	}

	return {
		provider,
		project,
		versionId,
	};
};
