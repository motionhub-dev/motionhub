-- Fictional local-only records. No credentials, production identities or remote writes.
INSERT INTO people(id,login,name,created_at,seen_at) VALUES(900000001,'admin-fixture','Local Fixture',1794000000,1794000000);
INSERT INTO artifacts(id,person,title,description,updated_at) VALUES('11111111-1111-4111-8111-111111111111',900000001,'Fixture artifact','A local moderation fixture',1794000000);
INSERT INTO artifact_versions(id,artifact,created_at,ready) VALUES('22222222-2222-4222-8222-222222222222','11111111-1111-4111-8111-111111111111',1794000000,1);
UPDATE artifacts SET draft_version='22222222-2222-4222-8222-222222222222',public_version='22222222-2222-4222-8222-222222222222' WHERE id='11111111-1111-4111-8111-111111111111';
INSERT INTO submissions(id,poll_hash,code,motion,version,sha256,bytes,status,person,pr,created_at,expires_at) VALUES('fixture-submission','unused-local-hash','UNUSED','@iamsuosi/lab-notebook','2.0.0','fixture-digest',1024,'submitted',900000001,1,1794000000,1794086400);
INSERT INTO admin_collections(slug,title,description,items_json,status,position,updated_at) VALUES('local-selection','Local selection','A fictional local-only collection','["@iamsuosi/lab-notebook"]','draft',0,1794000000);
