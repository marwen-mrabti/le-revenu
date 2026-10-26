# NN — Feature name

Branch: `feature/short-name` · Target: `development` · Estimate: X h · Status: draft | approved | done

## 1. Goal

One paragraph. What the user can do after this is merged, and which lines of the brief it satisfies.

## 2. Scope

**In:** bullet list.
**Out:** bullet list, with the reason.

## 3. Acceptance criteria

Numbered, testable statements. Each one maps to at least one test or a manual check in section 8.

## 4. Mockups

### UI features

One HTML mockup file per screen, covering every state (default, loading, empty, error, mobile), under `docs/mockups/NN-short-name/`. Opened in the browser during review and linked here. A one-line ASCII sketch may summarise it.

```
┌──────────────────────────────────────────┐
│ Header                                   │
├──────────────────────────────────────────┤
│ …                                        │
└──────────────────────────────────────────┘
```

### Backend features

Entity table (field, type, constraints), API contract (method, path, auth, request body, responses with status codes and example JSON), sequence diagram for multi-step flows.

## 5. Design

Decisions that are not obvious from the master plan: file locations, component tree, data flow, cache tags, validation rules, error mapping. Reference ADRs where relevant.

## 6. Phases and steps

### Phase A — name (estimate)

1. Step, small enough for one commit.
2. Step.
   Exit: what must be true before Phase B starts.

### Phase B — name (estimate)

…

## 7. Tests

| Kind                     | File | Covers criterion |
| ------------------------ | ---- | ---------------- |
| unit / integration / e2e | path | #n               |

## 8. Manual verification

Checklist run before opening the PR (keyboard, mobile width, dark mode, empty state, error state, no console errors).

## 9. Risks and open questions

| Risk or question | Mitigation or decision needed |
| ---------------- | ----------------------------- |

## 10. Definition of done

- [ ] All acceptance criteria met
- [ ] Tests in section 7 green locally and in CI
- [ ] Manual checklist done
- [ ] Docs updated (README, ADR, this plan's status)
- [ ] PR opened against `development` with screenshots
