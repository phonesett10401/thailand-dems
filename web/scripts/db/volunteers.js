import { randomBytes } from 'node:crypto';

export const volunteerEmail = (username) =>
	`${username.toLowerCase().replace(/[^a-z0-9._-]/g, '')}@volunteers.example.com`;

export const randomPassword = () => randomBytes(12).toString('base64url');
