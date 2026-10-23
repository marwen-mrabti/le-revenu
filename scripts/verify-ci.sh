#!/bin/sh
# Reproduces the CI pipeline from a clean clone of the current branch.
# Run before opening a pull request: pnpm verify
set -e
repo=$(git rev-parse --show-toplevel)
branch=$(git -C "$repo" rev-parse --abbrev-ref HEAD)
work=$(mktemp -d "${TMPDIR:-/tmp}/verify-ci.XXXXXX")
trap 'rm -rf "$work"' EXIT

echo "Cloning $branch into $work"
git clone -q --branch "$branch" "$repo" "$work/repo"
cd "$work/repo"

echo "Installing with frozen lockfile"
pnpm install --frozen-lockfile --silent

echo "Lint"
pnpm lint
echo "Format"
pnpm format:check
echo "Commit messages since development"
if git rev-parse --verify --quiet origin/development >/dev/null; then
  pnpm exec commitlint --from origin/development --to HEAD
fi
echo "Type check"
pnpm type-check
echo "Build"
STRAPI_URL=http://localhost:1337 AUTH_COOKIE_NAME=lr_session REVALIDATE_SECRET=ci-only-not-a-secret pnpm build
echo "Tests"
pnpm test

echo "CI reproduction passed for $branch"
