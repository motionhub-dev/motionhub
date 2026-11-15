# Changelog

## 0.10.0

Breaking change. `motionhub share` submits only through motionhub.dev.

- `share --pr` is removed. It forked `motionhub-dev/motionhub` with the author's own GitHub token and opened a pull request from that fork. Those pull requests fail the `ownership` check, which does not check out fork code. Run `motionhub share <dir>`, open the link, and sign in with GitHub. motionhub's GitHub App opens the pull request from a `share/` branch.
- `share --github` is removed. `motionhub check <dir> --author <login>` runs the checks as that account without uploading.
- `share` still needs no git, `gh` or GitHub token. `--wait` still waits for the pull request.
- `@motionhub/cli/hub` no longer exports `share` or `forkOf`. `shareLink` is the submission.
