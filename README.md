# CodeStory.tools

> Every repository has a story. Learn how it works.

[![Live demo](https://img.shields.io/badge/Try%20it-Live%20Demo-0b745c?style=for-the-badge)](https://codestory-tools.vercel.app/)
[![License](https://img.shields.io/badge/license-MIT-0f172a?style=for-the-badge)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)

**CodeStory.tools** helps you understand an unfamiliar codebase end to end: its frontend, backend, APIs, data layer, UI elements, functions, imports, and the evidence connecting them.

It is built for students, developers, interview preparation, open-source contributors, and anyone who wants to go from _“I cloned this repository”_ to _“I can confidently explain how it works.”_

## Try it instantly

No installation is needed for public GitHub repositories.

1. Open **[codestory-tools.vercel.app](https://codestory-tools.vercel.app/)**
2. Paste a public GitHub repository URL.
3. Select **Create story**.
4. Explore the repository through architecture maps, source inspection, learning routes, CodeLab, and source-grounded questions.

> If CodeStory helps you understand a repository, consider giving this project a star. It helps more learners discover it.

[![Star CodeStory on GitHub](https://img.shields.io/badge/Star%20on-GitHub-181717?style=for-the-badge&logo=github)](https://github.com/rishindra-mateti-tech/codestory.dev)

---

## What CodeStory helps you learn

| Area | What you can understand |
|---|---|
| Architecture | Frontend, backend, API/request handling, middleware, data/persistence, and supporting code |
| Source connections | Imports, route declarations, client requests, service calls, schemas, and local module relationships |
| UI inspector | UI components, visible controls, event handlers, nearby imports, props, CSS classes, and matching selectors |
| Functions | What a function does, where it is defined, static references, nearby code, and its role in the flow |
| Data contracts | TypeScript types, Zod schemas, Pydantic models, Prisma models, SQL tables, and JSON response shapes |
| Repository learning | Story mode, direct technical mode, detailed mode, learning questions, and build-from-scratch guidance |
| CodeLab | A small, safe learning version of a repository flow—without executing the original repository |
| Change impact | The local files, imports, handlers, styles, and modules that may be affected before you change code |
| Concepts | Plain-language explanations for common technologies such as React, Node.js, SQL, APIs, authentication, and databases |

---

## Two ways to use CodeStory

| Your situation | Best option |
|---|---|
| You found a public GitHub repository and want to understand it quickly | Use the [hosted website](https://codestory-tools.vercel.app/) |
| You want to study a private repository or a folder on your computer | Run CodeStory locally |
| You want optional Ollama support for private, local AI explanations | Run CodeStory locally |
| You want to contribute or modify CodeStory itself | Clone this repository and run it locally |

---

# Run CodeStory locally

Running CodeStory locally lets you analyze folders on your own computer. Your source code stays on your machine.

## Requirements

- [Node.js 20 or newer](https://nodejs.org/)
- Git is optional, but recommended if you clone this repository

> Important: Run `npm install` only inside the CodeStory folder—the folder containing `package.json`.

If your terminal says it cannot find `package.json`, you are probably one folder too high. Open the `codestory.dev` folder first.

## Clone with Git

```bash
git clone https://github.com/rishindra-mateti-tech/codestory.dev.git
cd codestory.dev
npm install
npm start
```

Then open:

```text
http://localhost:4173
```

## Windows: Download ZIP

1. Open the [CodeStory GitHub repository](https://github.com/rishindra-mateti-tech/codestory.dev).
2. Select **Code** → **Download ZIP**.
3. Extract the ZIP file.
4. Open the extracted `codestory.dev` folder in File Explorer.
5. Confirm that you can see `package.json`.
6. Click the File Explorer address bar, type `cmd`, and press Enter.
7. Run:

```bat
npm install
npm start
```

8. Open [http://localhost:4173](http://localhost:4173).

After the first installation, Windows users can also double-click `Start CodeStory.vbs`.

## macOS

After cloning or extracting the project, open Terminal inside the `codestory.dev` folder and run:

```bash
npm install
chmod +x "Start CodeStory.command"
./Start\ CodeStory.command
```

Then open [http://localhost:4173](http://localhost:4173).

---

# Study a repository

## Public GitHub repository

Paste a public repository URL into CodeStory:

```text
https://github.com/owner/repository
```

Example:

```text
https://github.com/rishindra-mateti-tech/codestory.dev
```

## Local folder

When running CodeStory locally, paste the full path to the project folder:

```text
C:\Users\your-name\Desktop\my-project
```

or on macOS/Linux:

```text
/Users/your-name/Desktop/my-project
```

CodeStory reads source files safely. It does **not** run the project’s scripts, install its dependencies, run Docker, use its secrets, or contact its services.

---

# Learn in the right order

CodeStory is designed to help you learn a repository from zero to confidence.

| Step | Goal |
|---|---|
| 1. Overview | Understand what the repository is built to do and where to start |
| 2. Architecture | Identify frontend, backend, APIs, middleware, data, and supporting code |
| 3. UI & source inspector | See how screens, components, events, imports, and styles were built |
| 4. Learning route | Answer evidence-based questions in a useful order |
| 5. Build from scratch | Reconstruct a smaller version of the system and understand why each part exists |
| 6. Ask CodeStory | Ask source-grounded questions after mapping the repository |

## Learning modes

| Mode | Best for |
|---|---|
| Story mode | Understanding the project through an intuitive narrative |
| Direct mode | Seeing the real architecture without metaphors |
| Detailed mode | Inspecting components, functions, paths, code evidence, and connections |
| Learn & prove | Building confidence through source-backed questions |
| CodeLab | Practicing a smaller, safe version of a repository flow |

---

# API keys and local models

An API key is **not required** for the main CodeStory experience.

| Capability | Requires API key? |
|---|---:|
| Architecture map | No |
| Import and endpoint mapping | No |
| UI and source inspection | No |
| Function and contract discovery | No |
| Learning routes | No |
| CodeLab | No |
| Concept Library | No |
| Richer natural-language explanations | Optional |
| Local Ollama explanations | No cloud API key required |

## Optional AI explanations

You may optionally use:

- **Gemini API** for richer explanations
- **Ollama** for local inference on your own computer

CodeStory keeps optional API keys in the current session only. It does not write them into generated study guides or project files.

For Ollama, install Ollama and download a coding model such as:

```bash
ollama pull qwen2.5-coder:7b
```

Model downloads are intentionally not bundled with this repository because they are large and depend on your computer’s memory and hardware.

---

# Evidence-first by design

CodeStory separates what it can **prove from source code** from what it can only **suggest**.

| Evidence type | How CodeStory treats it |
|---|---|
| Code, imports, configuration, schemas, route declarations | Source-backed evidence |
| README files | Helpful context, not automatic proof |
| Architecture diagrams and screenshots | Context only until source code supports the claim |
| Static function references | A learning signal, not runtime telemetry |
| Dynamic runtime behavior | Clearly marked as unverified unless explicitly observed |

This prevents misleading explanations when a repository contains incomplete diagrams, old screenshots, generated code, academic artifacts, or unused files.

---

# Supported repository types

CodeStory adapts its learning experience for more than traditional web apps.

| Repository type | Examples |
|---|---|
| Web applications | React, Next.js, Vue, Svelte, Express, FastAPI, Flask |
| APIs and backend services | REST APIs, service layers, route handlers, schemas |
| CLI tools | Node.js, Python, Go, Rust command-line projects |
| Notebooks | Jupyter notebooks and notebook-based projects |
| Libraries and packages | Reusable SDKs, utilities, frameworks, and tools |
| Documentation/reference repositories | Repositories that do not have a browser UI or backend |

CodeStory does not assume every repository has a frontend, database, API, or deployable application.

---

# Safety and privacy

- CodeStory does not execute repositories it studies.
- CodeStory does not run dependency installers inside scanned repositories.
- CodeStory does not run Docker, shell scripts, or project services.
- The hosted website analyzes public GitHub repositories.
- For private repositories or local folders, run CodeStory locally.
- Local Ollama can keep model inference on your machine.

---

# Development

```bash
npm install
npm run check
npm test
npm start
```

## Quality checks

```bash
npm run check
npm test
npm audit --omit=dev --audit-level=high
```

---

# Documentation

Most users only need the live website or the local setup steps above.

These documents are for contributors, Buildweek judges, and developers who want implementation details:

| Document | Purpose |
|---|---|
| [DEMO.md](DEMO.md) | 90-second Buildweek demo flow and safe product claims |
| [Product & Architecture Guide](docs/PRODUCT_AND_ARCHITECTURE.md) | Product behavior, evidence rules, architecture, and known limitations |
| [V1 Release Notes](docs/V1_RELEASE.md) | v1 scope and release validation record |

---

# Contributing

Contributions, bug reports, feature ideas, and repository examples are welcome.

Before opening a pull request:

```bash
npm run check
npm test
```

If you find CodeStory useful, please consider starring the repository and sharing it with someone learning an unfamiliar codebase.

---

# License

[MIT](LICENSE)
