export const CHECK_KEY = 'dems.gobag';

const storage = (): Storage | null => {
	try {
		return typeof localStorage === 'undefined' ? null : localStorage;
	} catch {
		return null;
	}
};

export function loadChecks(st: Pick<Storage, 'getItem'> | null = storage()): Set<string> {
	try {
		const raw = st?.getItem(CHECK_KEY);
		const list: unknown = raw ? JSON.parse(raw) : [];
		return new Set(Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : []);
	} catch {
		return new Set();
	}
}

export function saveChecks(done: Set<string>, st: Pick<Storage, 'setItem'> | null = storage()): void {
	try {
		st?.setItem(CHECK_KEY, JSON.stringify([...done]));
	} catch {
		// private mode or full storage: ticks just aren't remembered
	}
}

export function toggled(done: Set<string>, id: string): Set<string> {
	const n = new Set(done);
	if (n.has(id)) n.delete(id);
	else n.add(id);
	return n;
}
