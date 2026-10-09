# Supabase Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move DEMS data and auth to Supabase (Postgres + Auth) with the API inside `web/`, so the citizen site runs on Vercel + Supabase only, with real invite-only admin and volunteer logins.

**Architecture:** A tested converter turns the live MySQL schema (read from `information_schema`) into `web/supabase/migrations/0001_init.sql` (snake_case tables/columns, CHECK-based enums, identity keys, deferrable FKs, RLS on, grants revoked) plus a generated column-name map. Triggers are hand-ported in `0002_triggers.sql` and applied after the one-off data copy. SvelteKit `+server.ts` routes query Postgres through the `postgres` driver and return the old PascalCase JSON via the column map. `@supabase/ssr` provides cookie sessions; `getClaims()` + `app_metadata.role` drive server-side guards.

**Tech Stack:** SvelteKit 2.70 / Svelte 5 / TypeScript (existing `web/`), `postgres` 3.4.9, `@supabase/ssr` 0.12.7, `@supabase/supabase-js` 2.117.3, `mysql2` 3.24.5 (dev, migration only), Vitest 4, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-10-supabase-backend-design.md`

## Global Constraints

- Work in `web/`; never modify `backend/` or `frontend/`.
- Secrets live only in `web/.env` (gitignored) and `backend/.env` (gitignored). **Never print a secret value**, never commit one, never put one in a command-line argument. Scripts load env with `process.loadEnvFile()`.
- `DATABASE_URL` is the Supabase **transaction pooler** (port 6543): every `postgres()` client uses `{ prepare: false }`.
- Server-only modules live under `web/src/lib/server/` (SvelteKit refuses to bundle them into the browser).
- Postgres names are snake_case; the API returns the **existing PascalCase JSON** (`ShelterName`, `ShelterID`, …).
- Citizen pages keep `ssr = false`; `/admin/*` and `/volunteer/*` set `ssr = true`.
- Every user-visible string goes through Paraglide (`messages/en.json` + `th.json`; Thai drafts listed in `messages/TH_REVIEW.md`).
- Scripts that touch the live Supabase project are run by the executor **only at the steps that say so**, and print counts/status only.
- Commits carry no Claude attribution lines. Never push; the owner pushes.
- Pinned versions: `postgres@^3.4.9`, `@supabase/ssr@^0.12.7`, `@supabase/supabase-js@^2.117.3`, `mysql2@^3.24.5`.

## Review Focus

1. **A citizen report arrives while Supabase is paused or the pooler is down** → the browser gets the existing "Couldn't reach the server…" message and keeps the form; nothing half-written. *Pinned by Task 10 e2e "backend down keeps the form" (now mocking `/api/**`).*
2. **Someone spams `POST /api/reports`** → after 5 reports in 10 minutes from one IP hash the 6th gets `429` and the UI says to wait; raw IPs are never stored. *Pinned by Task 9 `rate-limit.test.ts` and Task 10 e2e "too many reports".*
3. **A signed-in volunteer (or a forged cookie) requests an admin route** → `403`, never data; signed-out → `401` / redirect to login. *Pinned by Task 7 `auth.test.ts` and Task 11 e2e "admin redirect".*
4. **Migration run twice, or interrupted halfway** → second run refuses (target not empty); the copy runs in one transaction so a failure leaves no partial data. *Pinned by Task 5 `transform.test.ts` guard test and the transaction in `migrate-from-mysql.js`.*
5. **The publishable key is used to read tables directly via the Data API** → permission denied for every table. *Pinned by Task 12 smoke check (live).*

---

## File Structure

```
web/
  package.json                         + deps, scripts
  .env.example                         Supabase names (PUBLIC_API_URL removed)
  .gitignore                           + volunteer-logins.local.txt
  supabase/
    mysql-model.json                   introspected MySQL schema (no data)
    migrations/0001_init.sql           generated tables, indexes, FKs, touch triggers, RLS
    migrations/0002_triggers.sql       12 ported business triggers
  scripts/
    schema/names.js (+ .test.js)       table map, toSnake
    schema/convert.js (+ .test.js)     model → Postgres DDL (pure)
    schema/introspect-mysql.js         MySQL information_schema → mysql-model.json
    schema/generate.js                 model → 0001_init.sql + column-names.ts
    db/env.js                          loads backend/.env and web/.env
    db/apply-migrations.js             runs supabase/migrations/*.sql once each
    db/transform.js (+ .test.js)       MySQL row → Postgres row (pure)
    db/migrate-from-mysql.js           one-off data copy
    db/volunteers.js (+ .test.js)      email/password helpers (pure)
    db/create-volunteer-users.js       Supabase Auth users for volunteers
    db/create-admin.js                 create/promote an admin
    db/smoke-supabase.js               live checks
  src/
    app.d.ts                           Locals typing
    hooks.server.ts                    paraglide + supabase handles
    lib/server/db.ts                   postgres client singleton
    lib/server/column-names.ts         generated snake → Pascal map
    lib/server/rows.ts (+ .test.ts)    pascalize()
    lib/server/auth.ts (+ .test.ts)    requireRole()
    lib/server/report-input.ts (+ .test.ts)
    lib/server/rate-limit.ts (+ .test.ts)
    lib/server/queries.ts              list/insert SQL
    routes/api/shelters/+server.ts
    routes/api/disasters/+server.ts
    routes/api/alerts/+server.ts
    routes/api/evacuation/routes/+server.ts
    routes/api/reports/+server.ts
    routes/admin/+layout.ts, login/, (protected)/
    routes/volunteer/+layout.ts, login/, (protected)/
    routes/auth/logout/+page.server.ts
  tests/e2e/auth.spec.ts
```

---

### Task 1: Dependencies, env plumbing, database client

**Files:**
- Modify: `web/package.json`, `web/.env.example`, `web/.gitignore`, `web/src/lib/config.ts` (later in Task 10; not here)
- Create: `web/src/lib/server/db.ts`, `web/scripts/db/env.js`

**Interfaces:**
- Produces: `sql()` from `$lib/server/db` (lazy `postgres` client); `loadEnvs()` from `scripts/db/env.js` returning `{ web: Record<string,string>, backend: Record<string,string> }`.

- [ ] **Step 1: Install**

Run (in `web/`): `npm i postgres@^3.4.9 @supabase/ssr@^0.12.7 @supabase/supabase-js@^2.117.3 && npm i -D mysql2@^3.24.5`
Expected: added packages, no errors.

- [ ] **Step 2: Scripts in `web/package.json`** — add to `"scripts"`:

```json
"schema:introspect": "node scripts/schema/introspect-mysql.js",
"schema:generate": "node scripts/schema/generate.js",
"db:apply": "node scripts/db/apply-migrations.js",
"db:migrate-data": "node scripts/db/migrate-from-mysql.js",
"db:volunteers": "node scripts/db/create-volunteer-users.js",
"db:create-admin": "node scripts/db/create-admin.js",
"db:smoke": "node scripts/db/smoke-supabase.js"
```

- [ ] **Step 3: `web/.env.example`** (replace whole file)

```
# Supabase project (dashboard → Project Settings → API Keys / Connect)
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_PUBLISHABLE_KEY=
# Server-only. Never expose.
SUPABASE_SECRET_KEY=
# Transaction pooler connection string (port 6543)
DATABASE_URL=
```

- [ ] **Step 4: `web/.gitignore`** — append `volunteer-logins.local.txt`.

- [ ] **Step 5: `web/scripts/db/env.js`**

```js
// Loads env files for one-off scripts without printing anything.
import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

const read = (url) => (existsSync(url) ? parseEnv(readFileSync(url, 'utf8')) : {});

export function loadEnvs() {
	return {
		web: read(new URL('../../.env', import.meta.url)),
		backend: read(new URL('../../../backend/.env', import.meta.url))
	};
}

export function need(env, ...keys) {
	const missing = keys.filter((k) => !env[k]);
	if (missing.length) throw new Error(`Missing in .env: ${missing.join(', ')}`);
	return env;
}
```

- [ ] **Step 6: `web/src/lib/server/db.ts`**

```ts
import postgres from 'postgres';
import { env } from '$env/dynamic/private';

let client: postgres.Sql | null = null;

/** One small pool per server instance. Transaction pooler → no prepared statements. */
export function sql(): postgres.Sql {
	if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
	client ??= postgres(env.DATABASE_URL, { prepare: false, max: 1, idle_timeout: 20, connect_timeout: 10 });
	return client;
}
```

- [ ] **Step 7: Verify** — `npm run check && npm test` → 0 errors; 53 tests pass.

- [ ] **Step 8: Commit** — `git add web/package.json web/package-lock.json web/.env.example web/.gitignore web/scripts/db/env.js web/src/lib/server/db.ts` (package-lock is gitignored at repo root; `git add` will skip it — fine) then `git commit -m "web: add postgres/supabase deps and server db client"`.

---

### Task 2: Name mapping and schema converter (pure, tested)

**Files:**
- Create: `web/scripts/schema/names.js`, `web/scripts/schema/names.test.js`, `web/scripts/schema/convert.js`, `web/scripts/schema/convert.test.js`
- Modify: `web/vite.config.ts` (test include already covers `scripts/**/*.test.js`)

**Interfaces:**
- Produces: `TABLES: Record<string,string>` (MySQL lowercase name → snake_case Postgres name), `toSnake(name: string): string`; `toPostgres(model, opts): string` where `model = { tables: Table[] }`, `Table = { name, columns: Column[], primaryKey: string[], uniques: string[][], indexes: string[][], foreignKeys: Fk[] }`, `Column = { name, dataType, columnType, nullable: boolean, default: string|null, extra: string, generation: string }`, `Fk = { name, columns: string[], refTable, refColumns: string[], onDelete: string }`, `opts = { dropColumns?: Record<string,string[]> }`; `columnMap(model, opts): Record<string,string>` (snake → Pascal for every kept column).

- [ ] **Step 1: Failing tests**

`web/scripts/schema/names.test.js`:
```js
import { describe, expect, it } from 'vitest';
import { TABLES, toSnake } from './names.js';

describe('toSnake', () => {
	it('splits PascalCase and acronyms', () => {
		expect(toSnake('ShelterName')).toBe('shelter_name');
		expect(toSnake('ShelterID')).toBe('shelter_id');
		expect(toSnake('MOUID')).toBe('mou_id');
		expect(toSnake('MOUTitle')).toBe('mou_title');
		expect(toSnake('ID')).toBe('id');
		expect(toSnake('PM25Level')).toBe('pm25_level');
	});
});

describe('TABLES', () => {
	it('maps all 35 lowercase MySQL tables to snake_case', () => {
		expect(Object.keys(TABLES)).toHaveLength(35);
		expect(TABLES.agencyactivations).toBe('agency_activations');
		expect(TABLES.agencymou).toBe('agency_mou');
		expect(TABLES.userreports).toBe('user_reports');
		expect(TABLES.facilityactivations).toBe('facility_activations');
	});
});
```

`web/scripts/schema/convert.test.js`:
```js
import { describe, expect, it } from 'vitest';
import { columnMap, toPostgres } from './convert.js';

