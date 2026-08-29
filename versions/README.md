# Version metadata

- `version-info.xml` — changelog entries consumed by in-app update checks (`UpdateService`)
- `README.md` — this file

## Updating a release

```bash
npm run update-version 0.7.9 "Fix search sync" "Improve Docker docs"
```

This updates:

- `package.json` version
- `versions/version-info.xml` (new entry)
- `src/services/updateService.ts` current version constant (via the script)

`downloadUrl` in the XML should point at the GitHub Release page or the full-stack Docker image docs for that tag (not a desktop installer).

## Publish checklist

1. Run `npm run update-version …`
2. Commit and push
3. Create a GitHub Release matching the version tag
4. Confirm the full-stack image tags publish via `docker-publish-fullstack.yml`
