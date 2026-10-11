import { loadFont } from '@remotion/fonts';
import geist from '@fontsource-variable/geist/files/geist-latin-wght-normal.woff2';
import anuphan from '@fontsource-variable/anuphan/files/anuphan-thai-wght-normal.woff2';

// loadFont delays rendering until each font is ready.
loadFont({ family: 'Geist', url: geist, weight: '100 900' });
loadFont({ family: 'Anuphan', url: anuphan, weight: '100 900' });