const col = (o) => ({ nullable: true, default: null, extra: '', generation: '', ...o });
const model = {
	tables: [
		{
			name: 'shelters',
			columns: [
				col({ name: 'ShelterID', dataType: 'int', columnType: 'int', nullable: false, extra: 'auto_increment' }),
				col({ name: 'ShelterName', dataType: 'varchar', columnType: 'varchar(100)', nullable: false }),
				col({ name: 'Status', dataType: 'enum', columnType: "enum('Available','Full','Closed')", default: 'Available' }),
				col({ name: 'Capacity', dataType: 'int', columnType: 'int', default: '0' }),
				col({ name: 'Latitude', dataType: 'decimal', columnType: 'decimal(10,8)' }),
				col({ name: 'IsActive', dataType: 'tinyint', columnType: 'tinyint(1)', default: '1' }),
				col({ name: 'CreatedAt', dataType: 'timestamp', columnType: 'timestamp', default: 'CURRENT_TIMESTAMP', extra: 'DEFAULT_GENERATED' }),
				col({ name: 'UpdatedAt', dataType: 'timestamp', columnType: 'timestamp', default: 'CURRENT_TIMESTAMP', extra: 'DEFAULT_GENERATED on update CURRENT_TIMESTAMP' }),
				col({ name: 'Note', dataType: 'text', columnType: 'text', default: "it's" }),
				col({ name: 'Secret', dataType: 'varchar', columnType: 'varchar(255)' })
			],
			primaryKey: ['ShelterID'],
			uniques: [['ShelterName']],
			indexes: [['Status']],
			foreignKeys: []
		},
		{
			name: 'reliefsupplies',
			columns: [
				col({ name: 'SupplyID', dataType: 'int', columnType: 'int', nullable: false, extra: 'auto_increment' }),
				col({ name: 'ShelterID', dataType: 'int', columnType: 'int' }),
				col({ name: 'TotalQuantity', dataType: 'decimal', columnType: 'decimal(10,2)' }),
				col({ name: 'AllocatedQuantity', dataType: 'decimal', columnType: 'decimal(10,2)' }),
				col({ name: 'AvailableQuantity', dataType: 'decimal', columnType: 'decimal(10,2)', extra: 'STORED GENERATED', generation: '(`TotalQuantity` - `AllocatedQuantity`)' })
			],
			primaryKey: ['SupplyID'],
			uniques: [],
			indexes: [],
			foreignKeys: [{ name: 'fk_supply_shelter', columns: ['ShelterID'], refTable: 'shelters', refColumns: ['ShelterID'], onDelete: 'SET NULL' }]
		}
	]
};
const opts = { dropColumns: { shelters: ['Secret'] } };

describe('toPostgres', () => {
	const ddl = toPostgres(model, opts);
	it('creates snake_case tables with identity keys and mapped types', () => {
		expect(ddl).toContain('create table public.shelters (');
		expect(ddl).toContain('shelter_id integer generated by default as identity not null');
		expect(ddl).toContain('shelter_name varchar(100) not null');
		expect(ddl).toContain('latitude numeric(10,8)');
		expect(ddl).toContain('is_active boolean default true');
		expect(ddl).toContain('capacity integer default 0');
		expect(ddl).toContain('created_at timestamptz default now()');
		expect(ddl).toContain("note text default 'it''s'");
		expect(ddl).toContain('primary key (shelter_id)');
		expect(ddl).toContain('unique (shelter_name)');
	});
	it('turns enums into checks', () => {
		expect(ddl).toContain("status text default 'Available' check (status in ('Available', 'Full', 'Closed'))");
	});
	it('keeps generated columns as stored expressions', () => {
		expect(ddl).toContain('available_quantity numeric(10,2) generated always as ((total_quantity - allocated_quantity)) stored');
	});
	it('adds deferrable foreign keys after all tables', () => {
		const fk = ddl.indexOf('alter table public.relief_supplies add constraint fk_supply_shelter');
		expect(fk).toBeGreaterThan(ddl.indexOf('create table public.relief_supplies'));
		expect(ddl).toContain('foreign key (shelter_id) references public.shelters (shelter_id) on delete set null deferrable initially immediate;');
	});
	it('adds indexes, touch triggers for on-update columns, and locks tables down', () => {
		expect(ddl).toContain('create index shelters_status_idx on public.shelters (status);');
		expect(ddl).toContain('new.updated_at := now();');
		expect(ddl).toContain('create trigger shelters_touch before update on public.shelters');
		expect(ddl).toContain('alter table public.shelters enable row level security;');
		expect(ddl).toContain('revoke all on public.shelters from anon, authenticated;');
	});
	it('drops requested columns', () => {
		expect(ddl).not.toContain('secret');
	});
	it('rejects unknown MySQL types', () => {
		const bad = { tables: [{ ...model.tables[0], columns: [col({ name: 'X', dataType: 'geometry', columnType: 'geometry' })] }] };
		expect(() => toPostgres(bad, {})).toThrow('geometry');
	});
});

describe('columnMap', () => {
	it('maps snake back to the original Pascal names, skipping dropped columns', () => {
		const map = columnMap(model, opts);
		expect(map.shelter_id).toBe('ShelterID');
		expect(map.available_quantity).toBe('AvailableQuantity');
		expect(map.secret).toBeUndefined();
	});
});
```

- [ ] **Step 2: Run to verify failure** — `npx vitest run scripts/schema` → FAIL (cannot resolve modules).

- [ ] **Step 3: Implement `names.js`**

```js
/** Windows MySQL lowercased table names; these are the original PascalCase names, as snake_case. */
export const TABLES = {
	affectedpopulations: 'affected_populations',
	agencies: 'agencies',
	agencyactivations: 'agency_activations',
	agencymou: 'agency_mou',
	agencyresources: 'agency_resources',
	alerts: 'alerts',
	capacityalerts: 'capacity_alerts',
	damageassessments: 'damage_assessments',
	disasters: 'disasters',
	disastershelters: 'disaster_shelters',
	facilityactivations: 'facility_activations',
	hostfamilies: 'host_families',
	partnerfacilities: 'partner_facilities',
	recoveryprojects: 'recovery_projects',
	recruitmentcampaigns: 'recruitment_campaigns',
	reliefsupplies: 'relief_supplies',
	resourcerequests: 'resource_requests',
	responsetierdefinitions: 'response_tier_definitions',
	shelteractivationrequests: 'shelter_activation_requests',
	shelters: 'shelters',
	skills: 'skills',
	smartrecommendations: 'smart_recommendations',
	supplydistributions: 'supply_distributions',
	thailandlocations: 'thailand_locations',
	tierescalations: 'tier_escalations',
	tierresourcedeployments: 'tier_resource_deployments',
	trainingprograms: 'training_programs',
	userreports: 'user_reports',
	volunteeraccounts: 'volunteer_accounts',
	volunteerassignments: 'volunteer_assignments',
	volunteeravailability: 'volunteer_availability',
	volunteerdeployments: 'volunteer_deployments',
	volunteers: 'volunteers',
	volunteerskills: 'volunteer_skills',
	volunteertraining: 'volunteer_training'
};

export function toSnake(name) {
	return name
		.replace(/([A-Z]+)(ID)$/, '$1_$2') // MOUID → MOU_ID
		.replace(/([a-z0-9])([A-Z])/g, '$1_$2')
		.replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
		.toLowerCase()
		.replace(/^_/, '');
}

export function pgTable(mysqlName) {
	const t = TABLES[mysqlName.toLowerCase()];
	if (!t) throw new Error(`Unknown table: ${mysqlName}`);
	return t;
}
```

Note: `toSnake('ID')` → `([A-Z]+)(ID)$` needs at least one letter before `ID`, so `'ID'` stays `'ID'` → lowercased `'id'`. `'PM25Level'` → `pm25_level`.

- [ ] **Step 4: Implement `convert.js`**

```js
import { pgTable, toSnake } from './names.js';

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const kept = (t, opts) => t.columns.filter((c) => !(opts.dropColumns?.[t.name] ?? []).includes(c.name));

function pgType(c) {
	const len = c.columnType.match(/\((\d+)(?:,(\d+))?\)/);
	switch (c.dataType) {
		case 'int':
		case 'mediumint':
			return 'integer';
		case 'bigint':
			return 'bigint';
		case 'smallint':
			return 'smallint';
		case 'tinyint':
			return c.columnType === 'tinyint(1)' ? 'boolean' : 'smallint';
		case 'varchar':
		case 'char':
			return `varchar(${len[1]})`;
		case 'text':
		case 'mediumtext':
		case 'longtext':
		case 'enum':
			return 'text';
		case 'decimal':
			return `numeric(${len[1]},${len[2] ?? 0})`;
		case 'float':
		case 'double':
			return 'double precision';
		case 'date':
			return 'date';
		case 'datetime':
		case 'timestamp':
			return 'timestamptz';
		case 'json':
			return 'jsonb';
		default:
			throw new Error(`Unsupported MySQL type ${c.dataType} (${c.columnType})`);
	}
}

function pgDefault(c, type) {
	if (c.default === null) return '';
	if (c.default === 'CURRENT_TIMESTAMP') return ' default now()';
	if (type === 'boolean') return ` default ${c.default === '1' ? 'true' : 'false'}`;
	if (/^(integer|bigint|smallint|numeric|double)/.test(type)) return ` default ${c.default}`;
	return ` default ${q(c.default)}`;
}

function columnDdl(c) {
	const name = toSnake(c.name);
	const type = pgType(c);
	if (c.generation) {
		const expr = c.generation.replace(/`(\w+)`/g, (_, n) => toSnake(n));
		return `  ${name} ${type} generated always as (${expr}) stored`;
	}
	let s = `  ${name} ${type}`;
	if (c.extra.includes('auto_increment')) s += ' generated by default as identity';
	else s += pgDefault(c, type);
	if (!c.nullable) s += ' not null';
	if (c.dataType === 'enum') {
		const values = [...c.columnType.matchAll(/'((?:[^']|'')*)'/g)].map((m) => m[1].replace(/''/g, "'"));
		s += ` check (${name} in (${values.map(q).join(', ')}))`;
	}
	return s;
}

export function toPostgres(model, opts = {}) {
	const out = ['-- Generated by scripts/schema/generate.js from supabase/mysql-model.json. Do not edit by hand.', ''];
	for (const t of model.tables) {
		const name = pgTable(t.name);
		const lines = kept(t, opts).map(columnDdl);
		lines.push(`  primary key (${t.primaryKey.map(toSnake).join(', ')})`);
		for (const u of t.uniques) lines.push(`  unique (${u.map(toSnake).join(', ')})`);
		out.push(`create table public.${name} (\n${lines.join(',\n')}\n);`, '');
	}
	for (const t of model.tables) {
		const name = pgTable(t.name);
		for (const fk of t.foreignKeys) {
			out.push(
				`alter table public.${name} add constraint ${fk.name.toLowerCase()} foreign key (${fk.columns.map(toSnake).join(', ')}) references public.${pgTable(fk.refTable)} (${fk.refColumns.map(toSnake).join(', ')}) on delete ${fk.onDelete.toLowerCase()} deferrable initially immediate;`
			);
		}
		for (const ix of t.indexes) {
			const cols = ix.map(toSnake);
			out.push(`create index ${name}_${cols.join('_')}_idx on public.${name} (${cols.join(', ')});`);
		}
	}
	out.push('');
	for (const t of model.tables) {
		const name = pgTable(t.name);
		const touch = kept(t, opts).filter((c) => /on update CURRENT_TIMESTAMP/i.test(c.extra));
		if (touch.length) {
			out.push(
				`create function public.${name}_touch() returns trigger language plpgsql as $$\nbegin\n${touch.map((c) => `  new.${toSnake(c.name)} := now();`).join('\n')}\n  return new;\nend $$;`,
				`create trigger ${name}_touch before update on public.${name} for each row execute function public.${name}_touch();`,
				''
			);
		}
		out.push(`alter table public.${name} enable row level security;`, `revoke all on public.${name} from anon, authenticated;`);
	}
	out.push('revoke all on all sequences in schema public from anon, authenticated;', '');
	return out.join('\n');
}

