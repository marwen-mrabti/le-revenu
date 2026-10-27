# Feature plans

Every work branch starts with a plan in this folder, reviewed before any code is written. The plan is the first commit of the branch and is updated if the work deviates from it.

- One file per feature: `NN-short-name.md` (same short name as the branch).
- Use `TEMPLATE.md`. Every section is required; write "none" rather than deleting a section.
- UI features carry HTML mockups in `docs/mockups/NN-short-name/` (one file per screen, all states), linked from the plan and reviewed in the browser before code.
- Backend features carry the data model (entity table), the API contract (request and response examples with status codes) and a sequence diagram for any multi-step flow.
- Steps are small enough to map to commits. Each phase ends with a checkable exit criterion.

| #   | Plan                                                                                 | Branch                      | Status       |
| --- | ------------------------------------------------------------------------------------ | --------------------------- | ------------ |
| 01  | [i18n foundation](01-i18n-foundation.md)                                             | `feature/i18n-foundation`   | done, in PR  |
| 02  | [Strapi content types, permissions, seed, tests](02-cms-content-types.md)            | `feature/cms-content-types` | done, in PR  |
| 03  | [Discussion list](03-discussion-list.md)                                             | `feature/discussion-list`   | done, in PR  |
| 04  | [Authentication: sign-up, login, Google](04-auth.md)                                 | `feature/auth`              | done, merged |
| 05  | [Account: reset, confirmation, account page, Google profile, islands](05-account.md) | `feature/account`           | done, in PR  |
| 06  | [Discussion detail and replies](06-discussion-detail.md)                             | `feature/discussion-detail` | done, merged |
| 07  | [Create a discussion](07-discussion-create.md)                                       | `feature/discussion-create` | done, in PR  |
