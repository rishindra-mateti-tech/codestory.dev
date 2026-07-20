# CodeStory Product & Architecture Guide

## Purpose

CodeStory helps someone move from an unfamiliar repository to a source-backed explanation of how it is assembled. It is designed for students, contributors, reviewers, and developers studying public or local codebases.

The product does not claim that reading a repository automatically makes someone an expert. Instead, it creates an ordered study path, asks evidence-based questions, and shows the exact source locations a learner should inspect.

## User journey

1. Enter a public GitHub URL or local repository path.
2. CodeStory reads safe, supported source files without running the target project.
3. Start with the Overview and Architecture map.
4. Inspect UI, functions, styles, frameworks, and local imports.
5. Follow a Feature Trace for one observable flow.
6. Use Change Impact before editing a component or function.
7. Complete learning questions or CodeLab exercises to prove understanding.

## Main learning surfaces

| Surface | What it teaches | Evidence it uses |
| --- | --- | --- |
| Overview | Project purpose, inferred repository type, entry points, scope of the scan | README, manifest, files, source structure |
| Architecture | Frontend, API, middleware, backend, data, supporting areas, explicit endpoints, and data contracts | File paths, imports, recognized framework conventions, route declarations, schema/model/table definitions |
| UI & source inspector | How a visible element was made | JSX/HTML/Gradio/Streamlit source, handlers, imports, CSS selectors |
| Feature trace | A likely path from UI action to local code and request boundaries | UI expressions, matching local functions, resolved imports, request strings, exact local endpoint matches, and the endpoint's own local imports when available |
| Change impact | What to review before changing an element or function | Static imports, files importing a module, CSS selectors, observed handlers |
| Learn & prove | Whether the learner can explain why code exists | Server-verified questions tied to source facts |
| CodeLab | A small, safe reconstruction of a concept from the repository | A generated lesson only; never the original repository runtime |
| Concept Library | Standard explanations for common software concepts | Bundled references, kept separate from repository evidence |

## Source-evidence rules

CodeStory separates what it can prove from what it can only suggest.

- **Observed source**: an exact statement, import, function, UI element, CSS selector, or framework signature was found in a file.
- **Observed import/call/request**: a static source relationship was found.
- **Observed request + endpoint**: a static client request URL exactly matches an explicitly declared local route. This is still not proof that a real runtime request completed or that middleware/configuration did not alter it.
- **Endpoint implementation import**: an exact matched endpoint imports a local module. This shows static code structure beyond the boundary, not a recorded server execution path.
- **Observed contract definition**: a supported type, schema, model, table, or literal response shape is declared in source. It does not prove every runtime payload contains every displayed field.
- **Inferred route or convention**: a framework file convention or matching path suggests a study target, but is not a recorded runtime path.
- **Unverified context**: README text, diagrams, screenshots, PDFs, and research attachments can provide context but do not prove implementation.

The product never runs the repository being studied. It does not install its dependencies, run its scripts, start Docker, use its secrets, call its services, or write to its databases.

## Static analysis capabilities

### Repository inputs

- Local folders
- Public GitHub repositories, shallow-cloned into a temporary location
- JavaScript, TypeScript, Python, HTML, CSS, Vue, Svelte, SQL, Prisma schema, and Jupyter notebook source
- Dependency manifests including `package.json`, `requirements.txt`, `pyproject.toml`, `Cargo.toml`, `go.mod`, and `composer.json`

### Framework intelligence

CodeStory can recognize source conventions for:

- Next.js pages, layouts, client components, and route handlers
- React component modules and common hooks
- Express endpoints and middleware
- FastAPI and Flask routes/middleware
- Explicit endpoint declarations for Next.js route handlers, Express, FastAPI, and Flask, shown in the Endpoint Map
- Prisma, Supabase, and SQLAlchemy access points
- Gradio and Streamlit UI calls
- Jupyter notebook cells

These are source signatures, not proof that a deployment is running correctly.

### Data Contract Map

CodeStory can surface only explicitly declared shapes from:

