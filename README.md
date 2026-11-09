# BaSYS.FX
BaSYS.FX is an extended set of functions for working with dates, tables, and other utilities in JavaScript.

## Installation

```bash
npm install @basysteam/basys-fx
```

## Границы запроса к регистру

Библиотека записывает поле `boundaries` модели запроса. Условие по дате или по моменту операции строит сервер.

Остаток на начало операции:

```js
const opening = await from('records.su_request_saldo')
    .where('project = @project').parameter('project', $h.project)
    .beforeMoment(moment($h, 'operation.su_supplier_order'))
    .groupBy('rd_item')
    .select(['rd_item', 'sum(quantity) as quantity'])
    .query();
```

Остаток на конец месяца:

```js
const closing = await from('records.su_request_saldo')
    .upToMoment(d.endMonth())
    .groupBy('rd_item')
    .select(['rd_item', 'sum(quantity) as quantity'])
    .query();
```

Обороты за период:

```js
const turnover = await from('records.su_request_saldo')
    .fromMoment(d.beginMonth())
    .upToMoment(d.endMonth())
    .groupBy('rd_item')
    .select(['rd_item', 'sum(quantity) as quantity'])
    .query();
```

Свои движения исключаются явно: `upToMoment(moment($h, 'operation.su_supplier_order'), { excludeOwn: true })`. Если `excludeOwn` не передан, библиотека отправляет `null`, а значение по умолчанию выбирает сервер.

Граница по другой колонке даты: `upToMoment(d, { column: 'delivery_date' })`. Имя колонки передаётся как есть. `column` допустим только вместе с датой, не с моментом операции.

Граница-дата — целая секунда. Доли секунды в запрос не попадают: `endMonth()` возвращает `23:59:59.999`, а в `boundaries` уходит `23:59:59`. Сервер усекает дату до секунды сам, поэтому результат не зависит от миллисекунд на клиенте.

В форме второй аргумент `moment` можно опустить: `moment($h)` берёт метаобъект этой формы. Это добавляет фронтенд, не библиотека. В общих модулях и на сервере второй аргумент обязателен: вызов без него завершается ошибкой `moment: operation meta object is not specified.`

## Development

### OpenSpec in Codex and Cursor

OpenSpec planning artifacts are shared in `openspec/`. Cursor workflows are in
`.cursor/`; Codex skills are in `.agents/skills/`. Both use the configuration in
`openspec/config.yaml`, including Russian artifact text with English structural
headings and SHALL/MUST keywords.

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
$openspec-propose Опиши изменение: <идея>
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