export function columnMap(model, opts = {}) {
	const map = {};
	for (const t of model.tables) {
		for (const c of kept(t, opts)) {
			const s = toSnake(c.name);
			if (map[s] && map[s] !== c.name) throw new Error(`Column name clash: ${s} ← ${map[s]} / ${c.name}`);
			map[s] = c.name;
		}
	}
	return map;
}
```

- [ ] **Step 5: Run tests** — `npx vitest run scripts/schema` → PASS. Then `npm test` → all pass.

- [ ] **Step 6: Commit** — `git add web/scripts/schema && git commit -m "web: add MySQL→Postgres schema converter with tests"`

---

### Task 3: Introspect MySQL, generate 0001_init.sql and the column map

**Files:**
- Create: `web/scripts/schema/introspect-mysql.js`, `web/scripts/schema/generate.js`, `web/supabase/mysql-model.json` (generated), `web/supabase/migrations/0001_init.sql` (generated), `web/src/lib/server/column-names.ts` (generated)

**Interfaces:**
- Consumes: `toPostgres`, `columnMap` (Task 2), `loadEnvs`, `need` (Task 1)
- Produces: `COLUMN_NAMES: Record<string, string>` from `$lib/server/column-names`

- [ ] **Step 1: `introspect-mysql.js`**

```js
// Reads the live local MySQL schema (no data) into supabase/mysql-model.json.
import { writeFile } from 'node:fs/promises';
import mysql from 'mysql2/promise';
import { loadEnvs, need } from '../db/env.js';

const { backend } = loadEnvs();
need(backend, 'DATABASE_HOST', 'DATABASE_USER', 'DATABASE_NAME');
const db = await mysql.createConnection({
	host: backend.DATABASE_HOST,
	user: backend.DATABASE_USER,
	password: backend.DATABASE_PASSWORD,
	database: backend.DATABASE_NAME,
	port: Number(backend.DATABASE_PORT || 3306)
});
const schema = backend.DATABASE_NAME;
const q = async (s) => (await db.query(s, [schema]))[0];

const tables = await q(`select table_name as t from information_schema.tables where table_schema = ? and table_type = 'BASE TABLE' order by 1`);
const cols = await q(`select table_name t, column_name name, data_type dataType, column_type columnType, is_nullable n,
  column_default def, extra, generation_expression gen from information_schema.columns where table_schema = ? order by table_name, ordinal_position`);
const stats = await q(`select table_name t, index_name ix, non_unique nu, column_name c, seq_in_index s from information_schema.statistics
  where table_schema = ? order by table_name, index_name, seq_in_index`);
const fks = await q(`select k.table_name t, k.constraint_name name, k.column_name c, k.referenced_table_name rt, k.referenced_column_name rc,
  r.delete_rule del from information_schema.key_column_usage k join information_schema.referential_constraints r
  on r.constraint_schema = k.constraint_schema and r.constraint_name = k.constraint_name
  where k.table_schema = ? and k.referenced_table_name is not null order by k.table_name, k.constraint_name, k.ordinal_position`);
await db.end();

const groupIx = (t, unique) => {
	const by = new Map();
	for (const s of stats.filter((x) => x.t === t && x.ix !== 'PRIMARY' && Number(x.nu) === (unique ? 0 : 1))) {
		by.set(s.ix, [...(by.get(s.ix) ?? []), s.c]);
	}
	return [...by.values()];
};

const model = {
	tables: tables.map(({ t }) => {
		const fkBy = new Map();
		for (const f of fks.filter((x) => x.t === t)) {
			const e = fkBy.get(f.name) ?? { name: f.name, columns: [], refTable: f.rt, refColumns: [], onDelete: f.del };
			e.columns.push(f.c);
			e.refColumns.push(f.rc);
			fkBy.set(f.name, e);
		}
		return {
			name: t.toLowerCase(),
			columns: cols
				.filter((c) => c.t === t)
				.map((c) => ({
					name: c.name,
					dataType: c.dataType.toLowerCase(),
					// enum values keep their case ('Available' must stay 'Available')
					columnType: c.dataType.toLowerCase() === 'enum' ? c.columnType : c.columnType.toLowerCase(),
					nullable: c.n === 'YES',
					default: c.def,
					extra: c.extra ?? '',
					generation: c.gen ?? ''
				})),
			primaryKey: stats.filter((s) => s.t === t && s.ix === 'PRIMARY').map((s) => s.c),
			uniques: groupIx(t, true),
			indexes: groupIx(t, false),
			foreignKeys: [...fkBy.values()]
		};
	})
};

await writeFile(new URL('../../supabase/mysql-model.json', import.meta.url), JSON.stringify(model, null, '\t') + '\n');
console.log(`tables: ${model.tables.length}, columns: ${cols.length}, foreign keys: ${model.tables.reduce((n, t) => n + t.foreignKeys.length, 0)}`);
```

- [ ] **Step 2: Run it** (local MySQL must be running: `Get-Service MySQL80`)

Run: `npm run schema:introspect`
Expected: `tables: 35, columns: <~350>, foreign keys: 36`.

- [ ] **Step 3: `generate.js`**

```js
// mysql-model.json → supabase/migrations/0001_init.sql + src/lib/server/column-names.ts
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { columnMap, toPostgres } from './convert.js';

const OPTS = { dropColumns: { volunteeraccounts: ['Password'] } };

const EXTRA = `
-- Volunteer logins move to Supabase Auth (spec §4.5). Plain-text passwords are not migrated.
alter table public.volunteer_accounts add column user_id uuid unique references auth.users (id) on delete cascade;

-- Anonymous report rate limiting (spec §4.5). Stores only a salted SHA-256 of the IP.
create table public.report_rate_limits (
  ip_hash text not null,
  created_at timestamptz not null default now()
);
create index report_rate_limits_ip_hash_created_at_idx on public.report_rate_limits (ip_hash, created_at);
alter table public.report_rate_limits enable row level security;
revoke all on public.report_rate_limits from anon, authenticated;
`;

const model = JSON.parse(await readFile(new URL('../../supabase/mysql-model.json', import.meta.url), 'utf8'));
await mkdir(new URL('../../supabase/migrations/', import.meta.url), { recursive: true });
await writeFile(new URL('../../supabase/migrations/0001_init.sql', import.meta.url), toPostgres(model, OPTS) + EXTRA);

const map = columnMap(model, OPTS);
const ts = `// Generated by scripts/schema/generate.js. Do not edit by hand.\n// snake_case Postgres column → original PascalCase name used in API JSON.\nexport const COLUMN_NAMES: Record<string, string> = ${JSON.stringify(map, null, '\t')};\n`;
await writeFile(new URL('../../src/lib/server/column-names.ts', import.meta.url), ts);
console.log(`0001_init.sql written; ${Object.keys(map).length} column names mapped`);
```

- [ ] **Step 4: Run and inspect**

Run: `npm run schema:generate`
Expected: `0001_init.sql written; <N> column names mapped`.
Then check by eye: `grep -c "create table" supabase/migrations/0001_init.sql` → `36` (35 + `report_rate_limits`); `grep -c "deferrable initially immediate" supabase/migrations/0001_init.sql` → `36`; `grep -n "password" supabase/migrations/0001_init.sql` → no match.

- [ ] **Step 5: Verify** — `npm run check && npm test` → 0 errors, all pass.

- [ ] **Step 6: Commit** — `git add web/scripts/schema web/supabase web/src/lib/server/column-names.ts && git commit -m "web: generate Postgres schema and column map from live MySQL"`

---

### Task 4: Port the 12 triggers; migration runner; apply 0001

**Files:**
- Create: `web/supabase/migrations/0002_triggers.sql`, `web/scripts/db/apply-migrations.js`

**Interfaces:**
- Produces: `public.schema_migrations(name text primary key, applied_at timestamptz)`.
- Usage: `npm run db:apply -- --only 0001` applies just 0001; plain `npm run db:apply` applies all pending.

- [ ] **Step 1: `0002_triggers.sql`** (logic copied from each MySQL trigger body; behaviour unchanged)

```sql
-- Ported from MySQL triggers (spec §4.3). Applied after the data copy.

create function public.relief_supplies_status() returns trigger language plpgsql as $$
declare available numeric(10,2);
begin
  available := coalesce(new.total_quantity, 0) - coalesce(new.allocated_quantity, 0);
  if new.expiry_date is not null and new.expiry_date < current_date then new.status := 'Expired';
  elsif available <= 0 then new.status := 'Out of Stock';
  elsif available <= coalesce(new.minimum_threshold, 0) then new.status := 'Low Stock';
  else new.status := 'Available';
  end if;
  return new;
end $$;
create trigger update_supply_status_insert before insert on public.relief_supplies for each row execute function public.relief_supplies_status();
create trigger update_supply_status_update before update on public.relief_supplies for each row execute function public.relief_supplies_status();

create function public.shelters_status_insert() returns trigger language plpgsql as $$
declare pct numeric(5,2);
begin
  pct := case when new.capacity > 0 then (new.current_occupancy::numeric / new.capacity) * 100 else 0 end;
  if new.status not in ('Closed', 'Under Maintenance') then
    new.status := case when pct >= 100 then 'Full' else 'Available' end;
  end if;
  if new.current_occupancy > new.capacity then new.current_occupancy := new.capacity; end if;
  if new.current_occupancy < 0 then new.current_occupancy := 0; end if;
  if new.capacity < 0 then new.capacity := 0; end if;
  return new;
end $$;
create trigger update_shelter_status_insert before insert on public.shelters for each row execute function public.shelters_status_insert();

create function public.shelters_status_update() returns trigger language plpgsql as $$
declare pct numeric(5,2);
begin
  pct := case when new.capacity > 0 then (new.current_occupancy::numeric / new.capacity) * 100 else 0 end;
  if new.status not in ('Closed', 'Under Maintenance') then
    new.status := case when pct >= 100 then 'Full' else 'Available' end;
  end if;
  if new.current_occupancy > new.capacity then
    new.current_occupancy := new.capacity;
    new.status := 'Full';
  end if;
  if new.current_occupancy < 0 then new.current_occupancy := 0; end if;
  if new.capacity < 0 then new.capacity := 0; end if;
  if old.status = 'Full' and new.capacity > old.capacity and new.current_occupancy < new.capacity then
    new.status := 'Available';
  end if;
  return new;
end $$;
create trigger update_shelter_status_update before update on public.shelters for each row execute function public.shelters_status_update();

create function public.volunteer_assignment_insert() returns trigger language plpgsql as $$
begin
  if new.status = 'Active' then
    update public.volunteers set availability_status = 'Deployed' where volunteer_id = new.volunteer_id;
  end if;
  return null;
end $$;
create trigger update_volunteer_on_assignment_insert after insert on public.volunteer_assignments for each row execute function public.volunteer_assignment_insert();

create function public.volunteer_assignment_update() returns trigger language plpgsql as $$
begin
  if old.status = 'Active' and new.status in ('Completed', 'Cancelled') then
    if not exists (select 1 from public.volunteer_assignments
                   where volunteer_id = new.volunteer_id and status = 'Active' and assignment_id <> new.assignment_id) then
      update public.volunteers set availability_status = 'Available' where volunteer_id = new.volunteer_id;
    end if;
  end if;
  if old.status <> 'Active' and new.status = 'Active' then
    update public.volunteers set availability_status = 'Deployed' where volunteer_id = new.volunteer_id;
  end if;
  return null;
end $$;
create trigger update_volunteer_on_assignment_update after update on public.volunteer_assignments for each row execute function public.volunteer_assignment_update();

create function public.volunteer_hours_on_completion() returns trigger language plpgsql as $$
begin
  if old.status <> 'Completed' and new.status = 'Completed' and new.hours_worked > 0 then
    update public.volunteers set total_hours_contributed = total_hours_contributed + new.hours_worked where volunteer_id = new.volunteer_id;
  end if;
  if old.status = 'Completed' and new.status = 'Completed' and old.hours_worked <> new.hours_worked then
    update public.volunteers set total_hours_contributed = total_hours_contributed - old.hours_worked + new.hours_worked where volunteer_id = new.volunteer_id;
  end if;
  return null;
