/** Index of the snap height to settle on. velocity is px/ms, positive = finger moving up. */
export function nearestSnap(height: number, snaps: number[], velocity = 0): number {
	if (velocity > 0.5) {
		const i = snaps.findIndex((s) => s > height);
		return i === -1 ? snaps.length - 1 : i;
	}
	if (velocity < -0.5) {
		for (let i = snaps.length - 1; i >= 0; i--) if (snaps[i] < height) return i;
		return 0;
	}
	let best = 0;
	for (let i = 1; i < snaps.length; i++) if (Math.abs(snaps[i] - height) < Math.abs(snaps[best] - height)) best = i;
	return best;
}
