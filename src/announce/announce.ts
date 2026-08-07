import { type Bridge, BridgeKind } from "@serverkgg/bridge";

const PREFIX = "[ServerK]";

const COLOR = "gold";

export const announce: Bridge.Announce = {
	kind: BridgeKind.Announce,
	async announce(context, message) {
		for (const text of [
			message.ar,
			message.en,
		]) {
			await context.command(
				`tellraw @a ${JSON.stringify({
					text: `${PREFIX} ${text}`,
					color: COLOR,
				})}`,
			);
		}
	},
};
