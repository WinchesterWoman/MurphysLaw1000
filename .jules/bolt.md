## 2026-03-31 - Cache Sync YAML File Parsing and Disk Read
**Learning:** Re-reading disk files (`fs.readFileSync`) and re-parsing YAML (`yaml.load`) on every invocation of static/rarely-changing data like voice profiles introduces unnecessary synchronous disk I/O and parsing overhead.
**Action:** Use in-memory memoization/caching for static or immutable voice profile configurations so repeated calls return instantly without disk access.
