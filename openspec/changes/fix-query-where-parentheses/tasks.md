# Tasks

## 1. Group fluent WHERE conditions

- [ ] 1.1 Add regression cases in `tests/selectQueryBuilder.where.spec.ts` for compound operands on both sides, OR composition, both mixed-chain orders, and repeated AND/OR. Verify that `npm test -- --runInBand tests/selectQueryBuilder.where.spec.ts` exposes the current ungrouped strings before the fix.
- [ ] 1.2 Change only the concatenating branches of `whereAnd` and `whereOr` in `src/query/selectQueryBuilder.ts` to wrap both operands, retaining lowercase operators, first-condition assignment, and `this` returns. Verify that the composition cases pass with exact strings such as `((a = 1) or (b = 2)) and (c = 3)`.
- [ ] 1.3 Extend the same suite with verbatim first conditions through both methods, `where` replacement and clearing, existing parentheses and whitespace, and unchanged parameters, filters, boundaries, and other query fields. Assert the same builder is returned by all three methods; verify the focused suite passes.
- [ ] 1.4 Add a README section documenting first-condition behavior, replacement, operand grouping, and mixed chains in call order. Explain the compatibility change from `a OR b AND c` to `(a OR b) AND c` and how a compound fragment preserves the former meaning; verify each documented output against the focused regression cases.

## 2. Verify provider integration and package compatibility

- [ ] 2.1 Add a `query()` regression case to the same suite using a mock provider with a successful empty-table response. Assert the grouped `whereExpression` in the forwarded model and its JSON serialization, with parameters, filters, and boundaries retained; verify the focused suite passes without a backend.
- [ ] 2.2 Run `npm test -- --runInBand` and `npm run build`. Verify all tests pass and the ESM, UMD, IIFE, and declaration outputs build successfully; inspect the final diff to confirm no new public signatures, request fields, dependencies, version bump, publishing action, or unrelated changes were introduced.
