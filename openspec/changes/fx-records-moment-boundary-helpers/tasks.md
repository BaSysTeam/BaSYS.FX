# Tasks

## 1. Момент и типы границ

- [x] 1.1 Добавить `src/query/queryBoundary.ts` по design, решения 1–3 и 5: `BoundaryKind` (`Before = 0`, `UpTo = 1`, `From = 2`, `After = 3`), `Moment`, `BoundaryOptions`, `QueryBoundary`, `moment`, `isMoment`. Конструктор копирует шесть полей и меняет только `undefined` на `null` (`??`, не `||`). Дата проверяется через `Object.prototype.toString` и `getTime()`, сериализация — внутренняя `toBoundaryDate` = `new Date(value.getTime()).toLocalISO()`. `moment` копирует дату, пустой номер (`undefined`, `null`, `''`, `0`) сводит к `null` и без строкового `metaObject` бросает `Error('moment: operation meta object is not specified.')`. Проверка: `tests/queryBoundary.spec.ts` из задачи 1.2 проходит.

- [x] 1.2 Добавить `tests/queryBoundary.spec.ts` на пункты 2.3.20–2.3.25 исходной задачи: успешный момент, строка `'2026-10-22T12:37:59'` как локальная дата, пустые номера, ошибки без `metaObject`, с `''`, с `header = null`, без даты и с `'abc'`, изоляция от последующих правок шапки, дата из `vm.runInNewContext` получает локальный `toLocalISO`, `isMoment` истинен только для полного момента. Проверка: `npx jest tests/queryBoundary.spec.ts` завершается без ошибок.

## 2. Модель и методы построителя

- [x] 2.1 В `src/query/selectQueryModel.ts` добавить `boundaries: QueryBoundary[]`: пустой массив либо `data.boundaries.map(item => new QueryBoundary(item))`. В `src/query/selectQueryBuilder.ts` добавить `beforeMoment`, `upToMoment`, `fromMoment`, `afterMoment` через одну внутреннюю запись (design, решения 4 и 6). Дата даёт `metaObject`/`number` = `null`; момент переносит метаобъект и номер, пустой номер — `null`. `excludeOwn` без значения — `null`. `column` только у границы-даты, иначе `Error('<метод>: options.column is allowed for date boundaries only.')` до `push`. Иной аргумент — `Error('<метод>: argument must be a Date or a moment.')`. `where`, `parameters` и `filters` не меняются, параметры `p_bnd_*` не добавляются. Проверка: `tests/selectQueryBuilder.boundaries.spec.ts` из задачи 2.2 проходит.

- [x] 2.2 Добавить `tests/selectQueryBuilder.boundaries.spec.ts` по образцу `tests/selectQueryBuilder.withFilters.spec.ts` (`new SelectQueryBuilder(null as any)`) на пункты 2.3.26–2.3.34: четыре метода с датой и видами 0–3, дата из `vm` для `upToMoment` даёт `2026-11-30T23:59:59`, `endMonth()` ноября 2026 даёт ту же строку, момент и ручной момент с чужой датой, `excludeOwn: false` и `column: 'delivery_date'`, две границы в порядке вызова, ошибки 2.3.11 и 2.3.13 не меняют список, `where`/`parameters`/`filters` стабильны, `JSON.stringify` совпадает с телом `{"kind":1,"date":"2026-11-30T23:59:59","metaObject":null,"number":null,"excludeOwn":null,"column":null}`, восстановление через `new SelectQueryModel` даёт экземпляры `QueryBoundary`. Проверка: `npx jest tests/selectQueryBuilder.boundaries.spec.ts` завершается без ошибок.

## 3. Экспорт, версия и README

- [x] 3.1 В `src/index.ts` добавить `export * from './query/queryBoundary'`. Проверка: файл содержит этот экспорт, существующие экспорты на месте.

- [x] 3.2 Поднять версию самого пакета до `1.1.0` в `package.json` и в двух полях идентичности `package-lock.json` (корень и `packages[""]`, сейчас `1.0.3`). Записи `@types/estree` и `inflight` с версией `1.0.6` не менять. Проверка: три поля идентичности равны `1.1.0`, а `node_modules/@types/estree` и `node_modules/inflight` в lock-файле остаются `1.0.6`.

- [x] 3.3 Добавить в `README.md` раздел «Границы запроса к регистру» (design, решение 8): остаток на начало через `beforeMoment(moment(...))`, остаток на конец месяца через `upToMoment(d.endMonth())`, обороты через `fromMoment` и `upToMoment`, примеры `excludeOwn` и `column`, пояснение «граница-дата — целая секунда» и правило, что в форме второй аргумент `moment` можно опустить, а в общих модулях и на сервере нельзя. Остальной текст README не переводить. Проверка: раздел содержит все перечисленные примеры и оба пояснения.

## 4. Сборка и запись результата

- [ ] 4.1 Из корня BaSYS.FX выполнить `npm test` и `npm run build`. Проверка: обе команды завершаются без ошибок; в `dist/index.d.ts` есть `moment`, `BoundaryKind`, `QueryBoundary` и сигнатуры четырёх методов; в `dist/basys-fx.iife.js` есть `exports.moment`. Существующие тесты проходят без правок ожиданий (2.3.35).

- [ ] 4.2 Записать результат в раздел 8 исходной задачи `D:\_WORK\BaSysProject\REPO\BaSysApp\BaSYS.DevDocs\openspec\changes\add-records-moment-boundaries\tasks\2026-11-07-2155-fx-records-moment-stage-2-3-boundary-helpers-task.md`: что изменилось, итоги `npm test` и `npm run build`, версия `1.1.0`, ревизия `git rev-parse HEAD` и SHA-256 `dist/basys-fx.iife.js`. Отметить пункты 2.3.1–2.3.36 и статус файла `done`. В головном `tasks.md` отметить этап 2.3. Для критерия приёмки 6 отметить только библиотечную часть (методы и тесты Jest); строку публикации в §4 не заполнять. Для критерия 7 проверить ошибку `moment` без второго аргумента. Проверка: раздел 8 содержит версию, ревизию и хеш, статус задачи `done`, этап 2.3 отмечен. Публикация в npm не выполняется.

## Workflow follow-up

- Публикацию `@basysteam/basys-fx@1.1.0` выполняет владелец после выпуска `BaSys.Back` с этапом 2.2, из ревизии, записанной в разделе 8. Подтверждение пишется в таблицу публикации §4 головного `tasks.md`, не в это изменение.
- Архивировать изменение `fx-records-moment-boundary-helpers` после ревью, когда реализация закрыта. Головное изменение `add-records-moment-boundaries` архивируется отдельно.