end $$;
create trigger update_volunteer_hours_on_completion after update on public.volunteer_assignments for each row execute function public.volunteer_hours_on_completion();

create function public.volunteer_hours_on_delete() returns trigger language plpgsql as $$
begin
  if old.status = 'Completed' and old.hours_worked > 0 then
    update public.volunteers set total_hours_contributed = greatest(0, total_hours_contributed - old.hours_worked) where volunteer_id = old.volunteer_id;
  end if;
  if old.status = 'Active' and not exists (select 1 from public.volunteer_assignments where volunteer_id = old.volunteer_id and status = 'Active') then
    update public.volunteers set availability_status = 'Available' where volunteer_id = old.volunteer_id;
  end if;
  return null;
end $$;
create trigger update_volunteer_hours_on_delete after delete on public.volunteer_assignments for each row execute function public.volunteer_hours_on_delete();

create function public.agency_resources_on_activation() returns trigger language plpgsql as $$
begin
  if new.status = 'Deployed' and old.status <> 'Deployed' then
    update public.agencies set status = 'Active' where agency_id = new.agency_id;
  end if;
  if new.status in ('Completed', 'Cancelled') and old.status in ('Deployed', 'Confirmed')
     and not exists (select 1 from public.agency_activations where agency_id = new.agency_id
                     and activation_id <> new.activation_id and status in ('Requested', 'Confirmed', 'Deployed')) then
    update public.agencies set status = 'Active' where agency_id = new.agency_id;
  end if;
  return null;
end $$;
create trigger update_resources_on_activation after update on public.agency_activations for each row execute function public.agency_resources_on_activation();

create function public.track_resource_deployment() returns trigger language plpgsql as $$
declare total_available int; total_deployed int;
begin
  select count(*) filter (where availability_status = 'Available'), count(*) filter (where availability_status = 'Deployed')
    into total_available, total_deployed from public.agency_resources where agency_id = new.agency_id;
  if (total_available = 0 and total_deployed > 0) or total_available > 0 then
    update public.agencies set status = 'Active' where agency_id = new.agency_id;
  end if;
  return null;
end $$;
create trigger track_resource_deployment after update on public.agency_resources for each row execute function public.track_resource_deployment();

create function public.validate_activation_request() returns trigger language plpgsql as $$
declare agency_status text;
begin
  select status into agency_status from public.agencies where agency_id = new.agency_id;
  if agency_status <> 'Active' then
    raise exception 'Cannot activate agency: Agency is not in Active status' using errcode = 'P0001';
  end if;
  if new.requested_at is null then new.requested_at := now(); end if;
  return new;
end $$;
create trigger validate_activation_request before insert on public.agency_activations for each row execute function public.validate_activation_request();

create function public.set_activation_timestamp() returns trigger language plpgsql as $$
begin
  if new.status = 'Deployed' and old.status <> 'Deployed' and new.activated_at is null then
    new.activated_at := now();
  end if;
  return new;
end $$;
create trigger set_activation_timestamp before update on public.agency_activations for each row execute function public.set_activation_timestamp();
```

Before Step 3, verify every column referenced above exists in `0001_init.sql` (e.g. `grep -nE "minimum_threshold|expiry_date|hours_worked|total_hours_contributed|availability_status|requested_at|activated_at" web/supabase/migrations/0001_init.sql`). If a name differs, fix it in `0002_triggers.sql` to match `0001` and ledger the ruling.

- [ ] **Step 2: `apply-migrations.js`**

```js
// Applies supabase/migrations/*.sql in name order, each once, each in its own transaction.
import { readdir, readFile } from 'node:fs/promises';
import postgres from 'postgres';
import { loadEnvs, need } from './env.js';

const { web } = loadEnvs();
need(web, 'DATABASE_URL');
const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;
const sql = postgres(web.DATABASE_URL, { prepare: false, max: 1, onnotice: () => {} });

await sql`create table if not exists public.schema_migrations (name text primary key, applied_at timestamptz not null default now())`;
await sql`alter table public.schema_migrations enable row level security`;
await sql`revoke all on public.schema_migrations from anon, authenticated`;

const dir = new URL('../../supabase/migrations/', import.meta.url);
const files = (await readdir(dir)).filter((f) => f.endsWith('.sql') && (!only || f.startsWith(only))).sort();
const done = new Set((await sql`select name from public.schema_migrations`).map((r) => r.name));

for (const f of files) {
	if (done.has(f)) {
		console.log(`skip    ${f}`);
		continue;
	}
	const text = await readFile(new URL(f, dir), 'utf8');
	await sql.begin(async (tx) => {
		await tx.unsafe(text);
		await tx`insert into public.schema_migrations (name) values (${f})`;
	});
	console.log(`applied ${f}`);
}
const [{ n }] = await sql`select count(*)::int n from information_schema.tables where table_schema = 'public'`;
console.log(`public tables: ${n}`);
await sql.end();
```

- [ ] **Step 3: Apply only the schema (live Supabase)**

Run: `npm run db:apply -- --only 0001`
Expected: `applied 0001_init.sql`. Running it again prints `skip    0001_init.sql`.

- [ ] **Step 4: Check the table count** — the Step 3 output ends with `public tables: 37` (35 + `report_rate_limits` + `schema_migrations`).

- [ ] **Step 5: Commit** — `git add web/supabase/migrations/0002_triggers.sql web/scripts/db/apply-migrations.js && git commit -m "web: port MySQL triggers to PL/pgSQL; add migration runner"`

---

### Task 5: Data transform (pure, tested) and one-off copy

**Files:**
- Create: `web/scripts/db/transform.js`, `web/scripts/db/transform.test.js`, `web/scripts/db/migrate-from-mysql.js`

**Interfaces:**
- Consumes: `pgTable`, `toSnake` (Task 2); `dropTestRecords` from `web/scripts/scrub.js`; model JSON (Task 3)
- Produces: `transformRows(table, rows, model, opts): object[]`, `isBlankReport(row): boolean`, `assertEmpty(counts: Record<string, number>): void`

- [ ] **Step 1: Failing test** `transform.test.js`

```js
import { describe, expect, it } from 'vitest';
import { assertEmpty, isBlankReport, transformRows } from './transform.js';

const model = {
	tables: [
		{
			name: 'volunteeraccounts',
			columns: [
				{ name: 'AccountID', dataType: 'int', columnType: 'int', generation: '' },
				{ name: 'Username', dataType: 'varchar', columnType: 'varchar(50)', generation: '' },
				{ name: 'Password', dataType: 'varchar', columnType: 'varchar(255)', generation: '' },
				{ name: 'IsActive', dataType: 'tinyint', columnType: 'tinyint(1)', generation: '' }
			]
		},
		{
			name: 'reliefsupplies',
			columns: [
				{ name: 'SupplyID', dataType: 'int', columnType: 'int', generation: '' },
				{ name: 'AvailableQuantity', dataType: 'decimal', columnType: 'decimal(10,2)', generation: '(`a` - `b`)' }
			]
		}
	]
};
const opts = { dropColumns: { volunteeraccounts: ['Password'] } };

describe('transformRows', () => {
	it('renames to snake_case, converts booleans and never copies passwords', () => {
		const out = transformRows('volunteeraccounts', [{ AccountID: 1, Username: 'kulap', Password: 'plain', IsActive: 1 }], model, opts);
		expect(out).toEqual([{ account_id: 1, username: 'kulap', is_active: true }]);
	});
	it('skips generated columns (Postgres computes them)', () => {
		expect(transformRows('reliefsupplies', [{ SupplyID: 3, AvailableQuantity: '9.00' }], model, opts)).toEqual([{ supply_id: 3 }]);
	});
	it('drops dev leftovers', () => {
		const rows = [{ AccountID: 1, Username: 'tester1', IsActive: 1 }, { AccountID: 2, Username: 'kulap', IsActive: 0 }];
		expect(transformRows('volunteeraccounts', rows, model, opts).map((r) => r.account_id)).toEqual([2]);
	});
});

describe('isBlankReport', () => {
	it('flags reports with no content at all', () => {
		expect(isBlankReport({ UserName: null, UserEmail: null, UserPhone: null, Description: null, ReportedLocation: null })).toBe(true);
		expect(isBlankReport({ UserName: null, Description: 'Water rising', ReportedLocation: null })).toBe(false);
	});
});

describe('assertEmpty', () => {
	it('refuses to import into a database that already has rows', () => {
		expect(() => assertEmpty({ shelters: 0, alerts: 0 })).not.toThrow();
		expect(() => assertEmpty({ shelters: 11, alerts: 0 })).toThrow('shelters');
	});
});
```

- [ ] **Step 2: Run** — `npx vitest run scripts/db/transform.test.js` → FAIL (module missing).

- [ ] **Step 3: `transform.js`**

```js
import { dropTestRecords } from '../scrub.js';
import { toSnake } from '../schema/names.js';

export function transformRows(table, rows, model, opts = {}) {
	const t = model.tables.find((x) => x.name === table);
	if (!t) throw new Error(`Unknown table ${table}`);
	const drop = new Set(opts.dropColumns?.[table] ?? []);
	const cols = t.columns.filter((c) => !c.generation && !drop.has(c.name));
	return dropTestRecords(rows).map((row) => {
		const out = {};
		for (const c of cols) {
			const v = row[c.name];
			out[toSnake(c.name)] = c.columnType === 'tinyint(1)' && v !== null && v !== undefined ? Boolean(Number(v)) : v;
		}
		return out;
	});
}

export function isBlankReport(row) {
	return ['UserName', 'UserEmail', 'UserPhone', 'Description', 'ReportedLocation'].every(
		(k) => row[k] === null || row[k] === undefined || String(row[k]).trim() === ''
	);
}

export function assertEmpty(counts) {
	const full = Object.entries(counts).filter(([, n]) => n > 0).map(([t]) => t);
	if (full.length) throw new Error(`Target already has data in: ${full.join(', ')}. Refusing to import twice.`);
}
```

Note: `dropTestRecords` drops `IsActive`-irrelevant rows only by text (`/\btest/i`); `'tester1'` is dropped, `'kulap'` kept, matching the test.

- [ ] **Step 4: Run** — `npx vitest run scripts/db` → PASS.

- [ ] **Step 5: `migrate-from-mysql.js`**

```js
// One-off copy: local MySQL → Supabase. Refuses to run twice. Prints counts only.
import { readFile } from 'node:fs/promises';
import mysql from 'mysql2/promise';
import postgres from 'postgres';
import { pgTable, toSnake } from '../schema/names.js';
import { loadEnvs, need } from './env.js';
import { assertEmpty, isBlankReport, transformRows } from './transform.js';

const OPTS = { dropColumns: { volunteeraccounts: ['Password'] } };
const { web, backend } = loadEnvs();
need(web, 'DATABASE_URL');
need(backend, 'DATABASE_HOST', 'DATABASE_USER', 'DATABASE_NAME');

const model = JSON.parse(await readFile(new URL('../../supabase/mysql-model.json', import.meta.url), 'utf8'));
const my = await mysql.createConnection({
	host: backend.DATABASE_HOST,
	user: backend.DATABASE_USER,
	password: backend.DATABASE_PASSWORD,
	database: backend.DATABASE_NAME,
	port: Number(backend.DATABASE_PORT || 3306),
	dateStrings: ['DATE'] // calendar dates stay calendar dates; timestamps keep their instant
});
const pg = postgres(web.DATABASE_URL, { prepare: false, max: 1 });

