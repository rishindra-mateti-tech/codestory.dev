# CodeStory.tools

> Every repository has a story. Learn how it works.

CodeStory is a local-first learning companion for unfamiliar GitHub repositories. Paste a public GitHub URL or choose a local folder, then learn through three connected views of the same source evidence: a story, a direct system map, and an expandable technical breakdown.

## Quick start

You need [Node.js 20 or newer](https://nodejs.org/) and Git. Run this once after cloning:

```bash
npm install
```

### Windows

Double-click **Start CodeStory.vbs**. It starts the local server and opens CodeStory in your browser at `http://localhost:4197`.

### macOS

In Finder, right-click **Start CodeStory.command**, choose **Open**, then approve it the first time macOS asks. It opens CodeStory in your browser at `http://localhost:4173`.

If macOS says the file is not executable, open Terminal in this folder once and run:

```bash
chmod +x "Start CodeStory.command"
```

### Any operating system

Start it from a terminal:

```bash
npm start
```

Open `http://localhost:4173`, paste a public GitHub repository URL or select a local folder path, and choose **Create story**.

On macOS, this equivalent command also opens the browser automatically:

```bash
npm run start:mac
```

To study the current folder from a terminal:

```bash
node cli.js learn .
```

## What CodeStory v1 does

- safely reads a local folder or shallow-clones a public GitHub repository
- skips `.git`, dependencies, generated output, secrets, and other noisy folders
- finds the stack from package/requirements files
- maps folders, imports, files, and likely functions
- detects common framework conventions and labels them as source evidence, not runtime proof
- builds an Endpoint Map from explicit Next.js, Express, FastAPI, and Flask route declarations, and can connect a static client request to an exact local endpoint definition
- follows an exact endpoint's own local imports into service or data code when source evidence supports that continuation
- builds a Data Contract Map from explicit TypeScript shapes, Zod schemas, Pydantic models, Prisma models, SQL tables, and literal JSON response objects
- maps visible UI elements to component context, imports, event handlers, static classes, and matching CSS selectors when available
- provides Feature Trace and Change Impact views for studying a flow and reviewing the local code that may be affected by an edit
- generates a source-cited `CODE_STORY.md`
- generates a time-boxed `STUDY_PLAN.md` for local repositories
- offers Story, Direct, Detailed, and Ask modes
- lets a learner click the same technology, component, or function and switch between Story, Direct, and Detailed explanations
- includes a local Concept Library for common tools such as Node.js, SQL, React, databases, APIs, and authentication
- keeps the library's general explanation separate from direct evidence found in the repository being studied
- discovers repository-specific packages, notebook libraries, and resolved local modules beyond the bundled reference pack
- labels static call references honestly instead of presenting them as runtime telemetry
- detects version-like folders and surfaces them instead of silently merging project variants
- recognizes application, CLI, notebook, general-code, and documentation/reference repositories so it does not pretend every repository has a browser UI or API
- prioritizes likely entry points, routes, source folders, and schema files when a large repository reaches the source-file reading limit

## Local-first by design

CodeStory does not run dependency installers, project scripts, Docker, or code from repositories it studies. V1 uses deterministic local analysis, so it needs no API key. An optional Ollama or API provider can deepen natural-language explanations while keeping repositories local.

## Optional explanation engines

- **Static analysis** works immediately, without any model or key.
- **Gemini API** accepts a key for the current local session only. CodeStory does not write it to a file, database, or generated study guide. Create and restrict a key in [Google AI Studio](https://aistudio.google.com/app/apikey).
- **Ollama** keeps model inference on the user's computer. Install Ollama, download a coding model such as `qwen2.5-coder:7b`, then choose Local Ollama in CodeStory.

CodeStory does not bundle model weights inside the Git repository: models are large downloads and the right choice depends on each user's hardware. The in-app setup wizard explains and downloads an approved model only after the user explicitly confirms it.

## Concept Library

The bundled starter pack lives at `data/concept-library.json`. It works with no model and no API key. Search a term in the in-app **Concept Library** to see a standard explanation, plain-language explanation, typical uses, a small syntax example, connections, alternatives, and practical cautions.

When a repository is open, CodeStory independently scans its code and `package.json` for direct references to that concept. The result is labeled **Observed in this repository**, **Not directly detected**, or **Repository comparison unavailable**. A library definition is never treated as proof that a scanned repository uses a tool.

The library also has a **Detected in this repository** section. It reads dependency manifests such as `package.json`, `requirements.txt`, `pyproject.toml`, `Cargo.toml`, `go.mod`, and `composer.json`, plus observed imports and resolved local modules. This is not limited to the starter pack. For an unknown package, CodeStory shows its exact source evidence and says that a general guide is not bundled yet instead of guessing what the tool does.

## Development

```bash
npm run check
npm test
npm start
```

## Demo

Use [DEMO.md](DEMO.md) for the 90-second Buildweek demo and the precise claims that are safe to make about CodeStory.

For the complete product behavior, evidence rules, architecture, and limitations, read the [Product & Architecture Guide](docs/PRODUCT_AND_ARCHITECTURE.md). For the v1 definition of done and validation record, read [V1 Release Notes](docs/V1_RELEASE.md).

## License

MIT
