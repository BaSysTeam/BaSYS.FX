# Design

## Context

See [proposal.md](proposal.md) for motivation and scope, and [specs/number-rounding/spec.md](specs/number-rounding/spec.md) for the observable contract. Shared functions live in `src/common.ts`, re-exported by `src/index.ts`. Numeric formatting currently takes `Math.abs(value).toFixed(decimals)`, inserts grouping and decimal separators, and restores the original sign. The numeric branch of `format` delegates to `formatNumber`.

The user selected numeric input only for the new `round` function and subsequently requested a common rounding core for calculations and formatting. The existing `toFixed` path produces `"1.00"` for `1.005`, exposes binary digits for `0.1` at precision 20, and can emit `"-0.00"`. Grouping currently also splits exponential notation and infinity tokens. These outcomes must be corrected as part of the common decimal rendering path, with the compatibility changes made explicit.

The project uses TypeScript/Rollup with ESM, UMD, and IIFE outputs, target ES6, ES2017 libraries, and Jest/ts-jest. There is no existing rounding/number-formatting main spec; `query-boundaries` is unrelated. No new runtime or dependency is required.

## Goals / Non-Goals

**Goals:**

- Make one decimal rounding decision shared by the numeric result and formatted text.
- Retain the decimal representation until each public API creates its own output.
- Preserve the reviewed strict early-return cutoff, empty-kept ties, zero normalization, and extreme-number behavior.
- Keep masks, separators, display precision conventions, and existing public exports supported.

**Non-Goals:**

- Recovering digits lost before a value became a `Number`, or guaranteeing exact arithmetic after a numeric result is returned.
- Adding rounding modes, new mask syntax, negative display precision, or a public decimal result type.
- Changing parsing, date/boolean utilities, package versions, or publishing.

## Decisions

### D1. Internal decimal core and two output adapters

Create `src/numberRounding.ts` as an internal module imported by `src/common.ts`. It holds the canonical-decimal parsing and rounding operation. Its finite result carries a sign, a string of coefficient digits, and a decimal exponent. A zero has coefficient `"0"` and no negative sign. These helpers and types are not re-exported by `src/index.ts` or added to the supported public API.

The public `round(value: number, digits: number = 0): number` validates its own contract, uses this core, and returns a `number`. `formatNumber` resolves its existing presentation options, uses the same core, and renders the decimal result directly. `format` continues delegating numeric input to `formatNumber`. No second independent rounding algorithm remains in numeric formatting.

Alternatives: duplicating the logic allows divergence on halves; calling `round(...).toFixed(...)` loses the decimal representation and exposes binary tails again. A public decimal object would widen the API beyond this task. An internal module makes the shared operation explicit while keeping callers on the existing public entry point.

### D2. Decimal interpretation, validation, and special values

Finite values are interpreted using the digits in `String(Math.abs(value))`, including exponent notation. Ties round away from zero. Inputs that became the same `Number` remain indistinguishable; `1.4999999999999998` remains below the tie.

The `round` adapter checks the type of `value`, then the type and validity of `digits`, before handling `NaN` or infinities. Only primitive numbers are accepted; `undefined` in `digits` selects zero. Non-numeric input causes `TypeError`; a fractional, non-finite, or out-of-range numeric precision causes `RangeError`. Its range remains `[-308, 324]`. Non-finite values pass through, and every numeric zero result becomes `+0`.

The formatting adapter keeps the existing option/mask resolution and precision normalization before calling the core. Its default remains two; precision follows the current `toFixed`-compatible coercion/truncation and the inclusive `0..100` range. For example, `2.9` means `2`, `-0.9` and `NaN` mean `0`, and nullish option values retain the default. Validate range before returning a special numeric token. The broader precision range and stricter argument rules of `round` do not silently replace the formatting adapter's existing conventions.

For valid display precision, formatting special values returns `NaN`, `Infinity`, or `-Infinity` directly. Do not send these tokens through digit grouping or decimal padding. Finite zero input, negative zero, and finite inputs rounded to zero all receive an unsigned decimal representation.

### D3. Rounding coefficient digits without intermediate Number arithmetic

The shared finite operation is:

1. Parse the canonical absolute representation into a coefficient string and decimal exponent: the magnitude equals `coefficient × 10^exponent`. Remove leading zeros and account for fractional digits in the exponent. Handle zero as the normalized zero record.
2. Let `L` be the length of the non-zero coefficient and `k = -digits - exponent` the number of coefficient digits to discard. If `k <= 0`, return the unchanged decimal record, retaining its coefficient and exponent rather than converting it to a number. If `k > L`, return the zero record. For `0 < k <= L`, continue to step 3; `k = L` MUST NOT trigger an unconditional return to zero.
3. Keep the first `L - k` digits and inspect the first discarded digit. With `k = L`, the kept part is empty and represents zero: `0–4` yield zero, while `5–9` produce coefficient `1` at exponent `-digits`. Otherwise, `0–4` leave the kept coefficient unchanged and `5–9` increment it by one, carrying through the digit string. The resulting exponent is `-digits`. Preserve the original sign only for a non-zero coefficient. Do not convert the coefficient to `Number`, because it may exceed the safe integer range.
4. Return the decimal record. Only the numeric adapter converts its exponential representation to `Number`, once, or returns the original numeric input when unchanged. Normalize any numeric zero to `+0`; a final numeric overflow gives the corresponding infinity. The formatting adapter uses the record without this conversion.

