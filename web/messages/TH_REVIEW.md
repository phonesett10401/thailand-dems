# Thai copy — needs native review

Every value in `th.json` is a draft written by Claude, not checked by a native speaker.
Before relying on the Thai UI, ask a Thai speaker to read `th.json` next to `en.json` and fix:

- Tone: should feel like a calm public-service app (กรมป้องกันและบรรเทาสาธารณภัย style), not marketing.
- Emergency wording: `emergency_call_first`, `report_done_body`, `banner_none`, `river_note` matter most.
- Terms: `sample` ("ตัวอย่าง") is shown as a badge on sample data; check it reads as "not real data".
- Province names and database text (shelter names, alert titles) stay in English: they come from the demo database.

Login (Supabase backend) keys added later, also drafts: `login_admin_title`, `login_volunteer_title`, `login_email`, `login_username`, `login_password`, `login_submit`, `login_failed`, `login_wrong_role`, `login_required`, `signed_in_as`, `sign_out`, `admin_coming`, `volunteer_coming`.

When reviewed, delete this file in the same commit as the fixes.
