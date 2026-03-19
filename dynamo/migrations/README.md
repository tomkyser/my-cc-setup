# Dynamo Migrations

Version-keyed migration scripts for breaking changes between releases.

## Naming Convention

Files must be named: `X.Y.Z-to-A.B.C.cjs`

Examples:
- `0.1.0-to-0.2.0.cjs`
- `0.2.0-to-0.3.0.cjs`

## Script Interface

Each migration must export:

```javascript
module.exports = {
  description: 'What this migration does',
  async migrate(options = {}) {
    // options.configPath -- path to config.json
    // options.settingsPath -- path to settings.json
    // Throw on failure (triggers rollback)
    // Return { transformed: ['config.json'] } on success
  }
};
```

## Rules

1. Migrations run in version order (0.1.0 -> 0.2.0 -> 0.3.0)
2. Each migration transforms from exactly one version to the next
3. Throw on failure -- never swallow errors
4. Use atomic writes (tmp + rename) for file modifications
5. All file paths come from options -- never hardcode ~/.claude/ paths
