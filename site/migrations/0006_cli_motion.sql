ALTER TABLE cli_devices ADD COLUMN motion_submit INTEGER NOT NULL DEFAULT 0;
ALTER TABLE submissions ADD COLUMN dco_version TEXT;
