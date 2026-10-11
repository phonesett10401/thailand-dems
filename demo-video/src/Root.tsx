import { Composition } from 'remotion';
import { COMPOSITIONS } from './compositions';
import { Demo } from './Demo';
import { FPS, TOTAL } from './timeline';

export function Root() {
	return (
		<>
			{COMPOSITIONS.map((c) => (
				<Composition key={c.id} id={c.id} component={Demo} durationInFrames={TOTAL} fps={FPS} width={c.width} height={c.height} defaultProps={{ layout: c.layout, lang: 'en' as const }} />
			))}
		</>
	);
}
