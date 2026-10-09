export type Pt = { lat: number; lon: number };

/** Rows from the project's Express API. Numeric columns arrive as strings from MySQL DECIMAL. */
export type Shelter = {
	ShelterID: number;
	ShelterName: string;
	ShelterType: string;
	Address: string;
	City: string;
	Latitude: string | number | null;
	Longitude: string | number | null;
	Capacity: number;
	CurrentOccupancy: number;
	Status: 'Available' | 'Full' | 'Closed' | 'Under Maintenance';
	Facilities: string | null;
};

export type Disaster = {
	DisasterID: number;
	DisasterName: string;
	DisasterType: string;
	Severity: 'Minor' | 'Moderate' | 'Severe' | 'Catastrophic';
	Description: string | null;
	AffectedRegion: string;
	Latitude: string | number | null;
	Longitude: string | number | null;
	StartDate: string;
	Status: 'Active' | 'Contained' | 'Recovery' | 'Closed';
	EstimatedAffectedPopulation: number | null;
};

export type DbAlert = {
	AlertID: number;
	AlertType: string;
	Severity: 'Info' | 'Warning' | 'Critical' | 'Emergency';
	Title: string;
	Message: string;
	AffectedRegion: string;
	IssuedAt: string;
	ExpiresAt: string | null;
	Status: string;
};

export type EvacRoute = {
	RouteID: number;
	RouteName: string;
	StartPoint: string;
	EndPoint: string;
	Status: string;
	EstimatedTime: number;
	Distance: number;
	CurrentLoad: number;
};

/** Must match backend/db/create-user-reports.sql enums. */
export const REPORT_TYPES = ['Flood', 'Earthquake', 'Fire', 'Storm', 'Landslide', 'Tsunami', 'Drought', 'Other'] as const;
export type ReportType = (typeof REPORT_TYPES)[number];
export const REPORT_SEVERITIES = ['Minor', 'Moderate', 'Severe', 'Critical'] as const;
export type ReportSeverity = (typeof REPORT_SEVERITIES)[number];

/** Body of POST /api/reports (backend/controllers/userReportController.js createReport). */
export type ReportInput = {
	DisasterType: ReportType;
	Severity: ReportSeverity;
	Description: string;
	ReportedLocation: string;
	Latitude: number | null;
	Longitude: number | null;
	UserName: string | null;
	UserEmail: string | null;
	UserPhone: string | null;
};

export type Level = 'info' | 'watch' | 'warning' | 'danger';
export type HazardKind = 'flood' | 'cyclone' | 'earthquake' | 'drought' | 'wildfire' | 'volcano' | 'other';

/** A hazard from a public source (GDACS or USGS). */
export type HazardEvent = {
	id: string;
	source: 'GDACS' | 'USGS';
	kind: HazardKind;
	title: string;
	level: Level;
	lat: number;
	lon: number;
	time: string; // ISO 8601 UTC
	current: boolean;
	url: string;
};

export type Sourced<T> = { data: T; source: string; updatedAt: Date } | { error: true; source: string };

export type MapMarker = {
	id: string;
	kind: 'shelter' | 'quake' | 'hazard' | 'sample' | 'me';
	lat: number;
	lon: number;
	label: string;
};
