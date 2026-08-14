import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import {
	activeWorld,
	discoverWorlds,
	findLevelDirectories,
	relativeWorldSource,
	safeWorldName,
	setActiveWorld,
	worldDimensions,
	worldPaths,
	worldSize,
} from "./world";

const BASE_UNIT = "B";

const SIZE_UNITS = [
	BASE_UNIT,
	"KB",
	"MB",
	"GB",
	"TB",
];

const SIZE_STEP = 1024;

const ACTIVE_MARK = "✓";

const formatSize = (bytes: number) => {
	let value = bytes;
	let unit = 0;

	while (value >= SIZE_STEP && unit < SIZE_UNITS.length - 1) {
		value /= SIZE_STEP;
		unit += 1;
	}

	const symbol = SIZE_UNITS.at(unit) ?? BASE_UNIT;

	return unit === 0 ? `${value} ${symbol}` : `${value.toFixed(1)} ${symbol}`;
};

const nameOf = (path: string) => {
	return path.split("/").at(-1) ?? "";
};

const uploadedWorldDirectory = async (context: Bridge.Context, source: string) => {
	const found = await findLevelDirectories(context, source);

	if (found.length === 0) {
		throw new Error(
			"ما لقينا ملف level.dat جوّا الملف المضغوط، تأكد إنك ضاغط مجلد الماب نفسه — the archive holds no level.dat, make sure you zipped the world folder itself",
		);
	}

	if (found.includes(source)) {
		return source;
	}

	const nested = found.at(0);

	if (found.length > 1 || nested === undefined) {
		throw new Error(
			"الملف فيه أكثر من ماب، ارفع كل ماب لحالها — the archive holds more than one world, upload them one at a time",
		);
	}

	return nested;
};

const refuseActiveWorld = async (context: Bridge.Context, name: string) => {
	if ((await activeWorld(context)) !== name) {
		return;
	}

	throw new Error(
		"ما تقدر تحذف الماب الشغّالة، فعّل ماب ثانية أول — you cannot delete the active world, activate another one first",
	);
};

export const worlds: Bridge.Collection = {
	kind: BridgeKind.Collection,

	async list(context) {
		const active = await activeWorld(context);
		const rows: Bridge.Row[] = [];

		for (const name of await discoverWorlds(context)) {
			rows.push({
				id: name,
				name,
				size: formatSize(await worldSize(context, name)),
				active: name === active ? ACTIVE_MARK : "",
				path: name,
			});
		}

		return rows;
	},

	async add(context, input) {
		const source = relativeWorldSource(input);

		if (source === null || !(await context.files.exists(source))) {
			throw new Error("ما لقينا الملفات اللي رفعتها — the uploaded files were not found");
		}

		const directory = await uploadedWorldDirectory(context, source);
		const name = safeWorldName(nameOf(directory));

		if (name.length === 0) {
			throw new Error(
				"سمّ مجلد الماب بأحرف إنجليزية وأرقام وارفعه مرة ثانية — name the world folder with latin letters and digits and upload it again",
			);
		}

		for (const path of worldPaths(name)) {
			if (await context.files.exists(path)) {
				throw new Error(`عندك ماب اسمها "${name}"، غيّر اسم المجلد وارفعه — a world named "${name}" is already here`);
			}
		}

		await context.files.move(directory, name);

		if (directory !== source) {
			await context.files.remove(source);
		}

		context.log("added a world", {
			world: name,
		});
	},

	actions: {
		async activate(context, row) {
			if ((await activeWorld(context)) === row.id) {
				throw new Error("هذي الماب شغّالة أصلًا — this world is already the active one");
			}

			await setActiveWorld(context, row.id);

			context.log("switched the active world", {
				world: row.id,
			});
		},

		async delete(context, row) {
			await refuseActiveWorld(context, row.id);

			for (const path of worldPaths(row.id)) {
				await context.files.remove(path);
			}

			context.log("deleted a world", {
				world: row.id,
			});
		},

		async resetNether(context, row) {
			const { nether } = worldDimensions(context, row.id);

			await context.files.remove(nether);

			context.log("reset the nether", {
				world: row.id,
				path: nether,
			});
		},

		async resetEnd(context, row) {
			const { end } = worldDimensions(context, row.id);

			await context.files.remove(end);

			context.log("reset the end", {
				world: row.id,
				path: end,
			});
		},
	},
};
