# Design

## Context

Motivation and the change boundary are described in [proposal.md](proposal.md). The contract is in the [specification](specs/number-rounding/spec.md). The library has no separate numeric rounding. Shared functions live in `src/common.ts` and are re-exported from `src/index.ts`. `formatNumber` uses `Math.abs(value).toFixed(decimals)` and returns a string. `parseNumber` separately converts a string and replaces `NaN` with zero.

In Construction, the helper `roundBy` is used through `round1`/`round2`/`round3`/`round6` and mixes input conversion with rounding. The user chose numeric input only for the library, with conversion kept separate. The project builds with TypeScript and Rollup to ESM, UMD, and IIFE, targets ES6, and has ES2017 libraries available. Tests use Jest and ts-jest. No changes to existing specifications are required: the main catalog is still empty.

The design is needed to settle the ambiguity between the binary `Number` value and the expected decimal rounding, and to choose an algorithm that does not re-round intermediate numbers.

## Goals / Non-Goals

**Goals:**

- Decide a tie on decimal digits before the single final conversion to `number`.
- Avoid intermediate overflow and any dependence on the absolute tolerance `Number.EPSILON`.
- Keep the current build formats and existing functions, with no new dependencies and no new runtime requirements.

**Non-Goals:**

- Recovering the exact original value from before conversion to `Number`, or from previous arithmetic.
- Guaranteeing exact decimal arithmetic after the result is returned. `0.1 + 0.2` remains an ordinary JavaScript operation.
- Unifying rounding and string representation. `formatNumber(1.005)` keeps its previous algorithm and may differ from `round(1.005, 2)`.

## Decisions

### D1. One public API and a separate input check

Place `round(value: number, digits: number = 0): number` next to the shared functions in `src/common.ts`. The existing `export * from './common'` already provides the public export. A new export in `index.ts` is needed only if a real need appears. JSDoc explains the numeric result and the absence of trailing zeros. There are no aliases, no prototype changes, and no global registration.

Check the type of `value` first, then the type and validity of `digits`. A non-numeric argument produces `TypeError`. A numeric but invalid precision produces `RangeError`. Only after these checks, return a non-finite value unchanged. For every zero, return `+0`.

The alternative `Number(value) || 0` from the example hides bad input. The user chose explicit conversion on the caller side. Preserving `NaN` and infinities is more convenient for composing math functions than throwing for a numeric result of a previous calculation.

### D2. Decimal contract from the canonical representation

For a finite non-zero number, the source of decimal digits is `String(Math.abs(value))`. Ties round away from zero. The decision is made on the absolute value, and the sign is applied after rounding. This matches `ROUND_HALF_UP` in decimal.js and gives negative halves the required meaning.

This is a deliberate decimal contract: `1.005` is treated as the decimal `1.005`, even though its binary representation differs slightly. The number `1.4999999999999998` stays below the tie. No artificial tolerance pulls it toward `1.5`.

Rounding the exact binary value is formally correct for `Number`, but it does not solve the typical application example `1.005 → 1.01`. The canonical representation does not restore lost digits: literals that became the same `Number` are indistinguishable.

### D3. Coefficient and decimal order without intermediate Number arithmetic

Internal algorithm steps:

1. Parse the canonical representation of the absolute value, including `e±n`, into an integer coefficient string and a decimal order: the value equals `coefficient × 10^exponent`. Remove leading zeros of the coefficient. Account for the order together with the count of fractional digits.
2. Determine how many right-hand digits of the coefficient are discarded for the given `digits`. If nothing is discarded, return the original number. If the rounding place is substantially coarser than the number, return `+0`.
3. Choose the kept coefficient from the first discarded digit: `0–4` leave it unchanged, `5–9` increment it by one. Carry through the digit string, including the case of all nines and an empty kept part. Do not convert the coefficient to `Number`: it may contain more digits than a safe integer.
4. Form the decimal exponential string of the rounded result and convert it to `Number` once. Apply the original sign and normalize zero. Overflow of the final result naturally yields infinity.

Do not build huge padded strings and do not compute `10 ** digits`. The precision range `[-308, 324]` covers the decimal orders of finite and subnormal `Number` values. Processing relies on the short canonical representation and on early returns. For `Number.MAX_VALUE` with precision `2`, the number is returned without scaling. With precision `-308`, the final result `2e308` becomes `Infinity`.

Alternatives considered:

- `Math.round(value * factor) / factor`: differs on negative halves, fails on `1.005`, and scaling can overflow.
- Adding `Number.EPSILON`: the size of the correction depends on the scale of the problem and does not define a reliable rule for every number.
- `Number(value.toFixed(digits))`: rounds the binary input, does not support negative precision, and does not provide the expected `1.005 → 1.01`.
- Shifting through exponential strings and `Math.round`: simple for ordinary values, but the intermediate `Number` can overflow or round to a tie before the target step.
- decimal.js or big.js: suitable for full decimal arithmetic. For one operation over an input and output `number`, a new dependency is not justified. If the task grows into exact money calculations, this decision should be revisited.
- Integer arithmetic on `BigInt`: would require a newer runtime than the current ES6 build contract.

### D4. Contract checks and documentation

Create `tests/round.spec.ts` with tabular expected results from the specification. Do not compute expected values through the implementation algorithm or through `Math.round(value * factor)`. Check both sides of a tie and both signs, digit carry, precisions `1`/`2`/`3`/`6`, negative precision, type and range errors, `Object.is` for zero, subnormal numbers, and final overflow. A separate test imports the function from `src/index.ts`.

Run the target suite, then all tests and `npm run build`. Check that the function and its declaration are present in the produced builds. Do not include generated `dist` files in the change. In `README.md`, add short examples and a link to `docs/round.md`. There, describe types, errors, the precision range, `NaN` and infinities, the tie rule, and `Number` limits.

### D5. Sources of shared behavior

- [ECMAScript: Math.round](https://tc39.es/ecma262/multipage/numbers-and-dates.html#sec-math.round): the standard resolution of ties toward positive infinity explains how the proposed function differs.
- [ECMAScript: Number::toString](https://tc39.es/ecma262/multipage/ecmascript-data-types-and-values.html#sec-numeric-types-number-tostring): the decimal string representation and exponential form.
- [decimal.js: rounding modes](https://mikemcl.github.io/decimal.js/#modes): `ROUND_HALF_UP` chooses the nearest value and resolves equal distances away from zero. Used as a terminology reference. The library is not added as a dependency.

## Risks / Trade-offs

- A bug in digit carry or exponent handling → contract examples `9.995`, `1.25e-7`, `Number.MIN_VALUE`, and large numbers of both signs.
- The result is again a binary `Number` and may not be an exact decimal multiple → describe the final conversion and the limits explicitly. Do not promise to correct later calculations.
- A caller may expect a formatted string, or `Math.round` behavior on negative halves → show short examples of both differences in the README and in JSDoc.
- Decimal string processing costs more than one `Math.round` call → short representations and an early return. A separate benchmark for this utility is not required unless a problem is measured.
- A difference from formatting may surprise an existing consumer → record that the APIs are independent and do not change `formatNumber` in this task.

## Migration Plan

The change adds a new function and does not require consumers to migrate. During implementation, prepare the sources, tests, and documentation. Versioning and publishing are a separate release process. When application wrappers are moved later, check negative halves and the input-conversion rules separately. A consumer rolls back by stopping use of the new export. Existing APIs do not change.
