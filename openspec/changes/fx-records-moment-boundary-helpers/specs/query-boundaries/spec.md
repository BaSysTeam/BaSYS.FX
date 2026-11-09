# Spec Delta

## Purpose

Даёт скрипту четыре метода границы запроса и функцию `moment`: библиотека формирует поле `boundaries` модели, а условие по моменту или дате строит сервер.

## ADDED Requirements

### Requirement: Query builder offers four boundary methods

Построитель запроса SHALL предоставлять `beforeMoment`, `upToMoment`, `fromMoment` и `afterMoment` с сигнатурой `(значение, options?)`. Вызов SHALL добавлять одну границу и SHALL возвращать тот же построитель. Вид границы SHALL быть числом: 0, 1, 2 и 3 в этом порядке методов.

#### Scenario: Each method adds one boundary and returns the builder

- **WHEN** скрипт вызывает любой из четырёх методов с допустимой датой
- **THEN** метод возвращает тот же построитель
- **AND** в списке границ появляется одна запись с видом этого метода

### Requirement: Boundary methods leave the rest of the query unchanged

Методы границы SHALL NOT менять пользовательское условие, параметры и фильтры и SHALL NOT добавлять параметры `p_bnd_*` или текст SQL.

#### Scenario: Where parameters and filters stay as they were

- **GIVEN** у запроса уже заданы условие, параметр и фильтр
- **WHEN** скрипт добавляет границу
- **THEN** условие, параметры и фильтры остаются прежними

### Requirement: A date argument becomes a date boundary

Допустимая дата SHALL давать границу, у которой дата — локальное время `YYYY-MM-DDTHH:mm:ss` без долей секунды и без зоны. Метаобъект и номер SHALL быть `null`. Доли секунды библиотека SHALL отбрасывать существующей локальной сериализацией и SHALL NOT усекать дату отдельно.

#### Scenario: End of month drops milliseconds

- **WHEN** скрипт вызывает `upToMoment` с концом ноября 2026, `23:59:59.999`
- **THEN** дата границы равна `2026-11-30T23:59:59`
- **AND** метаобъект и номер равны `null`

### Requirement: A date from another engine context is accepted

Дата SHALL приниматься, когда `Object.prototype.toString` даёт `[object Date]` и время конечно, в том числе если объект создан в другом контексте движка и не имеет расширений дат библиотеки. Проверка SHALL NOT использовать `instanceof`.

#### Scenario: Foreign date serializes without a type error

- **GIVEN** дата `2026-11-30 23:59:59` из другого контекста, у которой нет локальной сериализации
- **WHEN** скрипт передаёт её в `upToMoment`
- **THEN** вызов завершается без ошибки типа
- **AND** дата границы равна `2026-11-30T23:59:59`

### Requirement: An operation moment becomes an operation boundary

Моментом SHALL быть объект, который не является датой, с допустимой датой и непустой строкой метаобъекта. Граница SHALL переносить метаобъект и номер и SHALL сериализовать дату так же, как границу-дату, через локальную копию.

#### Scenario: Moment fields are copied

- **WHEN** скрипт вызывает `beforeMoment` с моментом `2026-10-22 12:37:59`, метаобъектом `operation.su_supplier_order` и номером 7
- **THEN** дата границы равна `2026-10-22T12:37:59`, метаобъект и номер совпадают с моментом

#### Scenario: Hand-built moment with a foreign date

- **GIVEN** момент собран вручную, а его дата создана в другом контексте
- **WHEN** скрипт передаёт его в `beforeMoment`
- **THEN** вызов завершается без ошибки типа
- **AND** дата сериализуется локальной копией

### Requirement: An invalid boundary argument fails before the request

Строка, число, `null`, `undefined`, объект без даты или метаобъекта и недопустимая дата SHALL давать ошибку `<метод>: argument must be a Date or a moment.` Запрос SHALL NOT отправляться. Список границ SHALL оставаться прежним.

#### Scenario: Rejected values do not change the list

- **WHEN** скрипт передаёт `'2026-11-01'`, `null`, `{}` или `new Date(NaN)`
- **THEN** метод завершается указанной ошибкой
- **AND** список границ не меняется

### Requirement: excludeOwn is forwarded unchanged

`options.excludeOwn` SHALL записываться как `true` или `false`. Если параметр не задан, поле SHALL быть `null`. Библиотека MUST NOT выбирать значение по умолчанию: его выбирает сервер.

#### Scenario: Explicit false is kept

- **WHEN** скрипт передаёт `{ excludeOwn: false }`
- **THEN** поле `excludeOwn` границы равно `false`

#### Scenario: Omitted options become null

- **WHEN** скрипт не передаёт `options`
- **THEN** `excludeOwn` равен `null`

