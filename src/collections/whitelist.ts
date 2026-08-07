import { type Bridge, BridgeKind } from "@serverkgg/bridge";

const WHITELIST_FILE = "whitelist.json";

interface WhitelistEntry {
	name?: unknown;
}

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
		await context.command(`whitelist add ${input}`);
	},
	actions: {
		async remove(context, row) {
			await context.command(`whitelist remove ${row.id}`);
		},
	},
};