const before = {};
for (const t of model.tables) {
	const [{ n }] = await pg`select count(*)::int n from ${pg('public.' + pgTable(t.name))}`;
	before[pgTable(t.name)] = n;
}
assertEmpty(before);

const report = [];
await pg.begin(async (tx) => {
	await tx`set constraints all deferred`;
	for (const t of model.tables) {
		const [rows] = await my.query(`select * from \`${t.name}\``);
		const source = t.name === 'userreports' ? rows.filter((r) => !isBlankReport(r)) : rows;
		const out = transformRows(t.name, source, model, OPTS);
		const table = pgTable(t.name);
		for (let i = 0; i < out.length; i += 500) {
			await tx`insert into ${tx('public.' + table)} ${tx(out.slice(i, i + 500))}`;
		}
		const pk = t.columns.find((c) => c.extra?.includes('auto_increment'));
		if (pk) {
			const col = toSnake(pk.name);
			await tx.unsafe(
				`select setval(pg_get_serial_sequence('public.${table}', '${col}'), coalesce((select max(${col}) from public.${table}), 1), (select count(*) > 0 from public.${table}))`
			);
		}
		report.push([table, rows.length, out.length]);
	}
});
await my.end();
await pg.end();

for (const [t, from, to] of report) console.log(`${t.padEnd(30)} mysql ${String(from).padStart(4)}  →  postgres ${String(to).padStart(4)}${from !== to ? '  (dropped ' + (from - to) + ')' : ''}`);
```

- [ ] **Step 6: Run the copy (live Supabase; MySQL must be running)**

Run: `npm run db:migrate-data`
Expected: 35 lines; drops only on `alerts` (test leftovers), `shelters` (the "Testing" shelter), `disasters` (2 test rows), `user_reports` (blank report), and any table whose rows contain "test"; all others equal. Run it again → error `Target already has data in: …. Refusing to import twice.`

- [ ] **Step 7: Apply the triggers** — `npm run db:apply` → `skip 0001_init.sql`, `applied 0002_triggers.sql`.

- [ ] **Step 8: Commit** — `git add web/scripts/db && git commit -m "web: add tested MySQL→Postgres data copy; apply triggers after import"`

---

### Task 6: Volunteer accounts in Supabase Auth

**Files:**
- Create: `web/scripts/db/volunteers.js`, `web/scripts/db/volunteers.test.js`, `web/scripts/db/create-volunteer-users.js`

**Interfaces:**
- Produces: `volunteerEmail(username: string): string`, `randomPassword(): string`

- [ ] **Step 1: Failing test** `volunteers.test.js`

```js
import { describe, expect, it } from 'vitest';
import { randomPassword, volunteerEmail } from './volunteers.js';

describe('volunteerEmail', () => {
	it('uses a reserved example domain so no real person gets mail', () => {
		expect(volunteerEmail('Kulap.B')).toBe('kulap.b@volunteers.example.com');
		expect(volunteerEmail('nok ka!')).toBe('nokka@volunteers.example.com');
	});
});

describe('randomPassword', () => {
	it('is 16 url-safe characters and different each time', () => {
		const a = randomPassword();
		expect(a).toMatch(/^[A-Za-z0-9_-]{16}$/);
		expect(randomPassword()).not.toBe(a);
	});
});
```

- [ ] **Step 2: Run** — `npx vitest run scripts/db/volunteers.test.js` → FAIL.

- [ ] **Step 3: `volunteers.js`**

```js
import { randomBytes } from 'node:crypto';

export const volunteerEmail = (username) =>
	`${username.toLowerCase().replace(/[^a-z0-9._-]/g, '')}@volunteers.example.com`;

export const randomPassword = () => randomBytes(12).toString('base64url');
```

- [ ] **Step 4: Run** — PASS.

- [ ] **Step 5: `create-volunteer-users.js`**

```js
// Creates a Supabase Auth user (role: volunteer) for each volunteer account without one.
// Passwords are written to web/volunteer-logins.local.txt (gitignored), never printed.
import { appendFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';
import { loadEnvs, need } from './env.js';
import { randomPassword, volunteerEmail } from './volunteers.js';

const { web } = loadEnvs();
need(web, 'DATABASE_URL', 'PUBLIC_SUPABASE_URL', 'SUPABASE_SECRET_KEY');
const sql = postgres(web.DATABASE_URL, { prepare: false, max: 1 });
const admin = createClient(web.PUBLIC_SUPABASE_URL, web.SUPABASE_SECRET_KEY, {
	auth: { persistSession: false, autoRefreshToken: false }
});
const out = new URL('../../volunteer-logins.local.txt', import.meta.url);

const todo = await sql`select account_id, username from public.volunteer_accounts where user_id is null order by account_id`;
let created = 0;
for (const a of todo) {
	const password = randomPassword();
	const { data, error } = await admin.auth.admin.createUser({
		email: volunteerEmail(a.username),
		password,
		email_confirm: true,
		app_metadata: { role: 'volunteer' }
	});
	if (error) {
		console.log(`account ${a.account_id}: ${error.message}`);
		continue;
	}
	await sql`update public.volunteer_accounts set user_id = ${data.user.id} where account_id = ${a.account_id}`;
	await appendFile(out, `${a.username}\t${password}\n`);
	created++;
}
console.log(`volunteer users created: ${created} of ${todo.length}`);
await sql.end();
```

- [ ] **Step 6: Run (live)** — `npm run db:volunteers` → `volunteer users created: N of N` (N = migrated accounts, ≤ 10). Re-run → `created: 0 of 0`. Confirm `git status` does **not** list `volunteer-logins.local.txt`.

- [ ] **Step 7: Commit** — `git add web/scripts/db/volunteers.js web/scripts/db/volunteers.test.js web/scripts/db/create-volunteer-users.js && git commit -m "web: move volunteer logins to Supabase Auth"`

---

### Task 7: Server auth (hooks, Locals, requireRole)

**Files:**
- Modify: `web/src/hooks.server.ts`, `web/src/app.d.ts`
- Create: `web/src/lib/server/auth.ts`, `web/src/lib/server/auth.test.ts`

**Interfaces:**
- Produces: `App.Locals = { supabase: SupabaseClient | null; user: { id: string; email: string | null; role: 'admin' | 'volunteer' | null } | null }`; `requireRole(locals, role): NonNullable<App.Locals['user']>` (throws SvelteKit `error(401|403)`).

- [ ] **Step 1: Failing test** `auth.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { requireRole } from './auth';

const locals = (user: App.Locals['user']) => ({ supabase: null, user }) as App.Locals;
const status = (fn: () => unknown) => {
	try {
		fn();
		return 200;
	} catch (e) {
		return (e as { status: number }).status;
	}
};

describe('requireRole', () => {
	it('401 when signed out', () => {
		expect(status(() => requireRole(locals(null), 'admin'))).toBe(401);
	});
	it('403 for the wrong role (a volunteer asking for admin data)', () => {
		expect(status(() => requireRole(locals({ id: 'u', email: null, role: 'volunteer' }), 'admin'))).toBe(403);
	});
	it('403 when the role claim is missing', () => {
		expect(status(() => requireRole(locals({ id: 'u', email: null, role: null }), 'admin'))).toBe(403);
	});
	it('returns the user for the right role', () => {
		const u = { id: 'u', email: 'a@b.c', role: 'admin' as const };
		expect(requireRole(locals(u), 'admin')).toEqual(u);
	});
});
```

- [ ] **Step 2: Run** — `npx vitest run src/lib/server/auth.test.ts` → FAIL.

- [ ] **Step 3: `app.d.ts`** (replace)

```ts
import type { SupabaseClient } from '@supabase/supabase-js';

declare global {
	namespace App {
		interface Locals {
			supabase: SupabaseClient | null;
			user: { id: string; email: string | null; role: 'admin' | 'volunteer' | null } | null;
		}
	}
}
export {};
```

- [ ] **Step 4: `auth.ts`**

```ts
import { error } from '@sveltejs/kit';

export function requireRole(locals: App.Locals, role: 'admin' | 'volunteer') {
	if (!locals.user) error(401, 'Sign in required');
	if (locals.user.role !== role) error(403, 'Not allowed');
	return locals.user;
}
```

- [ ] **Step 5: `hooks.server.ts`** (replace)

```ts
import { createServerClient } from '@supabase/ssr';
import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { env } from '$env/dynamic/public';
import { paraglideMiddleware } from '$lib/paraglide/server.js';

const i18n: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) =>
		resolve({ ...event, request }, { transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale) })
	);

const auth: Handle = async ({ event, resolve }) => {
	event.locals.supabase = null;
	event.locals.user = null;
	if (env.PUBLIC_SUPABASE_URL && env.PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
		const supabase = createServerClient(env.PUBLIC_SUPABASE_URL, env.PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
			cookies: {
				getAll: () => event.cookies.getAll(),
				setAll: (cookies) =>
					cookies.forEach(({ name, value, options }) => event.cookies.set(name, value, { ...options, path: '/' }))
			}
		});
		event.locals.supabase = supabase;
		// getClaims() verifies the JWT; never trust getSession() for authorization.
		const { data } = await supabase.auth.getClaims();
		const c = data?.claims;
		if (c?.sub) {
			const role = (c.app_metadata as { role?: string } | undefined)?.role;
			event.locals.user = {
				id: c.sub,
				email: c.email ?? null,
				role: role === 'admin' || role === 'volunteer' ? role : null
			};
		}
	}
	return resolve(event, {
		filterSerializedResponseHeaders: (name) => name === 'content-range' || name === 'x-supabase-api-version'
	});
};

export const handle = sequence(i18n, auth);
```

Note: the paraglide handle must stay first (it rewrites the request); the original `{ ...event, request }` spread is preserved.

- [ ] **Step 6: Verify** — `npx vitest run src/lib/server/auth.test.ts` → PASS; `npm run check && npm test` → 0 errors, all pass; `npx playwright test tests/e2e/home.spec.ts` → all pass (hooks don't break pages).

- [ ] **Step 7: Commit** — `git add web/src/hooks.server.ts web/src/app.d.ts web/src/lib/server/auth.ts web/src/lib/server/auth.test.ts && git commit -m "web: add Supabase cookie sessions and role guard"`

---

### Task 8: Read API routes

**Files:**
- Create: `web/src/lib/server/rows.ts`, `web/src/lib/server/rows.test.ts`, `web/src/lib/server/queries.ts`, `web/src/routes/api/shelters/+server.ts`, `web/src/routes/api/disasters/+server.ts`, `web/src/routes/api/alerts/+server.ts`, `web/src/routes/api/evacuation/routes/+server.ts`

**Interfaces:**
- Consumes: `COLUMN_NAMES` (Task 3), `sql()` (Task 1)
- Produces: `pascalize(row: Record<string, unknown>): Record<string, unknown>`; `listShelters(sql)`, `listDisasters(sql)`, `listAlerts(sql)`, `listReports(sql)`, `insertReport(sql, input)` in `queries.ts`

- [ ] **Step 1: Failing test** `rows.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import shelters from '$lib/sample/shelters.json';
import { COLUMN_NAMES } from './column-names';
import { pascalize } from './rows';

describe('pascalize', () => {
	it('maps snake_case columns back to the API names and leaves aliased keys alone', () => {
		expect(pascalize({ shelter_id: 8, shelter_name: 'A', AvailableSpace: 3 })).toEqual({ ShelterID: 8, ShelterName: 'A', AvailableSpace: 3 });
	});
	it('can rebuild every key the citizen UI receives for shelters', () => {
		const pascal = new Set(Object.values(COLUMN_NAMES));
		const computed = ['AvailableSpace', 'OccupancyPercent', 'ActiveDisasterCount'];
		for (const key of Object.keys(shelters[0])) {
			expect(pascal.has(key) || computed.includes(key), key).toBe(true);
		}
	});
});
```

- [ ] **Step 2: Run** — `npx vitest run src/lib/server/rows.test.ts` → FAIL.

- [ ] **Step 3: `rows.ts`**

```ts
import { COLUMN_NAMES } from './column-names';

