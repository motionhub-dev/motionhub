// Render the app-only ruleset for review. Applying it is a separate, explicit GitHub administration step.
import {readFileSync} from 'node:fs';
const id = Number(process.argv[2]);
if (!Number.isSafeInteger(id) || id <= 0) throw new Error('Pass the numeric motionhub submission GitHub App id.');
const rule = JSON.parse(readFileSync(new URL('../rulesets/submissions.json', import.meta.url)));
rule.bypass_actors = [{actor_id: id, actor_type: 'Integration', bypass_mode: 'always'}];
console.log(JSON.stringify(rule, null, 2));
