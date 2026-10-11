# Thai copy — needs native review

Every value in `th.json` is a draft written by Claude, not checked by a native speaker.
Before relying on the Thai UI, ask a Thai speaker to read `th.json` next to `en.json` and fix:

- Tone: should feel like a calm public-service app (กรมป้องกันและบรรเทาสาธารณภัย style), not marketing.
- Emergency wording: `emergency_call_first`, `report_done_body`, `banner_none`, `river_note` matter most.
- Terms: `sample` ("ตัวอย่าง") is shown as a badge on sample data; check it reads as "not real data".
- Province names and database text (shelter names, alert titles) stay in English: they come from the demo database.

Login (Supabase backend) keys added later, also drafts: `login_admin_title`, `login_volunteer_title`, `login_email`, `login_username`, `login_password`, `login_submit`, `login_failed`, `login_wrong_role`, `login_required`, `signed_in_as`, `sign_out`, `admin_coming`, `volunteer_coming`.

## Citizen redesign (2026-10)

Keys added for the redesigned citizen app (all Thai drafts, need native review): `nav_now`, `nav_prepare`, `nav_more`, `live_label`, `sos_aria`, `demo_chip`, `demo_chip_aria`, `place_change`, `search_label`, `first_visit_body`, `first_visit_ok`, `lvl_safe`, `lvl_watch`, `lvl_warning`, `lvl_unknown`, `haz_flood`, `haz_rain`, `haz_storm`, `haz_smoke`, `haz_heat`, `haz_earthquake`, `haz_tsunami`, `haz_landslide`, `haz_drought`, `haz_wildfire`, `haz_volcano`, `haz_chemical`, `haz_other`, `line_pm25`, `line_heat`, `line_rain`, `line_river`, `line_quake`, `line_event`, `feed_air`, `feed_forecast`, `feed_river`, `feed_gdacs`, `feed_quakes`, `now_updated`, `now_safe_title`, `now_safe_body`, `now_unknown_title`, `now_unknown_body`, `now_unknown_never`, `now_title_1`, `now_title_2`, `now_title_3`, `now_reason_1`, `now_reason_n`, `now_partial`, `now_guidance`, `now_quiet`, `now_steps`, `now_shelter`, `now_shelter_go`, `now_shelter_sub`, `now_shelter_none`, `now_report`, `now_shelters`, `now_rain24`, `now_recent`, `now_recent_none`, `tile_rain`, `tile_air`, `tile_river`, `tile_quakes`, `tile_rising`, `tile_normal`, `tile_none`, `sample_tag`, `hazard_source`, `hazard_distance`, `hazard_sample_note`, `hazard_guide`, `hazard_open_source`, `now_all_shelters`, `now_checking_title`, `map_layers`, `map_shelters`, `map_all_hazards`, `map_none`, `map_report`, `map_list`, `f_open`, `f_space`, `f_medical`, `f_pets`, `f_cleanAir`, `shelters_filters`, `shelters_none`, `shelter_route`, `shelter_gmaps`, `shelter_facilities`, `evac_list_title`, `evac_line`, `route_title`, `route_mode`, `mode_foot`, `mode_car`, `mode_bike`, `route_summary`, `route_avoided`, `route_not_avoided`, `route_steps`, `route_start`, `route_stop`, `route_recalc`, `route_loading`, `route_limited`, `route_outside`, `route_fallback`, `route_no_dest`, `route_pick_shelter`, `step_unnamed`, `step_0`, `step_1`, `step_2`, `step_3`, `step_4`, `step_5`, `step_6`, `step_7`, `step_8`, `step_9`, `step_10`, `step_11`, `step_12`, `step_13`, `dir_n`, `dir_ne`, `dir_e`, `dir_se`, `dir_s`, `dir_sw`, `dir_w`, `dir_nw`, `route_gps_error`, `prep_title`, `prep_intro`, `prep_guides`, `prep_bag`, `prep_bag_count`, `prep_bag_reset`, `prep_bag_note`, `prep_numbers`, `prep_before`, `prep_during`, `prep_after`, `prep_back`, `prep_call`, `more_title`, `more_report`, `more_language`, `more_about`, `more_demo`, `more_staff`, `more_admin`, `more_volunteer`, `more_ask`, `coming_soon`, `about_levels_title`, `about_levels_body`, `about_row_pm25`, `about_row_heat`, `about_row_rain`, `about_row_quake`, `about_row_gdacs`, `about_row_river`, `about_row_sample`, `about_limits_title`, `about_limits_body`, `about_real_routes`, `route_attribution`.

The Prepare guide text in `src/lib/prepare/guides.ts` (the `th:` fields) also needs native review, especially the life-critical steps.

When reviewed, delete this file in the same commit as the fixes.

## 2026-10-11 automated consistency pass

An automated pass (Claude, not a native speaker) changed 50 strings in `th.json` and 66 Thai strings in `src/lib/prepare/guides.ts`:

- Terminology made consistent: ที่พักพิง/เปิดรับ for open shelters, พื้นที่เสี่ยงภัย for hazard zones, อากาศร้อนจัด and ฝุ่น PM2.5 in labels, พายุหมุนเขตร้อน for cyclones, โครงงานของนักศึกษา, เบอร์โทรฉุกเฉิน, ผู้ร่วมให้ข้อมูล OpenStreetMap, สายด่วนภัยพิบัติ (ปภ.) for 1784.
- Meaning fixes against the English: "fainting" is now เป็นลม (was หมดสติ), "sturdy furniture" is no longer narrowed to a table, "two ways" no longer says "at least", 1182 now says it is the weather line, "feels like" uses อุณหภูมิที่รู้สึกได้.
- Natural phrasing: no Thai question mark in `emergency_call_first`, shorter error and route messages, heatstroke named โรคลมร้อน (ฮีทสโตรก).
- Typography: ๆ attached (เร็วๆ นี้, อื่นๆ), Arabic digits (2 เส้นทาง, 3 วัน), Thai time format 11.00–15.00 น., unit ม. in the tsunami step, curly quotes around level names. The Thai two-hazard headline is now `{a}และ{b}` (the e2e test was updated).
- Life-critical steps kept: tsunami 30 ม. / 3 กม. / ชั้น 3, flood "switch off power only if dry", heatstroke 1669 + water and shade, chemical "bag exposed clothes".

A native Thai speaker should still review all of the Thai before it is treated as final.


## Demo page (2026-10-11)

New keys (Thai drafts, need native review): `demo_title`, `demo_video_label`, `demo_sound`, `demo_lead_1`, `demo_lead_2`, `demo_lead_3`, `demo_honest`, `demo_try`, `demo_roles_title`, `demo_live`, `demo_phase2`, `demo_role_citizen`, `demo_role_citizen_body`, `demo_role_volunteer`, `demo_role_volunteer_body`, `demo_role_admin`, `demo_role_admin_body`, `demo_hood_title`, `demo_hood_intro`, `demo_hood_arch`, `demo_hood_arch_body`, `demo_arch_1`, `demo_arch_2`, `demo_arch_3`, `demo_hood_flow`, `demo_hood_flow_body`, `demo_flow_1`, `demo_flow_2`, `demo_flow_3`, `demo_flow_4`, `demo_hood_db`, `demo_hood_db_body`, `demo_hood_tests`, `demo_hood_tests_body`, `demo_hood_data`, `demo_hood_data_body`, `demo_hood_history`, `demo_hood_history_body`, `demo_thresholds`, `demo_chapters`, `demo_ch_map`, `demo_ch_level`, `demo_ch_route`, `demo_ch_bag`, `demo_ch_how`.
