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
