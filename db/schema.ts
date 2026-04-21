export const schemaNotes = {
  tables: [
    "users",
    "taste_profiles",
    "platform_connections",
    "source_artifacts",
    "import_jobs",
    "destinations",
    "places",
    "trips",
    "trip_days",
    "trip_stops",
    "audit_events"
  ],
  posture:
    "Production persistence should use Postgres with row-level ownership rules and server-side auditing."
};
