# CodeStory demo script

## 90-second Buildweek demo

1. Open CodeStory and paste a public GitHub URL.
2. Select **Static analysis** and create a story. Explain that the first pass is safe: CodeStory reads source but never runs project code.
3. Open **Story mode**. Say: "Instead of handing learners a file tree, CodeStory teaches the repository as a system. The user walks into the visible product, requests travel through APIs and middleware, services do the work, and data layers preserve the result."
4. Click a technology or component. Switch between **Story**, **Direct**, and **Detailed** lenses in the same explainer. Point out that the learner never loses the meaning of the concept while changing learning styles.
5. Open **Direct mode**. Show the actual frontend, API, service, data, and middleware layers with source paths. Then open the Endpoint Map and Data Contract Map to show that routes and field shapes are extracted from code, not invented from a README.
6. Open **Feature trace**. Show a path from a UI action or function into a local request, an exact endpoint when available, and that endpoint's imported service or data module.
7. Open **Build from scratch -> CodeLab**. Run one small safe case and explain that this learner exercise never executes the original repository.
8. Return to the home screen, select **Gemini API** or **Local Ollama**, and explain that a user can improve narrative depth without CodeStory storing their key or requiring a hosted account.

## One-line pitch

CodeStory turns any GitHub repository into a source-grounded learning experience: architecture, UI, API, data contracts, guided proof, and a safe reconstruction lab.

## Important honesty points

- Static analysis does not execute untrusted projects.
- Static call references are not live production invocation counts.
- A matched request and endpoint are source evidence, not proof that a production request completed.
- Data Contract Map fields are declared shapes, not a guarantee that every runtime payload has every field.
- AI explanations are constrained by scanned evidence and should label uncertainty.
- User API keys are transient local request data and are never written by CodeStory.
