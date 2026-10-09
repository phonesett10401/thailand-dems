import { env } from '$env/dynamic/public';
import { createApi } from './api';
import { markOffline } from './status.svelte';

export const api = createApi(env.PUBLIC_API_URL || 'http://localhost:5000/api', markOffline);