The mathematical zero cutoff is an absolute canonical decimal value strictly below `5 × 10^(-(digits + 1))`; equality rounds away from zero. Compare digits/exponents rather than evaluating the threshold with `Number`: `5 * Math.pow(10, -324)` is zero although `5e-324` is non-zero. Thus `round(±5, -1)` yields `±10`, and `round(±5e-323, 322)` yields `±1e-322`. Keep the previously added below/above-half cases in the tests.

No large padding or powers of ten are needed inside the rounding core. `round(Number.MAX_VALUE, 2)` preserves the input without scaling; `round(Number.MAX_VALUE, -308)` converts the final `2e308` to infinity. Subnormal values follow the same decimal rules.

Alternatives considered: multiplication/division by a factor can introduce errors or overflow; `Number.EPSILON` supplies a scale-dependent tolerance; `toFixed` rounds the binary value; exponent shifting through a temporary `Number` can itself round before the target step. Decimal libraries are suitable for full decimal arithmetic but add an unnecessary dependency here. `BigInt` would raise the runtime requirement.

### D4. Formatting the decimal result once

For a finite decimal record, place the point using its exponent, pad the fractional part to the effective display precision, and then apply the existing grouping and separator functions. Derive the displayed sign from the rounded record, so a zero never becomes `-0.00`. Both mask-selected and options-selected precision take this path.

Do not call `toFixed` or convert the rounded decimal record to a numeric intermediate for formatting. At precision 20, `0.1` must render as `0.10000000000000000000`; a `round`-then-`toFixed` pipeline would reveal binary digits again. The finite formatter emits plain decimal notation even when the input's canonical representation uses an exponent, so `1e21` with grouping disabled is `1000000000000000000000.00`. Padding is bounded by the finite `Number` decimal range and display precision `0..100`.

Examples `formatNumber(1.005) → "1.01"`, `formatNumber(-1.005) → "-1.01"`, `formatNumber(-0.004) → "0.00"`, and the corresponding `format` calls describe intended observable changes. Existing separator/mask semantics remain, including defaults and grouping disabled by `groupSeparator: ''`.

### D5. Contract tests and documentation

Use `tests/round.spec.ts` for the new numeric API and `tests/format.spec.ts` for formatter regression and cross-API behavior. Set expected values explicitly rather than deriving them from the implementation, `Math.round`, or `toFixed`.

Keep all numeric scenarios, especially empty-kept ties with both signs, values on either side, subnormals, invalid argument/range cases, precision limits, large values, final overflow, and zero normalization. Add formatting tests for canonical halves, `0.005`/`-0.005`, carry to `10.00`, high precision without binary tails, plain rendering of `1e21`, unsigned rounded zero, special tokens, masks, separators, and the unchanged formatting precision conventions. Check numeric `format` equivalence using the same inputs and options, plus unchanged date/boolean dispatch and unsupported-type errors. Verify the internal core is shared by reviewing the call paths; tests target public behavior rather than its internal representation.

Document `round` in JSDoc, README, and `docs/round.md`. Update `docs/format.md` to describe the shared rule, trailing zeros, the narrower formatting precision range, special tokens, and the compatibility changes. Explain that a returned `number` still has IEEE 754 limits while formatting preserves the rounded decimal text.

Run the focused suites, then all tests and `npm run build`. Verify the public function and declarations in ESM/UMD/IIFE, without re-exporting the internal module. Keep generated `dist` files out of the change.

### D6. References

- [ECMAScript: Math.round](https://tc39.es/ecma262/multipage/numbers-and-dates.html#sec-math.round): native tie resolution toward positive infinity differs from the selected rule.
- [ECMAScript: Number::toString](https://tc39.es/ecma262/multipage/ecmascript-data-types-and-values.html#sec-numeric-types-number-tostring): the decimal string and exponential representation used as the input contract.
- [decimal.js: rounding modes](https://mikemcl.github.io/decimal.js/#modes): `ROUND_HALF_UP` names the nearest-value rule with ties away from zero. This is a terminology reference, not a dependency.

## Risks / Trade-offs

- Existing display expectations change at decimal boundaries, high precision, rounded negative zero, and exponential/non-finite output → document before/after examples and review consumer expectations before release; do not claim full behavior compatibility.
- Accidentally converting the shared result back to `Number` in the formatter reintroduces binary tails → require the precision-20 `0.1` regression and inspect both adapter call paths.
- A cutoff or carry bug loses an empty-kept tie → preserve explicit `k > L`/`k = L` rules and the ordinary/subnormal scenarios of both signs.
- Formatting and numeric output have different precision domains → keep their normalization in their public adapters and test each boundary independently.
- Returned numbers remain binary approximations → document this limit; formatted text preserves canonical decimal digits but cannot restore digits lost before the call.
- String processing costs more than one `Math.round` → short canonical records and early exits; add performance work only for a measured problem.

## Migration Plan

Implement the shared core, numeric adapter, formatting integration, tests, and docs together before release. Existing function signatures, masks, and separator options stay supported. Review saved text expectations for the documented formatting changes, including unsigned zero and high precision. Version selection and publishing remain a separate release process that must account for the breaking output changes. A rollback restores the previous package version and its formatting behavior as a unit; consumers must also stop using the newly added `round` export.
