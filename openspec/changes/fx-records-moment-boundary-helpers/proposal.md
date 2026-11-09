# Proposal

## Why

Прикладной разработчик не может задать остаток или оборот регистра по моменту операции или по дате: `SelectQueryBuilder` умеет только `where`, параметры и фильтры, а условие по моменту должен строить сервер. Этап 2.3 головного изменения `add-records-moment-boundaries` добавляет в `@basysteam/basys-fx` поле `boundaries` модели запроса и функцию `moment`, чтобы клиент передавал намерение, а не SQL.

Источник требований — задача этапа 2.3 и решение D7 головного design. Этот документ на них ссылается и не переписывает контракт сервера.

- Задача: `D:\_WORK\BaSysProject\REPO\BaSysApp\BaSYS.DevDocs\openspec\changes\add-records-moment-boundaries\tasks\2026-11-07-2155-fx-records-moment-stage-2-3-boundary-helpers-task.md`
- Design D5, D7: `D:\_WORK\BaSysProject\REPO\BaSysApp\BaSYS.DevDocs\openspec\changes\add-records-moment-boundaries\design.md`
- Требования головного изменения: `...\specs\records-query-boundaries\spec.md` — «Query builder offers four boundary methods», «Boundary argument is a date or an operation moment», «moment builds an operation moment», «Own movements can be excluded», «A date boundary can use an explicit column».

## What Changes

- Новый модуль границ: `BoundaryKind`, `Moment`, `BoundaryOptions`, `QueryBoundary`, `moment`, `isMoment`.
- Четыре метода построителя: `beforeMoment`, `upToMoment`, `fromMoment`, `afterMoment`. Каждый добавляет одну границу в `model.boundaries` и не меняет `where`, `parameters` и `filters`.
- `SelectQueryModel.boundaries` сериализуется в JSON и восстанавливается из простого объекта. Отсутствующие значения передаются как `null`.
- Публичный экспорт из пакета. Версия `1.1.0`: API только добавляется.
- Раздел README «Границы запроса к регистру».
- Короткая форма `moment($h)` в библиотеке не появляется: контекст формы добавляет фронтенд на этапе 2.4.

## Capabilities

### New Capabilities

- `query-boundaries`: формирование границ запроса и момента операции в `@basysteam/basys-fx`. Библиотека проверяет аргумент, сериализует дату и кладёт `QueryBoundary` в модель. SQL, параметры `p_bnd_*` и смысл границ строит сервер.

### Modified Capabilities

- Нет. В `openspec/specs` этого репозитория требований ещё нет.

## Impact

- Код: `src/query/queryBoundary.ts` (новый), `src/query/selectQueryModel.ts`, `src/query/selectQueryBuilder.ts`, `src/index.ts`.
- Тесты: `tests/queryBoundary.spec.ts`, `tests/selectQueryBuilder.boundaries.spec.ts`. Существующие тесты построителя остаются регрессией.
- Документация и версия: `README.md`, `package.json`, `package-lock.json` (`1.0.6` → `1.1.0`).
- Потребители: фронтенд (`Queries/Execute`) и серверные скрипты (`QueriesEvaluator/Execute`) получат поле `boundaries`. Сервер без этапа 2.2 молча игнорирует неизвестное поле, поэтому публиковать пакет можно только после выпуска `BaSys.Back` с этапом 2.2. Сама публикация в npm в этот этап не входит.
- Не затрагивается: `toLocalISO`, `endMonth` и прочие расширения дат; построение SQL; `BaSys.Front` и `jsSource.resx`; хранение контекста формы в `globalThis`.
