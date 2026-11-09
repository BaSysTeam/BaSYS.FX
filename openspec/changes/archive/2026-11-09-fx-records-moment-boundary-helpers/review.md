# Review of fx-records-moment-boundary-helpers

Date: 2026-11-09.

## Verdict

No functional defects were found in the scenarios that were checked. The implementation of the main stage 2.3 requirements matches the specification. There are no code remarks that must be fixed before acceptance.

The change is not ready to close yet: item 4.2 of the local `tasks.md` remains open. This is an already recorded unfinished delivery step, not a regression found during review.

## Scope

The current working copy was checked, including uncommitted and new files:

- `src/query/queryBoundary.ts`;
- `src/query/selectQueryBuilder.ts`, `src/query/selectQueryModel.ts`, and `src/index.ts`;
- `tests/queryBoundary.spec.ts` and `tests/selectQueryBuilder.boundaries.spec.ts`;
- the README section on boundaries, and the versions in `package.json` and `package-lock.json`;
- the built declarations and the UMD and IIFE bundles.

Sources: `proposal.md`, `design.md`, `specs/query-boundaries/spec.md`, and `tasks.md` of this change; the source task `BaSysApp/BaSYS.DevDocs/openspec/changes/add-records-moment-boundaries/tasks/2026-11-07-2155-fx-records-moment-stage-2-3-boundary-helpers-task.md`; the parent specification `records-query-boundaries`. Field names and enum values were also checked against `BaSys.DTO/Core/QueryBoundaryDto.cs` and `QueryBoundaryKind.cs`.

## Results

| Check | Result |
| --- | --- |
| Four methods, kinds 0–3, builder return, boundary order | Matches |
| Local date serialization without milliseconds or a time zone | Matches |
| Dates from another context, including the date of a hand-built moment | Matches |
| Date copy in `moment`, independence from later header edits | Matches |
| Empty numbers, a required meta object, argument errors | Matches |
| `excludeOwn: false`, and no server default chosen on the client | Matches |
| `column` for a date only; an error is rejected before the array changes | Matches |
| `where`, `parameters`, and `filters` preserved | Matches |
| Six JSON fields, explicit `null`, restored `QueryBoundary` instances | Matches |
| Public export, declarations, version 1.1.0, and the README | Checked |

Run independently:

- `npm test -- --runInBand`: **10 suites, 259 passed, 0 failed**.
- `npm run build`: **succeeded**. ESM, UMD, IIFE, and declarations were produced. Rollup warns about cyclic dependencies in existing table modules. The warnings are unrelated to boundaries.
- An extra check of the built UMD through Node: all four methods with a moment and a foreign date; `number: 0` → `null`; `excludeOwn: true`; rejection of invalid arguments and of `column` on a moment, including an empty string; the array contents and the array reference are preserved after an error.
- The IIFE loaded in a separate `vm` context: `BaSYSFX.moment` is available, and the builder produces the expected boundary JSON.
- `git diff --check`: no remarks.

## Unfinished step before close

**Item 4.2 / source task 2.3.19: record the verified build revision.**

At review time, HEAD is `44c24442a617b42975d66389dc18146c71cada62`. It does not contain the helper implementation: three changed source files, the new `queryBoundary.ts`, and both new tests are in the working copy. That HEAD therefore does not reproduce the verified bundle. The source task in DevDocs correctly stays `open` and states this reason directly.

After the implementation is committed, that committed state must be built and checked. Its revision and SHA-256 must be written into section 8 of the source task, and then the planned checklists and stage 2.3 must be closed. The hash below belongs only to the checked working copy. It must not be attributed to the HEAD named above.

Version: `1.1.0`.

SHA-256 of `dist/basys-fx.iife.js`:

```text
161C558217454511200AB4887599173799D83E9AA7C699B09694032E14A33F51
```

Publishing to npm is not a completion criterion of this stage. The owner publishes after the server is released with stage 2.2.

## Review limits

The library, query-body construction, and the built public API were checked. Query execution against a live server, the SQL meaning of boundaries, the stage 2.4 frontend, and stage 2.5 server embedding were not checked. Sources and task statuses were not changed during the review. Only this report was added.
