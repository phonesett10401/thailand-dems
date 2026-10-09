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
