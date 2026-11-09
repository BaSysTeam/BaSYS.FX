# BaSYS.FX
BaSYS.FX is an extended set of functions for working with dates, tables, and other utilities in JavaScript.

## Installation

```bash
npm install @basysteam/basys-fx
```

## Register query boundaries

The library writes the query model's `boundaries` field. The server builds the condition by date or by operation moment.

Opening balance at the start of the operation:

```js
const opening = await from('records.su_request_saldo')
    .where('project = @project').parameter('project', $h.project)
    .beforeMoment(moment($h, 'operation.su_supplier_order'))
    .groupBy('rd_item')
    .select(['rd_item', 'sum(quantity) as quantity'])
    .query();
```

Balance at the end of the month:

```js
const closing = await from('records.su_request_saldo')
    .upToMoment(d.endMonth())
    .groupBy('rd_item')
    .select(['rd_item', 'sum(quantity) as quantity'])
    .query();
```

Turnover for a period:

```js
const turnover = await from('records.su_request_saldo')
    .fromMoment(d.beginMonth())
    .upToMoment(d.endMonth())
    .groupBy('rd_item')
    .select(['rd_item', 'sum(quantity) as quantity'])
    .query();
```

Own movements are excluded explicitly: `upToMoment(moment($h, 'operation.su_supplier_order'), { excludeOwn: true })`. If `excludeOwn` is omitted, the library sends `null`, and the server chooses the default.

A boundary on another date column: `upToMoment(d, { column: 'delivery_date' })`. The column name is passed as given. `column` is valid only together with a date, not with an operation moment.

A date boundary is a whole second. Fractions of a second do not enter the query: `endMonth()` returns `23:59:59.999`, while `boundaries` receives `23:59:59`. The server truncates the date to a second itself, so the result does not depend on milliseconds on the client.

In a form, the second `moment` argument can be omitted: `moment($h)` takes the meta object of that form. The frontend adds this, not the library. In shared modules and on the server the second argument is required: a call without it fails with `moment: operation meta object is not specified.`

## Development

### OpenSpec in Codex and Cursor

OpenSpec planning artifacts are shared in `openspec/`. Cursor workflows are in
`.cursor/`; Codex skills are in `.agents/skills/`. Both use the configuration in
`openspec/config.yaml`. Artifact text, structural headings, and SHALL/MUST
keywords are in English.

The workflows require the OpenSpec CLI. If `openspec --version` is unavailable
in the terminal used by your agent, install the version used to generate these
skills:

```bash
npm install -g @fission-ai/openspec@1.14.1
```

In Codex CLI or the IDE extension, invoke a skill with `$` or select it via
`/skills`. In the desktop app, select it from Skills. If the new skills do not
appear, restart Codex.

| Workflow | Codex skill | Cursor command |
| --- | --- | --- |
| Explore an idea | `$openspec-explore` | `/opsx-explore` |
| Prepare a proposal, specs, design, and tasks | `$openspec-propose` | `/opsx-propose` |
| Revise planning artifacts | `$openspec-update-change` | `/opsx-update` |
| Implement change tasks | `$openspec-apply-change` | `/opsx-apply` |
| Sync delta specs into main specs | `$openspec-sync-specs` | `/opsx-sync` |
| Archive a completed change | `$openspec-archive-change` | `/opsx-archive` |

For example, ask Codex:

```text
$openspec-propose Describe the change: <idea>
$openspec-apply-change <change-name>
```

Run proposal and implementation as separate requests so the planning artifacts
can be reviewed first. Codex uses skills directly; `/opsx-*` commands belong to
Cursor.

To regenerate the Codex integration with the same six workflows:

```bash
openspec init --tools codex --profile core
```

After upgrading the CLI, run `openspec update` from the repository root to
refresh the generated integrations for both tools. The
`.agents/skills/.openspec-target` marker identifies the Codex skill tree; keep it
under version control along with the generated skills.

### Project review and release-note skills

The following project skills are invoked explicitly in Codex or Cursor. Their
shared instructions live in `.agents/skills/`; the entries in `.cursor/skills/`
refer to those instructions.

| Task | Codex skill | Cursor skill |
| --- | --- | --- |
| Review library code, public API, and Jest coverage | `$bs-code-reviewer` | `/bs-code-reviewer` |
| Review an OpenSpec proposal, specs, design, or tasks | `$bs-spec-reviewer` | `/bs-spec-reviewer` |
| Add one item to an existing release-notes file | `$bs-release-note-item` | `/bs-release-note-item` |

Review skills leave code and planning artifacts unchanged and write English
reports to `openspec/changes/<change>/reviews/` for a selected active change,
or to `review/` otherwise. Release notes live in `docs/relises/`; the release-note
skill defaults to the highest version file in that directory and describes
implemented public library behavior in English. Reports and release-note items
use English regardless of the request language or the language of the source
OpenSpec artifacts. The release-note skill does not bump the version or publish npm.

```text
$bs-code-reviewer src/query/selectQueryBuilder.ts
$bs-spec-reviewer add-mathematical-rounding
$bs-release-note-item 1.1.0.md
```

These project skills are maintained separately from the generated OpenSpec
workflows. Restart Codex if the new skills do not appear in its skill picker.

### Building

To build the project:

```bash
npm run build
```

### Testing

To run the unit tests:

```bash
npm test
```

To run tests in watch mode:

```bash
npm run test:watch
```

To generate test coverage:

```bash
npm run test:coverage
```
