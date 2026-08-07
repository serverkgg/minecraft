import { type Bridge, BridgeKind, BridgeStream } from "@serverkgg/bridge";

export const events: Bridge.Events = {
	kind: BridgeKind.Events,
	patterns: [
		{
			match: /(?<player>\w{3,16}) joined the game/,
			emit: "PlayerJoined",
		},
		{
			match: /(?<player>\w{3,16}) left the game/,
			emit: "PlayerLeft",
		},
		{
			match: /Done \([\d.]+s\)! For help, type "help"/,
			emit: "ServerStarted",
		},
		{
			match: /Stopping the server/,
			emit: "ServerStopping",
		},
		{
			match: /Saved the game/,
			emit: "WorldSaved",
		},
		{
			match: /\[(?<player>\w{3,16}): Set own game mode to (?<mode>[\w ]+)\]/,
			emit: "GameModeChanged",
		},
		{
			match: /(?<error>java\.lang\.OutOfMemoryError.*)/,
			emit: "ServerCrashed",
			stream: BridgeStream.Stderr,
		},
	],
};
