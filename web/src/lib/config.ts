import { createApi } from './api';
import { markOffline } from './status.svelte';

// The API lives in this app (src/routes/api), so calls are same-origin.
export const api = createApi('/api', markOffline);
