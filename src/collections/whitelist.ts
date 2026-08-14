import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { crossplayEnabled, FLOODGATE_PREFIX } from "../companions";

const WHITELIST_FILE = "whitelist.json";

interface WhitelistEntry {
	name?: unknown;
}

const isBedrockName = (input: string) => {
	return input.startsWith(FLOODGATE_PREFIX) || input.includes(" ");
};

export const whitelist: Bridge.Collection = {
	kind: BridgeKind.Collection,
	async list(context) {
		if (!(await context.files.exists(WHITELIST_FILE))) {
			return [];
		}

		const parsed: unknown = JSON.parse(await context.files.read(WHITELIST_FILE));

		if (!Array.isArray(parsed)) {
			return [];
		}

		return parsed
			.map((entry: unknown) => {
				const name = (entry as WhitelistEntry).name;

				return typeof name === "string" ? name : null;
			})
			.filter((name): name is string => name !== null)
			.map((name) => {
				return {
					id: name,
					name,
				};
			});
	},
	async add(context, input) {
		const name = input.trim();

		if (crossplayEnabled(context) && isBedrockName(name)) {
			await context.command(`fwhitelist add ${JSON.stringify(name)}`);

			return;
		}

		await context.command(`whitelist add ${name}`);
	},
	actions: {
		async remove(context, row) {
			if (crossplayEnabled(context) && isBedrockName(row.id)) {
				await context.command(`fwhitelist remove ${JSON.stringify(row.id)}`);

				return;
			}

			await context.command(`whitelist remove ${row.id}`);
		},
	},
};
