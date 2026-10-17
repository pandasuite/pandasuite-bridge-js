# Embedded resource rollback verification

Part of beingenious/Panda.task#1057. Remove only #23 plain-string native-scheme recognition; retain browser blob/localhost conversion, typed/nested/JSON resource handling, and later correlated-response behavior. Generate all three lib bundles using `npm run build`.

`npm test` (Node 24) verifies former native-scheme strings stay ordinary text, nested blob media still converts, and the correlated-response suite remains intact. The native-scheme regression failed before rollback by returning a data URL and passes after rollback. The Panda.js Electron fixture separately exercises released bridges 5.0.2/5.0.3 and HTTP components 2.4.11/2.3.9 against real restored IndexedDB blobs. No npm publish, HTTP rebuild, component update or customer project republishing is required.

The combined Codex design/plan challenge and independent shape review ran before edits; this scope had no findings. #23 was unpublished. This correction does not modify the independently existing local master commit for abortable Binder requests.

Fresh independent implementation review cleared every changed file with no findings and reran the complete Node test suite. The overall host/native/deployment seam remains parent-owned.

An additional independent blindspot sweep across these rollback scopes found no findings; it did not rerun tests/builds.
