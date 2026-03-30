## Type Safety Checklist

- [ ] No new or surviving `any` types (`npx tsc --noEmit` passes cleanly)
- [ ] All new / edited ID fields use branded types (`UserId`, `OfferId`, etc.)
- [ ] All week/day structures use explicit `DayOfWeek` types with readonly slots
- [ ] No circular imports (`eslint-plugin-import/no-cycle`)
- [ ] `object` or `{}` are not used as types
- [ ] All arrays that are not explicitly mutable by design are `readonly`

## Testing & Build

- [ ] Local `npx tsc --noEmit` and smoke tests pass

---

**Important!**
PRs containing new `any` types or raw string ID fields are subject to a **request for changes**.
Every exception must be technically justified in the description below!
