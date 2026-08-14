import type { Bridge } from "@serverkgg/bridge";

export const DIFFICULTIES: readonly string[] = [
	"peaceful",
	"easy",
	"normal",
	"hard",
];

export const GAME_MODES: readonly string[] = [
	"survival",
	"creative",
	"adventure",
	"spectator",
];

export const XP_MIN_LEVELS = 1;

export const XP_MAX_LEVELS = 100;

export const choiceArgument = (args: Bridge.Values, key: string, choices: readonly string[]) => {
	const value = String(args[key] ?? "");

	if (!choices.includes(value)) {
		throw new Error(`الخيار اللي اخترته ما نعرفه — "${value}" is not one of ${choices.join(", ")}`);
	}

	return value;
};

export const levelsArgument = (args: Bridge.Values) => {
	const levels = Number(args.amount ?? Number.NaN);

	if (!Number.isInteger(levels) || levels < XP_MIN_LEVELS || levels > XP_MAX_LEVELS) {
		throw new Error(
			`اكتب رقم بين ${XP_MIN_LEVELS} و ${XP_MAX_LEVELS} — the amount must be a whole number between ${XP_MIN_LEVELS} and ${XP_MAX_LEVELS}`,
		);
	}

	return levels;
};
