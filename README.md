# CodeStory.tools

> Every repository has a story. Learn how it works.

CodeStory is a local-first learning companion for unfamiliar GitHub repositories. Paste a public GitHub URL or choose a local folder, then learn through three connected views of the same source evidence: a story, a direct system map, and an expandable technical breakdown.

## Start here (normal users)

You need [Node.js 20 or newer](https://nodejs.org/). Git is only needed if you choose to clone the project instead of downloading it.

**Important:** run `npm install` only *inside the CodeStory folder* — the folder that contains `package.json`. If your terminal says it cannot find `package.json`, you are one folder too high (for example, `C:\Users\rishi`) and must open the CodeStory folder first.

### Windows — easiest method

1. On GitHub, click **Code** → **Download ZIP**. Extract the ZIP anywhere you like.
2. Open the extracted `codestory.dev` folder in File Explorer. You should see `package.json`, `server.js`, and `Start CodeStory.vbs`.
3. Click the File Explorer address bar, type `cmd`, and press Enter. This opens Command Prompt in the correct folder.
4. Run these two commands:

```bat
npm install
npm start
```

5. Open [http://localhost:4173](http://localhost:4173) in your browser.

After the first `npm install`, you can also double-click **Start CodeStory.vbs** to start it at [http://localhost:4197](http://localhost:4197).

### Clone with Git (Windows, macOS, or Linux)

```bash
git clone https://github.com/rishindra-mateti-tech/codestory.dev.git
cd codestory.dev
npm install
npm start
```

Then open [http://localhost:4173](http://localhost:4173).

### macOS

After cloning or downloading and extracting the project, open Terminal **inside the `codestory.dev` folder**, then run:

```bash
npm install
chmod +x "Start CodeStory.command"
./Start\ CodeStory.command
```

If macOS asks, choose **Open**. CodeStory opens in your browser at [http://localhost:4173](http://localhost:4173).

### What to do in CodeStory

Paste a public GitHub repository URL or enter a local folder path, choose **Create story**, then explore the architecture, UI/source inspector, learning route, CodeLab, and source-grounded chat.

### Do I need an API key?

No. Static analysis, architecture maps, contracts, traces, learning routes, and CodeLab work without an API key. An optional Gemini key or local Ollama model only gives richer natural-language explanations.

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

## For contributors and Buildweek judges

Most users do **not** need these files. They are only for contributors, demo presenters, and people who want implementation details:

- [DEMO.md](DEMO.md): 90-second Buildweek demo script.
- [Product & Architecture Guide](docs/PRODUCT_AND_ARCHITECTURE.md): evidence rules, implementation design, and limitations.
- [V1 Release Notes](docs/V1_RELEASE.md): v1 scope and validation record.

## License

MIT