### Requirement: column is allowed for date boundaries only

`options.column` SHALL переноситься как есть только для границы-даты. Вместе с моментом метод SHALL завершаться ошибкой `<метод>: options.column is allowed for date boundaries only.` и SHALL NOT менять список границ. Существование и тип колонки библиотека MUST NOT проверять.

#### Scenario: Date boundary keeps the column name

- **WHEN** скрипт вызывает границу-дату с `{ column: 'delivery_date' }`
- **THEN** `column` границы равен `delivery_date`

#### Scenario: Moment with column is rejected

- **WHEN** скрипт передаёт момент и `{ column: 'delivery_date' }`
- **THEN** метод завершается указанной ошибкой
- **AND** список границ не меняется

### Requirement: Several boundaries stay in call order

Каждый успешный вызов SHALL добавлять границу в конец списка. Все границы SHALL сохраняться и SHALL выполняться сервером одновременно.

#### Scenario: Lower and upper bounds

- **WHEN** скрипт вызывает `fromMoment` с датой A, затем `upToMoment` с датой B
- **THEN** в списке две границы в этом порядке, с видами 2 и 1

### Requirement: moment builds a detached operation moment

`moment(header, metaObject)` SHALL возвращать новый объект `{ date, metaObject, number }`. `date` SHALL быть локальной копией. Последующее изменение шапки, включая смену времени исходной даты, MUST NOT менять момент. Ссылок на шапку и на её объект даты момент SHALL NOT хранить.

#### Scenario: Header date and number are copied

- **WHEN** скрипт вызывает `moment({ date: new Date(2026, 9, 22, 12, 37, 59), number: 7 }, 'operation.su_supplier_order')`
- **THEN** момент содержит эту дату, метаобъект `operation.su_supplier_order` и номер 7
- **AND** объект даты момента не совпадает с датой шапки

#### Scenario: Header string date is local

- **WHEN** `header.date` равен `'2026-10-22T12:37:59'`
- **THEN** момент содержит ту же локальную дату, что и `new Date(2026, 9, 22, 12, 37, 59)`

#### Scenario: Later header edits do not change the moment

- **WHEN** после вызова меняются номер шапки, время исходной даты или сам `header.date`
- **THEN** время и номер момента остаются прежними

#### Scenario: Foreign header date becomes a local date

- **GIVEN** `header.date` создана в другом контексте и не имеет расширений дат библиотеки
- **WHEN** скрипт вызывает `moment`
- **THEN** дата момента имеет то же время и является локальной датой с расширениями библиотеки

### Requirement: moment requires a meta object and a valid header

Пустой или нестроковый `metaObject` SHALL давать `Error('moment: operation meta object is not specified.')`. Шапка, которая не является объектом, SHALL давать `Error('moment: header is required.')`. Отсутствующая или недопустимая `header.date` SHALL давать `Error('moment: header.date is not a valid date.')`. Дата SHALL быть объектом `Date` или строкой, которую разбирает `new Date`. Библиотека MUST NOT подставлять метаобъект формы.

#### Scenario: Missing meta object

- **WHEN** второй аргумент отсутствует, не является строкой или равен `''`
- **THEN** вызов завершается ошибкой о неуказанном метаобъекте

#### Scenario: Missing or invalid header

- **WHEN** шапка равна `null`, у неё нет даты или дата равна `'abc'`
- **THEN** вызов завершается соответствующей ошибкой

### Requirement: An empty operation number is null

Номер SHALL браться из `header.number`. Значения `undefined`, `null`, `''` и `0` SHALL сохраняться как `null` и SHALL означать новую операцию для сервера.

#### Scenario: Empty numbers collapse to null

- **WHEN** номер шапки равен `undefined`, `null`, `''` или `0`
- **THEN** номер момента равен `null`

### Requirement: The query body sends every boundary field

JSON модели SHALL содержать у каждой границы `kind`, `date`, `metaObject`, `number`, `excludeOwn` и `column`. `kind` SHALL быть числом. Отсутствующее значение SHALL быть `null`, а не пропущенным полем.

#### Scenario: Date boundary matches the server contract

- **WHEN** модель с `upToMoment` на `2026-11-30T23:59:59` сериализуется в JSON
- **THEN** элемент `boundaries` равен `{"kind":1,"date":"2026-11-30T23:59:59","metaObject":null,"number":null,"excludeOwn":null,"column":null}`

### Requirement: A plain object restores boundary entries

Конструктор модели SHALL копировать `boundaries` в новые объекты границ, заменяя `undefined` на `null`. Отсутствующее поле SHALL давать пустой список.

#### Scenario: Round trip restores the same fields

- **WHEN** модель сериализуют в JSON и создают из этого объекта новую модель
- **THEN** границы восстановлены с теми же шестью полями
