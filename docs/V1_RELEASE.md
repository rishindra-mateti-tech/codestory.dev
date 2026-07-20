# CodeStory v1 release record

## What v1 is for

CodeStory v1 helps a learner move from an unfamiliar repository to a source-backed explanation of its purpose, architecture, UI, functions, API boundaries, data shapes, and safe change surface. It is local-first and never executes the repository being studied.

## Definition of done

V1 is complete when a learner can:

1. Open a local folder or public GitHub repository.
2. See an honest repository profile instead of assuming every input is a web app.
3. Inspect architectural areas, imports, visible UI code, explicit endpoints, and data contracts with source locations.
4. Follow an evidence-backed path from a UI action or function through local code, a matched endpoint, and the endpoint's local imports when that structure is declared.
5. Learn by focused questions, source explanations, and a safe CodeLab reconstruction without the original project being executed.
6. Review static change impact before editing an element or function.

## Verification record

- Automated verification: syntax checks plus 16 regression tests.
- Repository shapes covered in tests: web application, Next.js route, Express, FastAPI, Flask, notebook/Gradio, Python CLI, Prisma, SQL, TypeScript, Zod, Pydantic, and a documentation-heavy reference collection.
- Manual public-repository scans: [Express](https://github.com/expressjs/express), [Flask](https://github.com/pallets/flask), and [Developer Portfolios](https://github.com/rishindra-mateti-tech/developer-portfolios).
- The scans produced source-backed architecture maps without running project code. Developer Portfolios was profiled as a command-line tool from its source signals, with no fabricated browser UI, API flow, or data contracts.

## Intentional boundaries

- Static evidence is not runtime telemetry.
- README files, diagrams, PDFs, and screenshots are context, not proof of implementation.
- API keys are session-only input for optional explanation providers and are not written to the scanned repository.
- CodeLab executes only a small learner-authored lesson in an isolated browser worker; it never starts the repository under study.

## After v1

Release work after this point is limited to bug fixes, usability feedback, Buildweek submission material, and documentation polish. Larger ideas such as AST parsers, more language support, shared learning history, cloud sync, and collaboration belong to a later release rather than delaying v1.