- TypeScript `interface` and object `type` declarations
- Zod object schemas
- Pydantic `BaseModel` / `BaseSettings` classes
- Prisma `model` declarations
- SQL `CREATE TABLE` statements
- Literal `Response.json` / `res.json` response objects

The map lists named fields and the source location. It deliberately does not infer a request or response shape from a function name, route name, README, screenshot, or runtime convention.

### Repository profiles and large scans

CodeStory labels a repository as an application, CLI, notebook/research repository, documentation/reference collection, or general code repository when the available source supports that conclusion. This avoids presenting an architecture gap as a broken web application.

When the source-file safety limit is reached, likely routes, entry points, `src`/`app` code, schema files, and non-test files are prioritized before ordinary files. The UI labels the result as a source-grounded sample rather than a complete repository claim.

### UI construction intelligence

For supported UI source, CodeStory can show:

- Element tag and source line
- Static `class` / `className` tokens
- Matching selectors from scanned CSS files
- Utility-style class tokens without assuming a particular compiler
- Parent/nearest conventional component or function
- File-level local and external dependencies, including named imports that are statically referenced inside the enclosing component when CodeStory can verify that reference
- Side-effect imports such as stylesheet imports, labeled separately from named code dependencies
- An explicit warning that a file import is not necessarily used by every element
- Observable event handler expressions and a trace link when a local function can be resolved

### Change Impact map

Every supported UI element and conventional function can receive a static change review. It lists:

- The selected source location
- Matching CSS selectors for a UI element
- Resolved local imports from the containing file
- Files that statically import the selected source file
- Observable UI-to-function links
- External/configured dependencies

The map is a change checklist. It cannot prove dynamic imports, framework dispatch, dependency injection, generated code, environment configuration, external services, or complete runtime reachability.

### Function caller evidence

For conventional functions, CodeStory records exact static call sites when it can establish one of two safe conditions:

- the call is in the same source file, or
- the calling file imports the function name from the exact local module where it is defined.

This avoids inflating counts from unrelated functions with the same name. The displayed count is a source-study signal, not production runtime telemetry.

## Optional language models

Static analysis is available without an API key.

- A user may supply a supported API key for deeper explanation during the current local session.
- A user may choose a local Ollama model for on-device explanations.
- API keys are not written into the scanned repository, generated study guide, or a project database.
- Model output should elaborate on existing source evidence, not replace it.

## Generated local output

For a local folder, CodeStory writes a generated study guide to:

```text
.codestory/CODE_STORY.md
.codestory/STUDY_PLAN.md
```

`CODE_STORY.md` summarizes the project. `STUDY_PLAN.md` creates a source-backed, time-boxed learning route through orientation, architecture, a feature trace, UI/source inspection, change impact, and proof checkpoints. Both are learning artifacts and should be regenerated after major repository changes.

## Development and verification

```bash
npm install
npm run check
npm test
npm start
```

The automated suite covers source scanning, local import resolution, notebooks, materials, concept discovery, question verification, CodeLab safety, framework signals, endpoint maps, data contracts, UI style mapping, component dossiers, feature traces, change-impact records, and repository-profile behavior.

## V1 limitations

1. Parsing is intentionally lightweight and conservative; unusual syntax may be labeled as incomplete rather than guessed.
2. Function ownership is based on conventional static definitions and source order, not a full compiler AST.
3. CSS mapping currently covers static class selectors in scanned stylesheet files; dynamic styles and CSS-in-JS require future parsers.
4. Framework routing and runtime data flow remain explicit inferences unless a request and endpoint can be matched in source; even then, CodeStory does not claim the runtime completed successfully.
5. The Data Contract Map is intentionally declaration-based. Dynamic payload construction, generated schemas, ORM migrations, and runtime validation that lacks a supported static declaration may be shown as incomplete.
6. Future releases can add language-aware AST parsers, richer symbol resolution, more frameworks, collaboration, and optional sandboxed reproduction exercises without changing v1's safety boundary.
