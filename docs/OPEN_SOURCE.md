# Open-source research and reuse

Researched 2026-11-10 through GitHub repository metadata, official README/license files, selected source files and official SDK documentation. Do not imply a dependency is integrated just because it was researched.

| Project | What was inspected | What Kleos takes from it | License / reuse decision |
|---|---|---|---|
| [LearnHouse](https://github.com/learnhouse/learnhouse) | README and LICENSE on dev; assignments, context-aware AI, content authoring, analytics | Product reference for assignment/submission detail and contextual help; not installed | AGPL-3.0; no source copied. Its PostgreSQL/Redis/FastAPI stack is not embedded into the edge app |
| [Moodle](https://github.com/moodle/moodle) | README and license declaration | Reference for personalized learning environments and clear separation of learner/admin tasks | GPL-3.0; no code copied or runtime integration |
| [Oppia](https://github.com/oppia/oppia) | LICENSE; core/domain/skill_domain.py | Skills, prerequisite relations, misconceptions, rubric and skill-version concepts informed domain design | Apache-2.0; conceptual reference, no source copied |
| [Open edX](https://github.com/openedx/edx-platform) | README.rst (repository resolves to current Open edX platform) | Reference for authoring vs learning delivery separation and operational scope | AGPL-3.0; no code copied or runtime integration |
| [Shadcn Admin](https://github.com/satnaing/shadcn-admin) | README, MIT LICENSE, src/features/dashboard/index.tsx | Layout reference: persistent sidebar, page header/action hierarchy, task tabs, global search and responsive content areas | MIT; no source copied. Kleos uses original React/CSS rather than adopting unrelated sales analytics |
| [shadcn/ui](https://github.com/shadcn-ui/ui) | MIT license and component-system approach | Reference for consistent dialogs, controls and accessible focus states | MIT; not installed or copied |
| [React Flow / xyflow](https://github.com/xyflow/xyflow) | Repository and MIT LICENSE | Installed: keyboard-accessible interactive skill graph, nodes/edges, pan/zoom/controls | MIT dependency; license distributed with package |
| [Dagre](https://github.com/dagrejs/dagre) | Published package | Installed: dependency-graph layout | MIT dependency |
| [OpenAI Node](https://github.com/openai/openai-node) | Current official README: Responses, streaming, retries, timeout, abort | Installed: real server-side Responses calls, strict Zod text format, no client secrets | Apache-2.0 dependency; live credential not supplied |
| [Stripe Node](https://github.com/stripe/stripe-node) | Current official README: fetch transport, webhook raw body, test signature generation | Installed: test-first checkout/portal, verified webhook and canonical subscription retrieval | MIT dependency; merchant credentials not supplied |

Dependencies and exact installed versions are pinned by package-lock.json. Runtime code is original unless explicitly noted. Product reference does not imply endorsement or affiliation. No AGPL/GPL application code was transplanted.

Typography: DM Sans and Manrope, Google Fonts, SIL Open Font License 1.1; local copies and license files are under public/fonts. Logo: user-provided brand reference; the purple Canva rectangle was removed through an image-editing tool while retaining the purple brand flame.