export function pascalize(row: Record<string, unknown>): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	for (const [k, v] of Object.entries(row)) out[COLUMN_NAMES[k] ?? k] = v;
	return out;
}
```

- [ ] **Step 4: Run** — PASS.

- [ ] **Step 5: `queries.ts`** (same rows and order as the Express controllers)

```ts
import type postgres from 'postgres';
import type { ReportInput } from '$lib/types';
import { pascalize } from './rows';

type Sql = postgres.Sql;
const rows = (r: readonly Record<string, unknown>[]) => r.map(pascalize);

export async function listShelters(sql: Sql) {
	return rows(await sql`
		select s.*,
		  (s.capacity - s.current_occupancy) as "AvailableSpace",
		  round((s.current_occupancy::numeric / nullif(s.capacity, 0)) * 100, 2)::text as "OccupancyPercent",
		  count(distinct ds.disaster_id)::int as "ActiveDisasterCount"
		from public.shelters s
		left join public.disaster_shelters ds on s.shelter_id = ds.shelter_id and ds.deactivated_at is null
		group by s.shelter_id
		order by s.shelter_name`);
}

export async function listDisasters(sql: Sql) {
	return rows(await sql`select * from public.disasters order by start_date desc`);
}

export async function listAlerts(sql: Sql) {
	return rows(await sql`
		select a.*, d.disaster_name as "DisasterName", d.disaster_type as "DisasterType", d.severity as "DisasterSeverity"
		from public.alerts a left join public.disasters d on a.disaster_id = d.disaster_id
		order by a.issued_at desc`);
}

export async function listReports(sql: Sql) {
	return rows(await sql`select * from public.user_reports order by reported_at desc`);
}

export async function insertReport(sql: Sql, r: ReportInput) {
	const [row] = await sql`
		insert into public.user_reports
		  (user_name, user_email, user_phone, reported_location, disaster_type, severity, description, latitude, longitude)
		values (${r.UserName}, ${r.UserEmail}, ${r.UserPhone}, ${r.ReportedLocation}, ${r.DisasterType}, ${r.Severity},
		        ${r.Description}, ${r.Latitude}, ${r.Longitude})
		returning report_id`;
	return row.report_id as number;
}
```

- [ ] **Step 6: Routes**

`web/src/routes/api/shelters/+server.ts`:
```ts
import { json } from '@sveltejs/kit';
import { sql } from '$lib/server/db';
import { listShelters } from '$lib/server/queries';

export const GET = async () => json(await listShelters(sql()));
```
`web/src/routes/api/disasters/+server.ts`:
```ts
import { json } from '@sveltejs/kit';
import { sql } from '$lib/server/db';
import { listDisasters } from '$lib/server/queries';

export const GET = async () => json(await listDisasters(sql()));
```
`web/src/routes/api/alerts/+server.ts`:
```ts
import { json } from '@sveltejs/kit';
import { sql } from '$lib/server/db';
import { listAlerts } from '$lib/server/queries';

export const GET = async () => json(await listAlerts(sql()));
```
`web/src/routes/api/evacuation/routes/+server.ts`:
```ts
import { json } from '@sveltejs/kit';
import routes from '$lib/sample/evacuation-routes.json';

// There is no routes table: the old Express endpoint returned this same hard-coded list.
// The UI labels it SAMPLE.
export const GET = () => json(routes);
```

- [ ] **Step 7: Verify against live Supabase**

Run: `npm run build && npm run preview` (second terminal), then:
```bash
for r in shelters disasters alerts evacuation/routes; do printf "%-18s " $r; curl -s localhost:3001/api/$r | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);console.log(Array.isArray(j)?j.length+" rows, keys: "+Object.keys(j[0]).slice(0,4).join(","):"ERROR "+s.slice(0,80))})'; done
```
Expected: `shelters 10 rows, keys: ShelterID,ShelterName,…`, `disasters 13 rows …`, `alerts 15 rows …` (or the migrated counts from Task 5), `evacuation/routes 4 rows …`. Stop the preview.

- [ ] **Step 8: Commit** — `git add web/src/lib/server web/src/routes/api && git commit -m "web: serve shelters, disasters, alerts, routes from Supabase"`

---

### Task 9: Report endpoint with validation and rate limit

**Files:**
- Create: `web/src/lib/server/report-input.ts` (+ `.test.ts`), `web/src/lib/server/rate-limit.ts` (+ `.test.ts`), `web/src/routes/api/reports/+server.ts`

**Interfaces:**
- Produces: `parseReport(body: unknown): { ok: true; value: ReportInput } | { ok: false; error: string }`; `RATE = { max: 5, windowMinutes: 10 }`, `ipHash(ip: string, salt: string): string`, `allowed(recentCount: number): boolean`

- [ ] **Step 1: Failing tests**

`report-input.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { parseReport } from './report-input';

const good = {
	DisasterType: 'Flood', Severity: 'Severe', Description: 'Water rising fast',
	ReportedLocation: 'Mae Rim', Latitude: 18.9, Longitude: 98.9, UserName: null, UserEmail: null, UserPhone: null
};

describe('parseReport', () => {
	it('accepts a valid report', () => {
		expect(parseReport(good)).toEqual({ ok: true, value: good });
	});
	it('rejects unknown enums, empty text and impossible coordinates', () => {
		expect(parseReport({ ...good, DisasterType: 'Meteor' }).ok).toBe(false);
		expect(parseReport({ ...good, Severity: 'Huge' }).ok).toBe(false);
		expect(parseReport({ ...good, Description: '   ' }).ok).toBe(false);
		expect(parseReport({ ...good, Latitude: 120 }).ok).toBe(false);
		expect(parseReport({ ...good, Longitude: 'east' }).ok).toBe(false);
		expect(parseReport(null).ok).toBe(false);
	});
	it('enforces database column limits', () => {
		expect(parseReport({ ...good, UserPhone: '0'.repeat(21) }).ok).toBe(false);
		expect(parseReport({ ...good, ReportedLocation: 'p'.repeat(256) }).ok).toBe(false);
		expect(parseReport({ ...good, Description: 'd'.repeat(2001) }).ok).toBe(false);
	});
});
```

`rate-limit.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { allowed, ipHash, RATE } from './rate-limit';

describe('rate limit', () => {
	it('allows up to 5 reports per window', () => {
		expect(RATE).toEqual({ max: 5, windowMinutes: 10 });
		expect(allowed(4)).toBe(true);
		expect(allowed(5)).toBe(false);
	});
	it('hashes IPs with a salt and never returns the raw IP', () => {
		const h = ipHash('203.0.113.7', 'salt');
		expect(h).toMatch(/^[a-f0-9]{64}$/);
		expect(h).not.toContain('203');
		expect(ipHash('203.0.113.7', 'other')).not.toBe(h);
	});
});
```

- [ ] **Step 2: Run** — `npx vitest run src/lib/server` → FAIL on both new files.

- [ ] **Step 3: Implement**

`report-input.ts`:
```ts
import { REPORT_SEVERITIES, REPORT_TYPES, type ReportInput } from '$lib/types';

type Result = { ok: true; value: ReportInput } | { ok: false; error: string };

const optText = (v: unknown, max: number) => v === null || v === undefined || (typeof v === 'string' && v.length <= max);
const optCoord = (v: unknown, limit: number) => v === null || v === undefined || (typeof v === 'number' && Math.abs(v) <= limit);

export function parseReport(body: unknown): Result {
	if (!body || typeof body !== 'object') return { ok: false, error: 'Invalid body' };
	const b = body as Record<string, unknown>;
	if (!REPORT_TYPES.includes(b.DisasterType as never)) return { ok: false, error: 'DisasterType' };
	if (!REPORT_SEVERITIES.includes(b.Severity as never)) return { ok: false, error: 'Severity' };
	if (typeof b.Description !== 'string' || !b.Description.trim() || b.Description.length > 2000) return { ok: false, error: 'Description' };
	if (typeof b.ReportedLocation !== 'string' || b.ReportedLocation.length > 255) return { ok: false, error: 'ReportedLocation' };
	if (!optCoord(b.Latitude, 90) || !optCoord(b.Longitude, 180)) return { ok: false, error: 'Coordinates' };
	if (!optText(b.UserName, 100) || !optText(b.UserEmail, 100) || !optText(b.UserPhone, 20)) return { ok: false, error: 'Contact' };
	return {
		ok: true,
		value: {
			DisasterType: b.DisasterType as ReportInput['DisasterType'],
			Severity: b.Severity as ReportInput['Severity'],
			Description: b.Description,
			ReportedLocation: b.ReportedLocation,
			Latitude: (b.Latitude as number | null) ?? null,
			Longitude: (b.Longitude as number | null) ?? null,
			UserName: (b.UserName as string | null) ?? null,
			UserEmail: (b.UserEmail as string | null) ?? null,
			UserPhone: (b.UserPhone as string | null) ?? null
		}
	};
}
```

`rate-limit.ts`:
```ts
import { createHash } from 'node:crypto';

