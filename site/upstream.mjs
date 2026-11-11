// The public catalogue repository's code the Worker runs: the rules for who owns a motion and which files a package may
// carry, the same modules the checker uses, so a share is judged as its pull request will be. Every module of the Worker
// takes them from here, the one place it reaches outside site/; the modules re-exported have no dependencies, not even on
// Node, since the Worker bundles them. The build's reach is in paths.mjs, the pages' through @upstream (astro.config.mjs).
export {accountId, authorProblem, ownerId, singleAuthor} from '../tools/security/ownership.mjs';
export {sensitiveFile} from '../tools/security/package.mjs';
