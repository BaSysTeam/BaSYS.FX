# BaSYS.FX
BaSYS.FX is an extended set of functions for working with dates, tables, and other utilities in JavaScript.

## Installation

```bash
npm install @basysteam/basys-fx
```

## Rounding

`round` accepts a primitive number and an integer precision from `-308` to `324`. The default precision is `0`. Ties round away from zero, using the canonical decimal digits of the value. The result is a number, so trailing zeros are not kept.

```js
round(12.6);             // 13
round(1.005, 2);         // 1.01
round(-1.5);             // -2
round(1.2, 2);           // 1.2
round(1234.567, -2);     // 1200
```

A string, empty value, object, boxed number, or symbol throws `TypeError`. A fractional, non-finite, or out-of-range precision throws `RangeError`. `NaN` and infinities are preserved for an allowed precision, and every zero result is positive zero.

`formatNumber` and numeric `format` use the same decimal rule and write the rounded digits directly, padded to the display precision. Display precision is `0` through `100`. `round` accepts `-308` through `324` and does not pad trailing zeros. Arithmetic after `round` is ordinary IEEE 754 arithmetic. Details are in [docs/round.md](docs/round.md).

A rounded zero has no minus sign. Finite values are plain decimal text, including exponential inputs such as `1e21`. `NaN`, `Infinity`, and `-Infinity` are the tokens `NaN`, `Infinity`, and `-Infinity`.

Consumers that stored formatted text should review the following changes. Masks, separators, grouping, and the default of two decimal places still work. The previous `toFixed` boundary text is not the current result.

| Call | Current result | Previous result |
| --- | --- | --- |
| `formatNumber(1.005)` | `"1.01"` | `"1.00"` |
| `formatNumber(0.1, { decimals: 20, groupSeparator: '' })` | `"0.10000000000000000000"` | `"0.10000000000000000555"` |
| `formatNumber(-0.004)` | `"0.00"` | `"-0.00"` |
| `formatNumber(1e21, { groupSeparator: '' })` | `"1000000000000000000000.00"` | `"1e+21"` |
| `formatNumber(Infinity)` | `"Infinity"` | `"In fin ity"` |

See [docs/format.md](docs/format.md).

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

## Compose WHERE conditions

`where` replaces the accumulated condition with the supplied text. `whereAnd` and `whereOr` start a condition when none exists, and otherwise combine the whole accumulated condition with the new fragment. The operators are lowercase `and` and `or`. Each call returns the same builder and changes only the WHERE expression.

The first fragment is stored verbatim, with no added operator or parentheses:

```js
from('records.su_request_saldo').whereOr('a = 1 OR b = 2');
// a = 1 OR b = 2
```

`where('')` clears the condition. The next `whereAnd` or `whereOr` starts again:

```js
from('records.su_request_saldo').where('a = 1').where('').whereOr('b = 2');
// b = 2
```

`where` discards the earlier chain. A later concatenation uses the replacement as its left operand:

```js
from('records.su_request_saldo')
    .where('a = 1')
    .whereOr('b = 2')
    .where('c = 3 OR d = 4')
    .whereAnd('e = 5');
// (c = 3 OR d = 4) and (e = 5)
```

When a condition already exists, both operands are grouped. Existing parentheses and whitespace stay inside those groups:

```js
from('records.su_request_saldo')
    .where('rd_code = 65 OR rd_code = 66')
    .whereAnd('project = @project');
// (rd_code = 65 OR rd_code = 66) and (project = @project)

from('records.su_request_saldo')
    .where('project = @project')
    .whereAnd('rd_code = 65 OR rd_code = 66');
// (project = @project) and (rd_code = 65 OR rd_code = 66)

from('records.su_request_saldo')
    .where('a = 1 AND b = 2')
    .whereOr('c = 3 AND d = 4');
// (a = 1 AND b = 2) or (c = 3 AND d = 4)

from('records.su_request_saldo')
    .where(' (a = 1 OR b = 2) ')
    .whereAnd(' c = 3 ');
// ( (a = 1 OR b = 2) ) and ( c = 3 )
```

Successive calls use the whole previous result as the left operand, in call order:

```js
from('records.su_request_saldo').where('a = 1').whereOr('b = 2').whereAnd('c = 3');
// ((a = 1) or (b = 2)) and (c = 3)

from('records.su_request_saldo').where('a = 1').whereAnd('b = 2').whereOr('c = 3');
// ((a = 1) and (b = 2)) or (c = 3)

from('records.su_request_saldo').where('a = 1').whereAnd('b = 2').whereAnd('c = 3');
// ((a = 1) and (b = 2)) and (c = 3)

from('records.su_request_saldo').where('a = 1').whereOr('b = 2').whereOr('c = 3');
// ((a = 1) or (b = 2)) or (c = 3)
```

This is a breaking change. Before the fix, `where('a').whereOr('b').whereAnd('c')` produced `a or b and c`. SQL precedence reads `a OR b AND c` as `a OR (b AND c)`. The same calls now produce `((a) or (b)) and (c)`, which is `(a OR b) AND c`. To keep the former meaning, put the compound operand in one fragment:

```js
from('records.su_request_saldo').where('a').whereOr('b AND c');
// (a) or (b AND c)
```

Composition applies to non-empty SQL fragment strings. `''`, `null`, and `undefined` are outside that contract. The supported exception is `where('')`, which resets the condition. This library does not skip empty or `null` fragments. That skip policy belongs to the backend condition builder and is not applied here.

The grouping ships in `2.0.0`, a major release after the pinned boundaries release `1.1.0` (`edabb452961d95deecc1660f55c1f4f10fb2ce9c`). It does not ship in a `1.x` release, and the fixed build is not a publishable `1.1.0` artifact. npm consumers on `^1.0.6` must upgrade explicitly to the new major. Frontend bundles and both embedded backend copies, `BaSysFX` and `BaSysFXmodule`, must be updated from the same `2.0.0` revision and deployed together. Before publishing, the release owner adds the breaking change, the old and new grouping, and this migration guidance to `docs/relises/2.0.0.md`.

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
