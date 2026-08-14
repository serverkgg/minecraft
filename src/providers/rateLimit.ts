import { BridgeFailureCode, BridgeFailureError, BridgeNetError } from "@serverkgg/bridge";

const THROTTLED_STATUSES = [
	429,
	503,
];

export const asRateLimit = (error: unknown, provider: string) => {
	if (!(error instanceof BridgeNetError) || error.status === null || !THROTTLED_STATUSES.includes(error.status)) {
		return error;
	}

	return new BridgeFailureError(
		BridgeFailureCode.CatalogRateLimited,
		`${provider} asked us to slow down, wait a moment and try again`,
	);
};