export const RATE = { max: 5, windowMinutes: 10 };
export const allowed = (recentCount: number) => recentCount < RATE.max;
export const ipHash = (ip: string, salt: string) => createHash('sha256').update(`${salt}:${ip}`).digest('hex');
```

`routes/api/reports/+server.ts`:
```ts
import { error, json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { requireRole } from '$lib/server/auth';
import { sql } from '$lib/server/db';
import { insertReport, listReports } from '$lib/server/queries';
import { allowed, ipHash, RATE } from '$lib/server/rate-limit';
import { parseReport } from '$lib/server/report-input';

export const POST = async ({ request, getClientAddress }) => {
	const parsed = parseReport(await request.json().catch(() => null));
	if (!parsed.ok) error(400, parsed.error);
	const db = sql();
	const hash = ipHash(getClientAddress(), env.SUPABASE_SECRET_KEY ?? 'dev');
	const id = await db.begin(async (tx) => {
		await tx`delete from public.report_rate_limits where created_at < now() - interval '1 day'`;
		const [{ n }] = await tx`select count(*)::int n from public.report_rate_limits
		  where ip_hash = ${hash} and created_at > now() - make_interval(mins => ${RATE.windowMinutes})`;
		if (!allowed(n)) return null;
		await tx`insert into public.report_rate_limits (ip_hash) values (${hash})`;
		return insertReport(tx as never, parsed.value);
	});
	if (id === null) error(429, 'Too many reports');
	return json({ reportId: id }, { status: 201 });
};

export const GET = async ({ locals }) => {
	requireRole(locals, 'admin');
	return json(await listReports(sql()));
};
```

- [ ] **Step 4: Run** — `npx vitest run src/lib/server` → PASS; `npm run check` → 0 errors.

- [ ] **Step 5: Live check** — `npm run build && npm run preview`, then:
```bash
curl -s -o /dev/null -w "GET (signed out): %{http_code}\n" localhost:3001/api/reports
curl -s -o /dev/null -w "POST bad body: %{http_code}\n" -X POST -H "content-type: application/json" -d '{}' localhost:3001/api/reports
```
Expected: `GET (signed out): 401`, `POST bad body: 400`. Do **not** post a valid report here (it would create a real row). Stop the preview.

- [ ] **Step 6: Commit** — `git add web/src/lib/server web/src/routes/api/reports && git commit -m "web: add validated, rate-limited report endpoint and admin report list"`

---

### Task 10: Switch the citizen UI to same-origin /api

**Files:**
- Modify: `web/src/lib/config.ts`, `web/src/lib/api.ts`, `web/src/lib/api.test.ts`, `web/src/routes/report/+page.svelte`, `web/messages/en.json`, `web/messages/th.json`, `web/tests/e2e/fixtures.ts`, `web/tests/e2e/report.spec.ts`

**Interfaces:**
- Changes: `PostResult` reason union becomes `'offline' | 'rejected' | 'limited'`; `submitReport` posts to `/reports`.

- [ ] **Step 1: Update unit tests first** (`api.test.ts`)

Change `expect(url).toBe('http://x/api/reports/create');` to `expect(url).toBe('http://x/api/reports');` and add to the `submitReport` describe:
```ts
	it('reports a rate limit separately', async () => {
		const limited = createApi('http://x/api', () => {}, async () => json({ error: 'Too many reports' }, 429));
		expect(await limited.submitReport(report)).toEqual({ ok: false, reason: 'limited' });
	});
```

- [ ] **Step 2: Run** — `npx vitest run src/lib/api.test.ts` → FAIL (path and 429).

- [ ] **Step 3: Implement**

`api.ts`: in `PostResult` use `reason: 'offline' | 'rejected' | 'limited'`; in `post()` replace the return line with
```ts
			if (res.ok) return { ok: true };
			return { ok: false, reason: res.status === 429 ? 'limited' : 'rejected' };
```
and change the comment + path to
```ts
		submitReport: (r: ReportInput) => post('/reports', r)
```

`config.ts` (replace):
```ts
import { createApi } from './api';
import { markOffline } from './status.svelte';

// The API lives in this app (src/routes/api), so calls are same-origin.
export const api = createApi('/api', markOffline);
```

`messages/en.json`: add `"report_error_limited": "Too many reports from this connection. Please wait a few minutes and try again.",`
`messages/th.json`: add `"report_error_limited": "มีการแจ้งเหตุจากการเชื่อมต่อนี้มากเกินไป โปรดรอสักครู่แล้วลองอีกครั้ง",`

`routes/report/+page.svelte`: change `let failure = $state<'offline' | 'rejected' | null>(null);` to include `'limited'`, and the message line to
```svelte
						{failure === 'offline'
							? m.report_error_offline()
							: failure === 'limited'
								? m.report_error_limited()
								: m.report_error_rejected()}
```

- [ ] **Step 4: Run** — `npx vitest run src/lib/api.test.ts` → PASS.

- [ ] **Step 5: E2E mocks move to same-origin** — in `tests/e2e/fixtures.ts` replace the `http://localhost:5000/api/**` route with:
```ts
			await page.route(
				(url) => url.pathname.startsWith('/api/'),
				async (r) => {
					if (backend === 'down') return r.abort('connectionrefused');
					if (r.request().method() === 'POST') {
						return r.fulfill({ ...json, status: 201, body: '{"reportId":99}' });
					}
					const file = API[new URL(r.request().url()).pathname.replace(/^\/api/, '')];
					return file ? r.fulfill({ ...json, body: sample(file) }) : r.fulfill({ status: 404, body: '' });
				}
			);
```
In `report.spec.ts` change `endsWith('/api/reports/create')` to `endsWith('/api/reports')` and add:
```ts
test('too many reports shows a wait message and keeps the form', async ({ page }) => {
	await page.route(
		(url) => url.pathname === '/api/reports',
		(r) => r.fulfill({ status: 429, contentType: 'application/json', body: '{"message":"Too many reports"}' })
	);
	await fill(page);
	await page.getByRole('button', { name: 'Send report' }).click();
	await expect(page.getByText(/Too many reports from this connection/)).toBeVisible();
	await expect(page.getByRole('button', { name: 'Send report' })).toBeEnabled();
});
```

- [ ] **Step 6: Run** — `npx playwright test` → all pass (29). `npm test` → all pass.

- [ ] **Step 7: Remove `PUBLIC_API_URL` leftovers** — `grep -rn "PUBLIC_API_URL\|localhost:5000" web/src web/tests web/scripts` → only `scripts/export-sample.js` (keeps reading the old Express API for re-exporting samples; leave it).

- [ ] **Step 8: Commit** — `git add web/src web/messages web/tests && git commit -m "web: call same-origin /api; show a wait message on rate limit"`

---

### Task 11: Login pages and guarded areas

**Files:**
- Create: `web/src/routes/admin/+layout.ts`, `web/src/routes/admin/login/+page.server.ts`, `web/src/routes/admin/login/+page.svelte`, `web/src/routes/admin/(protected)/+layout.server.ts`, `web/src/routes/admin/(protected)/+page.svelte`, the same four for `volunteer/`, `web/src/routes/auth/logout/+page.server.ts`, `web/src/lib/components/LoginForm.svelte`, `web/tests/e2e/auth.spec.ts`
- Modify: `web/messages/en.json`, `web/messages/th.json`, `web/messages/TH_REVIEW.md` (add the new keys to the review list)

**Interfaces:**
- Consumes: `locals.supabase`, `locals.user`, `sql()`
- Produces: `LoginForm` props `{ title: string; idLabel: string; idName: 'email' | 'username'; idType: 'email' | 'text'; error?: string | null }`

- [ ] **Step 1: Messages** — add to `en.json`:
```json
"login_admin_title": "Admin sign in",
"login_volunteer_title": "Volunteer sign in",
"login_email": "Email",
"login_username": "Username",
"login_password": "Password",
"login_submit": "Sign in",
"login_failed": "Email/username or password is incorrect.",
"login_wrong_role": "This account can't sign in here.",
"login_required": "Please fill in both fields.",
"signed_in_as": "Signed in as {who}",
"sign_out": "Sign out",
"admin_coming": "The admin console arrives in Phase 2.",
"volunteer_coming": "Volunteer tools arrive in Phase 3."
```
and to `th.json`:
```json
"login_admin_title": "เข้าสู่ระบบผู้ดูแล",
"login_volunteer_title": "เข้าสู่ระบบอาสาสมัคร",
"login_email": "อีเมล",
"login_username": "ชื่อผู้ใช้",
"login_password": "รหัสผ่าน",
"login_submit": "เข้าสู่ระบบ",
"login_failed": "อีเมล/ชื่อผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง",
"login_wrong_role": "บัญชีนี้ไม่สามารถเข้าสู่ระบบที่นี่ได้",
"login_required": "โปรดกรอกทั้งสองช่อง",
"signed_in_as": "เข้าสู่ระบบในชื่อ {who}",
"sign_out": "ออกจากระบบ",
"admin_coming": "ระบบผู้ดูแลจะมาในระยะที่ 2",
"volunteer_coming": "เครื่องมือสำหรับอาสาสมัครจะมาในระยะที่ 3"
```

- [ ] **Step 2: Failing e2e** `tests/e2e/auth.spec.ts`

```ts
import { expect, test } from './fixtures';

test('admin area redirects signed-out visitors to the admin login', async ({ page }) => {
	await page.goto('/admin');
	await expect(page).toHaveURL(/\/admin\/login$/);
	await expect(page.getByRole('heading', { name: 'Admin sign in' })).toBeVisible();
});

test('volunteer area redirects signed-out visitors to the volunteer login', async ({ page }) => {
	await page.goto('/volunteer');
	await expect(page).toHaveURL(/\/volunteer\/login$/);
	await expect(page.getByLabel('Username')).toBeVisible();
});

test('empty sign-in is rejected before contacting Supabase', async ({ page }) => {
	await page.goto('/admin/login');
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page.getByText('Please fill in both fields.')).toBeVisible();
});

test('admin report list is closed to the public', async ({ request }) => {
	expect((await request.get('/api/reports')).status()).toBe(401);
});
```

- [ ] **Step 3: Run** — `npx playwright test tests/e2e/auth.spec.ts` → FAIL (routes missing).

- [ ] **Step 4: Implement**

`routes/admin/+layout.ts` and `routes/volunteer/+layout.ts`:
```ts
// Auth decisions happen on the server before anything is sent.
export const ssr = true;
```

`routes/admin/(protected)/+layout.server.ts`:
```ts
import { redirect } from '@sveltejs/kit';
import { localizeHref } from '$lib/paraglide/runtime.js';

export const load = ({ locals }) => {
	if (locals.user?.role !== 'admin') redirect(303, localizeHref('/admin/login'));
	return { email: locals.user.email };
};
```
`routes/volunteer/(protected)/+layout.server.ts`: same with `'volunteer'` and `'/volunteer/login'`.

`lib/components/LoginForm.svelte`:
```svelte
<script lang="ts">
	import { enhance } from '$app/forms';
	import { m } from '$lib/paraglide/messages.js';

	let {
		title,
		idLabel,
		idName,
		idType,
		error = null
	}: { title: string; idLabel: string; idName: 'email' | 'username'; idType: 'email' | 'text'; error?: string | null } =
		$props();
	let busy = $state(false);
	const field = 'w-full rounded-md border border-ink bg-white px-3 py-2';
</script>

<div class="page max-w-md">
	<h1 class="text-2xl font-bold">{title}</h1>
	<form
		method="POST"
		class="mt-6 flex flex-col gap-4"
		use:enhance={() => {
			busy = true;
			return async ({ update }) => {
				await update();
				busy = false;
			};
		}}
	>
		<label class="flex flex-col gap-1">
			<span>{idLabel}</span>
			<input name={idName} type={idType} autocomplete={idName === 'email' ? 'email' : 'username'} class={field} />
		</label>
		<label class="flex flex-col gap-1">
			<span>{m.login_password()}</span>
			<input name="password" type="password" autocomplete="current-password" class={field} />
		</label>
		{#if error}<p role="alert" class="text-sm text-alarm">{error}</p>{/if}
		<button type="submit" disabled={busy} class="min-h-12 rounded-md bg-ink px-4 font-semibold text-paper disabled:opacity-60">
			{m.login_submit()}
		</button>
	</form>
</div>
```

`routes/admin/login/+page.server.ts`:
```ts
import { fail, redirect } from '@sveltejs/kit';
import { m } from '$lib/paraglide/messages.js';
import { localizeHref } from '$lib/paraglide/runtime.js';

export const actions = {
	default: async ({ request, locals }) => {
		const f = await request.formData();
		const email = String(f.get('email') ?? '').trim();
		const password = String(f.get('password') ?? '');
		if (!email || !password) return fail(400, { error: m.login_required() });
		if (!locals.supabase) return fail(503, { error: m.login_failed() });
		const { data, error } = await locals.supabase.auth.signInWithPassword({ email, password });
		if (error || !data.user) return fail(400, { error: m.login_failed() });
		if ((data.user.app_metadata as { role?: string }).role !== 'admin') {
			await locals.supabase.auth.signOut();
			return fail(403, { error: m.login_wrong_role() });
		}
		redirect(303, localizeHref('/admin'));
	}
};
```

`routes/admin/login/+page.svelte`:
```svelte
<script lang="ts">
	import LoginForm from '$lib/components/LoginForm.svelte';
	import { m } from '$lib/paraglide/messages.js';

	let { form } = $props();
</script>

<LoginForm title={m.login_admin_title()} idLabel={m.login_email()} idName="email" idType="email" error={form?.error} />
```

`routes/volunteer/login/+page.server.ts`:
```ts
import { fail, redirect } from '@sveltejs/kit';
import { m } from '$lib/paraglide/messages.js';
import { localizeHref } from '$lib/paraglide/runtime.js';
import { sql } from '$lib/server/db';

export const actions = {
	default: async ({ request, locals }) => {
		const f = await request.formData();
		const username = String(f.get('username') ?? '').trim();
		const password = String(f.get('password') ?? '');
		if (!username || !password) return fail(400, { error: m.login_required() });
		if (!locals.supabase) return fail(503, { error: m.login_failed() });
		const [row] = await sql()`
			select u.email from public.volunteer_accounts va join auth.users u on u.id = va.user_id
			where va.username = ${username} and va.is_active`;
		if (!row) return fail(400, { error: m.login_failed() });
		const { data, error } = await locals.supabase.auth.signInWithPassword({ email: row.email, password });
		if (error || (data.user?.app_metadata as { role?: string })?.role !== 'volunteer') {
			if (!error) await locals.supabase.auth.signOut();
			return fail(400, { error: m.login_failed() });
		}
		redirect(303, localizeHref('/volunteer'));
	}
};
```

`routes/volunteer/login/+page.svelte`:
```svelte
<script lang="ts">
	import LoginForm from '$lib/components/LoginForm.svelte';
	import { m } from '$lib/paraglide/messages.js';

	let { form } = $props();
</script>

<LoginForm title={m.login_volunteer_title()} idLabel={m.login_username()} idName="username" idType="text" error={form?.error} />
```

`routes/admin/(protected)/+page.svelte`:
```svelte
<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';

	let { data } = $props();
</script>

<div class="page">
	<h1 class="text-2xl font-bold">{m.login_admin_title()}</h1>
	<p class="mt-3">{m.signed_in_as({ who: data.email ?? '' })}</p>
	<p class="mt-2 text-muted">{m.admin_coming()}</p>
	<form method="POST" action="/auth/logout" class="mt-6">
		<button class="min-h-11 rounded-md border border-ink px-4 font-semibold">{m.sign_out()}</button>
	</form>
</div>
```
`routes/volunteer/(protected)/+page.svelte`: same with `m.login_volunteer_title()` and `m.volunteer_coming()`.

`routes/auth/logout/+page.server.ts`:
```ts
import { redirect } from '@sveltejs/kit';
import { localizeHref } from '$lib/paraglide/runtime.js';

export const actions = {
	default: async ({ locals }) => {
		await locals.supabase?.auth.signOut();
		redirect(303, localizeHref('/'));
	}
};
```

Add every new key to `messages/TH_REVIEW.md` under a "Login (Supabase backend)" heading.

- [ ] **Step 5: Run** — `npm run check` → 0 errors; `npx playwright test` → all pass (33).

- [ ] **Step 6: Commit** — `git add web/src web/messages web/tests && git commit -m "web: add admin and volunteer sign-in with server-side guards"`

---

### Task 12: Admin creation script and live smoke checks

**Files:**
- Create: `web/scripts/db/create-admin.js`, `web/scripts/db/smoke-supabase.js`

- [ ] **Step 1: `create-admin.js`**

```js
// Usage: npm run db:create-admin -- you@example.com        (create; asks for a password)
//        npm run db:create-admin -- --promote you@example.com (give an existing user the admin role)
import readline from 'node:readline';
import { createClient } from '@supabase/supabase-js';
import { loadEnvs, need } from './env.js';

const { web } = loadEnvs();
need(web, 'PUBLIC_SUPABASE_URL', 'SUPABASE_SECRET_KEY');
const admin = createClient(web.PUBLIC_SUPABASE_URL, web.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const args = process.argv.slice(2);
const promote = args[0] === '--promote';
const email = promote ? args[1] : args[0];
if (!email) throw new Error('Give an email address.');

function askHidden(question) {
	return new Promise((resolve) => {
		const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
		process.stdout.write(question);
		rl._writeToOutput = () => {}; // don't echo what is typed
		rl.question('', (answer) => {
			rl.close();
			process.stdout.write('\n');
			resolve(answer);
		});
	});
}

if (promote) {
	let found = null;
	for (let page = 1; !found; page++) {
		const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
		if (error) throw error;
		found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
		if (data.users.length < 200) break;
	}
	if (!found) throw new Error('No user with that email.');
	const { error } = await admin.auth.admin.updateUserById(found.id, { app_metadata: { ...found.app_metadata, role: 'admin' } });
	if (error) throw error;
	console.log('promoted to admin');
} else {
	const password = await askHidden('New admin password (min 12 characters): ');
	if (password.length < 12) throw new Error('Password too short.');
	const { error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, app_metadata: { role: 'admin' } });
	if (error) throw error;
	console.log('admin created');
}
```

- [ ] **Step 2: `smoke-supabase.js`**

```js
// Live checks against Supabase. Prints pass/fail lines only.
import { readFile } from 'node:fs/promises';
import postgres from 'postgres';
import { pgTable } from '../schema/names.js';
import { loadEnvs, need } from './env.js';

const { web } = loadEnvs();
need(web, 'DATABASE_URL', 'PUBLIC_SUPABASE_URL', 'PUBLIC_SUPABASE_PUBLISHABLE_KEY');
const sql = postgres(web.DATABASE_URL, { prepare: false, max: 1, onnotice: () => {} });
const model = JSON.parse(await readFile(new URL('../../supabase/mysql-model.json', import.meta.url), 'utf8'));
let failures = 0;
const check = (ok, label) => {
	console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
	if (!ok) failures++;
};

// 1. Every table exists and has rows where MySQL had rows.
for (const t of model.tables) {
	const [{ n }] = await sql`select count(*)::int n from ${sql('public.' + pgTable(t.name))}`;
	console.log(`      ${pgTable(t.name).padEnd(30)} ${n} rows`);
}

// 2. Triggers fire (inside a transaction that is always rolled back).
class Rollback extends Error {}
try {
	await sql.begin(async (tx) => {
		const [s] = await tx`insert into public.shelters (shelter_name, shelter_type, address, city, capacity, current_occupancy, status)
		  values ('smoke', 'Evacuation Center', 'x', 'x', 10, 15, 'Available') returning status, current_occupancy`;
		check(s.status === 'Full' && s.current_occupancy === 10, 'shelter insert trigger caps occupancy and sets Full');
		const [r] = await tx`insert into public.relief_supplies (supply_name, category, unit, total_quantity, allocated_quantity, minimum_threshold)
		  values ('smoke', 'Food', 'boxes', 5, 5, 1) returning status`;
		check(r.status === 'Out of Stock', 'supply status trigger marks Out of Stock');
		const [inactive] = await tx`select agency_id from public.agencies where status <> 'Active' limit 1`;
		if (inactive) {
			let blocked = false;
			try {
				await tx.savepoint((sp) => sp`insert into public.agency_activations (agency_id, disaster_id, status) values (${inactive.agency_id}, (select min(disaster_id) from public.disasters), 'Requested')`);
			} catch {
				blocked = true;
			}
			check(blocked, 'activation of inactive agency is rejected');
		}
		throw new Rollback();
	});
} catch (e) {
	if (!(e instanceof Rollback)) check(false, `trigger checks crashed: ${e.message}`);
}

// 3. The publishable key cannot read tables through the Data API.
for (const t of ['shelters', 'user_reports', 'volunteer_accounts']) {
	const res = await fetch(`${web.PUBLIC_SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${t}?select=*&limit=1`, {
		headers: { apikey: web.PUBLIC_SUPABASE_PUBLISHABLE_KEY }
	});
	const body = res.ok ? await res.json() : [];
	check(!res.ok || body.length === 0, `Data API cannot read ${t} with the publishable key (HTTP ${res.status})`);
}

// 4. Sign-ups are disabled.
const settings = await (await fetch(`${web.PUBLIC_SUPABASE_URL.replace(/\/$/, '')}/auth/v1/settings`, { headers: { apikey: web.PUBLIC_SUPABASE_PUBLISHABLE_KEY } })).json();
check(settings.disable_signup === true, 'public sign-ups are disabled');

await sql.end();
process.exitCode = failures ? 1 : 0;
```

Before running, confirm the column names used in step 2 (`supply_name`, `category`, `unit`, `minimum_threshold`, `shelter_type`, `address`, `city`) exist in `0001_init.sql`, and that any `not null` columns without defaults on those tables are supplied. Adjust the inserts to match `0001` and ledger the ruling.

- [ ] **Step 3: Run smoke (live)** — `npm run db:smoke`
Expected: row counts printed; every check `PASS`. If "public sign-ups are disabled" fails, stop and ask the owner to turn off *Authentication → Sign In / Providers → Allow new users to sign up*.

- [ ] **Step 4: Owner creates their admin** — this step needs the owner at the keyboard (hidden password prompt). Ask them to run in `web/`: `npm run db:create-admin -- <their email>`. Expected: `admin created`.

- [ ] **Step 5: Commit** — `git add web/scripts/db/create-admin.js web/scripts/db/smoke-supabase.js && git commit -m "web: add admin creation script and live Supabase smoke checks"`

---

### Task 13: Docs, final verification

**Files:**
- Modify: `README.md` (repo root), `web/.env.example` (already done), `docs/INDEX.md`

- [ ] **Step 1: README** — replace the "What's real vs sample" table row
```markdown
| Shelters, disasters, alerts, evacuation routes, volunteers, supplies | Demo MySQL database (sample data, marked **SAMPLE** in the UI) |
| Admin login | Hard-coded demo credentials (`admin` / `admin123`); not real security |
```
with
```markdown
| Shelters, disasters, alerts, volunteers, supplies | Demo data in Supabase Postgres (marked **SAMPLE** in the UI) |
| Evacuation routes | Hard-coded sample list (marked **SAMPLE**) |
| Admin / volunteer login | Supabase Auth, invite-only; the old Next.js `frontend/` still has the legacy demo login |
```
and replace the line
```markdown
**New citizen UI (`web/`)**: import the repo in Vercel with Root Directory `web` and set `PUBLIC_API_URL` to your backend URL + `/api`.
```
with
```markdown
**New UI + API (`web/`)**: import the repo in Vercel with Root Directory `web` and set `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `DATABASE_URL` (see `web/.env.example`).
```

- [ ] **Step 2: `docs/INDEX.md`** — under "New citizen UI (`web/`)" add:
```markdown
- [Supabase backend spec](superpowers/specs/2026-10-10-supabase-backend-design.md)
- [Supabase backend plan](superpowers/plans/2026-10-10-supabase-backend.md)
```

- [ ] **Step 3: Full verification** (in `web/`):
```bash
npm run check
npm test
npx playwright test
npm run db:smoke
```
Expected: 0 errors; all unit tests pass; all e2e pass; every smoke line `PASS`.

- [ ] **Step 4: By eye** — `npm run dev`, open `http://localhost:3001` at 375px: no offline banner (data comes from Supabase), shelters listed; `/admin` redirects to login; signing in with the owner's admin account shows "Signed in as …"; Sign out returns home.

- [ ] **Step 5: Commit** — `git add README.md docs/INDEX.md && git commit -m "docs: describe the Supabase backend and Vercel env"`

---

## Spec coverage notes (decided while planning)

- **Triggers applied after the data copy** (spec §9 lists schema → data → smoke): firing business triggers during the copy would rewrite migrated rows (e.g. shelter statuses) and `validate_activation_request` would reject historical activations of now-inactive agencies.
- **Foreign keys are `deferrable initially immediate`** so the copy can insert tables in any order inside one transaction; behaviour for normal writes is unchanged.
- **Timestamps:** `mysql2` returns DATETIME/TIMESTAMP as instants in the machine's time zone, and those instants are kept (identical to what the old app displayed). `DATE` columns are read as strings so calendar dates don't shift (spec said "treated as UTC"; this keeps the displayed values identical instead).
- **`getClaims()`** is used instead of the spec's `getUser()`: it's the current `@supabase/ssr` recommendation and verifies the JWT without a network round trip.
- **Route tests:** SQL routes are verified live (Task 8/9 curl checks, Task 12 smoke) and through mocked e2e; their pure parts (`pascalize`, `parseReport`, rate limit, `requireRole`) are unit-tested. A fake SQL engine was judged not worth building.
- **`schema_migrations`** table (not in the spec) records applied files so `db:apply` is safe to re-run.
