import type { Bridge } from "@serverkgg/bridge";
import type { CatalogTarget } from "../catalogTarget";
import { curseForgeProvider } from "./curseforge";
import { hangarProvider } from "./hangar";
import { modrinthProvider } from "./modrinth";
import type { CatalogProvider } from "./provider";

const PROVIDERS: CatalogProvider[] = [
	modrinthProvider,
	curseForgeProvider,
	hangarProvider,
];

export const providersFor = (target: CatalogTarget) => {
	return PROVIDERS.filter((provider) => provider.supports(target));
};

export const providerById = (id: string) => {
	return PROVIDERS.find((provider) => provider.id === id) ?? null;
};

export const describeProviders = (context: Bridge.Context, target: CatalogTarget): Bridge.CatalogProvider[] => {
	return providersFor(target).map((provider) => {
		const ready = provider.ready(context);

		return {
			id: provider.id,
			label: provider.label,
			ready,
			...(ready
				? {}
				: {
						note: provider.note,
					}),
		};
	});
};

export const defaultProvider = (context: Bridge.Context, target: CatalogTarget) => {
	const available = providersFor(target);

	return available.find((provider) => provider.ready(context)) ?? available.at(0) ?? null;
};

export const resolveProvider = (context: Bridge.Context, target: CatalogTarget, requested: string | null) => {
	if (!requested) {
		return defaultProvider(context, target);
	}

	const provider = providerById(requested);

	return provider?.supports(target) ? provider : defaultProvider(context, target);
};
