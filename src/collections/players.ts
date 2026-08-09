import { type Bridge, BridgeKind } from "@serverkgg/bridge";

const LIST_REPLY = /There are \d+ of a max of \d+ players online:(?<names>.*)$/;

export const players: Bridge.Collection = {
	kind: BridgeKind.Collection,
	requiresRunning: true,
	refreshSeconds: 15,
	async list(context) {
		const reply = await context.command("list", {
			expect: LIST_REPLY,
		});

		return (reply.groups.names ?? "")
			.split(",")
			.map((name) => name.trim())
			.filter((name) => name.length > 0)
			.map((name) => {
				return {
					id: name,
					name,
				};
			});
	},
	actions: {
		async kick(context, row) {
			await context.command(`kick ${row.id}`);
		},
		async ban(context, row) {
			await context.command(`ban ${row.id}`);
		},
		async op(context, row) {
			await context.command(`op ${row.id}`);
		},
	},
};
