-- Backfill recorded_at on vital_history from the source report's date
UPDATE public.vital_history vh
SET recorded_at = (hr.radiology_study_date::timestamp AT TIME ZONE 'UTC') + INTERVAL '12 hours'
FROM public.health_records hr
WHERE vh.health_record_id = hr.id
  AND hr.radiology_study_date IS NOT NULL
  AND DATE(vh.recorded_at) <> hr.radiology_study_date;