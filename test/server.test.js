import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
let server;
let baseUrl;
let fixture;
let pythonCliFixture;
let notebookFixture;
let referenceFixture;

function createSimplePdf(text) {
  const stream = `BT\n/F1 12 Tf\n72 720 Td\n(${text}) Tj\nET\n`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}endstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => { offsets.push(Buffer.byteLength(pdf)); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const start = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`;
  return pdf;
}

test('exports Vercel-compatible request handlers without starting a local listener', async () => {
  const probe = spawn(process.execPath, ['--input-type=module', '--eval', "process.env.VERCEL = '1'; const serverModule = await import('./server.js'); const apiModule = await import('./api/index.js'); if (typeof serverModule.default !== 'function' || typeof apiModule.default !== 'function') process.exit(1); console.log('serverless exports ready');"], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
  const result = await new Promise(resolve => {
    let output = '';
    probe.stdout.on('data', chunk => { output += chunk; });
    probe.stderr.on('data', chunk => { output += chunk; });
    probe.on('close', code => resolve({ code, output }));
  });
  assert.equal(result.code, 0, result.output);
  assert.match(result.output, /serverless exports ready/);
});

async function request(route, options = {}) {
  const response = await fetch(`${baseUrl}${route}`, options);
  const type = response.headers.get('content-type') || '';
  const body = type.includes('application/json') ? await response.json() : await response.text();
  return { response, body };
}

before(async () => {
  fixture = await mkdtemp(path.join(os.tmpdir(), 'codestory-test-'));
  await mkdir(path.join(fixture, 'src', 'api'), { recursive: true });
  await mkdir(path.join(fixture, 'src', 'data'), { recursive: true });
  await mkdir(path.join(fixture, 'app', 'dashboard'), { recursive: true });
  await mkdir(path.join(fixture, 'app', 'api', 'greeting'), { recursive: true });
  await mkdir(path.join(fixture, 'api'), { recursive: true });
  await mkdir(path.join(fixture, 'db'), { recursive: true });
  await mkdir(path.join(fixture, 'src', 'services'), { recursive: true });
  await mkdir(path.join(fixture, 'prisma'), { recursive: true });
  await mkdir(path.join(fixture, 'docs'), { recursive: true });
  await writeFile(path.join(fixture, 'README.md'), '# Sample Hotel\n\nA small example application where visitors use a web screen to ask an API for a welcome message.');
  await writeFile(path.join(fixture, 'package.json'), JSON.stringify({ name: 'sample-hotel', dependencies: { react: '^19.0.0', '@supabase/supabase-js': '^2.0.0' } }));
  await writeFile(path.join(fixture, 'src', 'app.tsx'), "import { getWelcome } from './api/welcome.js';\nimport './styles.css';\nexport function App() { return <main className=\"hotel\"><button className=\"welcome-button px-4\" onClick={() => getWelcome('Ada')}>Enter hotel</button></main>; }\n");
  await writeFile(path.join(fixture, 'src', 'styles.css'), ".hotel { padding: 1rem; }\n.welcome-button { color: white; background: seagreen; }\n");
  await writeFile(path.join(fixture, 'src', 'middleware.ts'), "export function middleware(request) { return request; }\n");
  await writeFile(path.join(fixture, 'src', 'api', 'visits.js'), "export function recordVisit() { return { ok: true }; }\n");
  await writeFile(path.join(fixture, 'src', 'api', 'welcome.js'), "import { saveVisit } from '../data/database.js';\nexport function getWelcome(name) { fetch('/api/visits'); saveVisit(name); return `Welcome ${name}`; }\n");
  await writeFile(path.join(fixture, 'src', 'api', 'greeting-client.js'), "export function fetchGreeting() { return fetch('/api/greeting'); }\n");
  await writeFile(path.join(fixture, 'src', 'contracts.ts'), "export interface GreetingRequest {\n  name: string;\n  locale?: string;\n}\n\nexport const GreetingResponseSchema = z.object({\n  message: z.string(),\n  visitId: z.string()\n});\n");
  await writeFile(path.join(fixture, 'src', 'data', 'database.js'), ["import { createClient } from ", "'@supabase/supabase-js';\nexport function saveVisit(name) { return name; }\n"].join(''));
  await writeFile(path.join(fixture, 'src', 'services', 'greeting.js'), "import { saveVisit } from '../data/database.js';\nexport function createGreeting() { saveVisit('greeting'); return { ok: true }; }\n");
  await writeFile(path.join(fixture, 'app', 'dashboard', 'page.tsx'), "'use client';\nimport { useState } from 'react';\nexport default function Dashboard() { const [count, setCount] = useState(0); return <button onClick={() => setCount(count + 1)}>{count}</button>; }\n");
  await writeFile(path.join(fixture, 'app', 'api', 'greeting', 'route.ts'), "import { createGreeting } from '../../../src/services/greeting.js';\nexport async function GET() { return Response.json(createGreeting()); }\n");
  await writeFile(path.join(fixture, 'api', 'server.ts'), "import express from 'express';\nconst app = express();\napp.use((request, response, next) => next());\napp.get('/health', (request, res) => res.json({ ok: true, version: '1' }));\n");
  await writeFile(path.join(fixture, 'api', 'main.py'), "from fastapi import FastAPI\napp = FastAPI()\n@app.get('/status')\ndef status():\n  return {'ok': True}\n");
  await writeFile(path.join(fixture, 'api', 'models.py'), "from pydantic import BaseModel\n\nclass GreetingPayload(BaseModel):\n  name: str\n  locale: str | None = None\n");
  await writeFile(path.join(fixture, 'db', 'client.ts'), "import { PrismaClient } from '@prisma/client';\nexport const prisma = new PrismaClient();\n");
  await writeFile(path.join(fixture, 'prisma', 'schema.prisma'), "model Visit {\n  id String @id\n  name String\n  locale String?\n}\n");
  await writeFile(path.join(fixture, 'db', 'schema.sql'), "CREATE TABLE visits (\n  id TEXT PRIMARY KEY,\n  name TEXT NOT NULL,\n  locale TEXT\n);\n");
  await writeFile(path.join(fixture, 'demo.ipynb'), JSON.stringify({ cells: [{ cell_type: 'code', source: ["import gradio as gr\n", "def greet(name):\n", "  return f'Hi {name}'\n", "with gr.Blocks() as demo:\n", "  name = gr.Textbox()\n", "  send = gr.Button('Send')\n"] }] }));
  await writeFile(path.join(fixture, 'docs', 'architecture-notes.md'), '# Unverified notes\n\nThis document is context, not proof.');
  await writeFile(path.join(fixture, 'architecture.png'), 'not a real image, only a fixture');
  await writeFile(path.join(fixture, 'research.pdf'), createSimplePdf('Research paper context only'));

  pythonCliFixture = await mkdtemp(path.join(os.tmpdir(), 'codestory-cli-test-'));
  await writeFile(path.join(pythonCliFixture, 'requirements.txt'), 'typer==0.12.3\nrich>=13.0\n');
  await writeFile(path.join(pythonCliFixture, 'main.py'), "import typer\nfrom rich.console import Console\n\napp = typer.Typer()\nconsole = Console()\n\n@app.command()\ndef greet(name: str):\n  console.print(f'Hello {name}')\n\nif __name__ == '__main__':\n  app()\n");

  notebookFixture = await mkdtemp(path.join(os.tmpdir(), 'codestory-notebook-test-'));
  await writeFile(path.join(notebookFixture, 'analysis.ipynb'), JSON.stringify({ cells: [{ cell_type: 'code', source: ["import pandas as pd\n", "import matplotlib.pyplot as plt\n", "data = pd.DataFrame({'score': [1, 2]})\n", "plt.plot(data['score'])\n"] }] }));

  referenceFixture = await mkdtemp(path.join(os.tmpdir(), 'codestory-reference-test-'));
  await mkdir(path.join(referenceFixture, 'docs'), { recursive: true });
  await mkdir(path.join(referenceFixture, 'scripts'), { recursive: true });
  await writeFile(path.join(referenceFixture, 'README.md'), '# Portfolio collection\n\nA curated list of portfolio references.');
  await writeFile(path.join(referenceFixture, 'docs', 'contributing.md'), '# Contributing\n\nAdd one verified resource at a time.');
  await writeFile(path.join(referenceFixture, 'docs', 'sources.md'), '# Sources\n\nThese links are context, not implementation evidence.');
  await writeFile(path.join(referenceFixture, 'scripts', 'build-index.js'), "export function buildIndex(items) { return items.filter(Boolean); }\n");

  server = spawn(process.execPath, ['server.js'], { cwd: root, env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
  const output = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Server did not start')), 5000);
    server.stdout.on('data', data => {
      const value = data.toString();
      const match = value.match(/http:\/\/localhost:(\d+)/);
      if (match) { clearTimeout(timer); resolve(match[1]); }
    });
    server.once('error', reject);
  });
  baseUrl = `http://127.0.0.1:${output}`;
});

after(async () => {
  server?.kill();
  await rm(fixture, { recursive: true, force: true });
  await rm(pythonCliFixture, { recursive: true, force: true });
  await rm(notebookFixture, { recursive: true, force: true });
  await rm(referenceFixture, { recursive: true, force: true });
});

test('serves the local-first setup screen', async () => {
  const { response, body } = await request('/');
  assert.equal(response.status, 200);
  assert.match(body, /Recommended: private local AI/);
  assert.match(body, /Bring an API key/);
  assert.match(body, /Feature trace/);
  assert.match(body, /Change impact/);
});

test('rejects an invalid repository target', async () => {
  const { response, body } = await request('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target: 'https://example.com/not-a-github-repo', settings: { provider: 'static' } }) });
  assert.equal(response.status, 400);
  assert.match(body.error, /public https:\/\/github\.com/i);
});

test('treats documentation-heavy collections as a repository type, not a missing web application', async () => {
  const { response, body } = await request('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target: referenceFixture, settings: { provider: 'static' } }) });
  assert.equal(response.status, 200);
  assert.equal(body.profile.kind, 'reference');
  assert.equal(body.anatomy.endpoints.length, 0);
  assert.equal(body.anatomy.ui.length, 0);
  assert.match(body.learning.overview, /reference or collection repository/i);
});

test('creates a source-grounded learning pack for a local repository', async () => {
  const { response, body } = await request('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target: fixture, settings: { provider: 'static' } }) });
  assert.equal(response.status, 200);
  assert.equal(body.displayName, 'Sample Hotel');
  assert.ok(body.sessionId);
  assert.ok(body.learning.layers.length > 0);
  assert.ok(body.learning.components.length > 0);
  assert.ok(body.learning.functions.some(item => item.term === 'getWelcome'));
  assert.ok(body.anatomy.layers.some(layer => layer.name === 'Frontend & user experience'));
  assert.ok(body.anatomy.layers.some(layer => layer.name === 'Middleware & guardrails'));
  assert.ok(body.anatomy.databases.some(item => item.name === 'Supabase'));
  assert.ok(body.anatomy.frameworks.some(signal => signal.name === 'Next.js page' && signal.path === 'app/dashboard/page.tsx'));
  assert.ok(body.anatomy.frameworks.some(signal => signal.name === 'Next.js route handler' && signal.path === 'app/api/greeting/route.ts'));
  assert.ok(body.anatomy.frameworks.some(signal => signal.name === 'Express endpoint' && signal.path === 'api/server.ts'));
  assert.ok(body.anatomy.frameworks.some(signal => signal.name === 'FastAPI endpoint' && signal.path === 'api/main.py'));
  assert.ok(body.anatomy.frameworks.some(signal => signal.name === 'Prisma client' && signal.path === 'db/client.ts'));
  assert.ok(body.anatomy.endpoints.some(endpoint => endpoint.framework === 'Next.js' && endpoint.method === 'GET' && endpoint.route === '/api/greeting' && endpoint.path === 'app/api/greeting/route.ts'));
  assert.ok(body.anatomy.endpoints.some(endpoint => endpoint.framework === 'Express' && endpoint.method === 'GET' && endpoint.route === '/health' && endpoint.path === 'api/server.ts'));
  assert.ok(body.anatomy.endpoints.some(endpoint => endpoint.framework === 'FastAPI' && endpoint.method === 'GET' && endpoint.route === '/status' && endpoint.path === 'api/main.py'));
  assert.ok(body.anatomy.contracts.some(contract => contract.kind === 'TypeScript interface' && contract.name === 'GreetingRequest' && contract.fields.some(field => field.name === 'name') && contract.fields.some(field => field.name === 'locale' && field.optional)));
  assert.ok(body.anatomy.contracts.some(contract => contract.kind === 'Zod schema' && contract.name === 'GreetingResponseSchema' && contract.fields.some(field => field.name === 'message')));
  assert.ok(body.anatomy.contracts.some(contract => contract.kind === 'Prisma model' && contract.name === 'Visit' && contract.fields.some(field => field.name === 'id')));
  assert.ok(body.anatomy.contracts.some(contract => contract.kind === 'SQL table' && contract.name === 'visits' && contract.fields.some(field => field.name === 'name')));
  assert.ok(body.anatomy.contracts.some(contract => contract.kind === 'Pydantic model' && contract.name === 'GreetingPayload' && contract.fields.some(field => field.name === 'name')));
  assert.ok(body.anatomy.contracts.some(contract => contract.kind === 'JSON response object' && contract.fields.some(field => field.name === 'ok') && contract.fields.some(field => field.name === 'version')));
  assert.ok(body.anatomy.frameworks.every(signal => signal.path && signal.line > 0 && signal.description));
  assert.ok(body.anatomy.ui.some(item => item.tag === 'button' && item.path === 'src/app.tsx' && item.handlers.some(action => action.event === 'onClick' && action.name === 'getWelcome')));
  const welcomeButton = body.anatomy.ui.find(item => item.tag === 'button' && item.path === 'src/app.tsx');
  assert.deepEqual(welcomeButton.classTokens, ['welcome-button', 'px-4']);
  assert.ok(welcomeButton.styleRules.some(rule => rule.name === 'welcome-button' && rule.path === 'src/styles.css'));
  assert.equal(welcomeButton.owner.name, 'App');
  const welcomeDependency = welcomeButton.dependencies.find(dependency => dependency.specifier === './api/welcome.js');
  assert.equal(welcomeDependency.target, 'src/api/welcome.js');
  assert.deepEqual(welcomeDependency.bindings, ['getWelcome']);
  assert.deepEqual(welcomeDependency.usedBindings, ['getWelcome']);
  const styleDependency = welcomeButton.dependencies.find(dependency => dependency.specifier === './styles.css');
  assert.equal(styleDependency.target, 'src/styles.css');
  assert.equal(styleDependency.sideEffect, true);
  const welcomeFunction = body.functions.find(fn => fn.name === 'getWelcome' && fn.path === 'src/api/welcome.js');
  assert.equal(welcomeFunction.staticCalls, 1);
  assert.deepEqual(welcomeFunction.callSites, [{ path: 'src/app.tsx', line: 3, certainty: 'Imported local binding' }]);
  assert.match(welcomeFunction.callSiteNote, /local import that resolves to this exact file/i);
  assert.ok(body.anatomy.connections.some(item => item.from === 'src/app.tsx' && item.to === 'src/api/welcome.js' && item.line === 1));
  assert.ok(body.traces.length > 0);
  const buttonTrace = body.traces.find(trace => trace.type === 'UI element' && trace.start.path === 'src/app.tsx' && trace.start.label === 'button');
  assert.ok(buttonTrace, 'The visible button should expose a source-backed feature trace.');
  assert.ok(buttonTrace.steps.some(step => step.kind === 'Observed UI action' && step.path === 'src/api/welcome.js' && step.certainty === 'Observed call'));
  assert.ok(buttonTrace.steps.some(step => step.path === 'src/data/database.js' && step.certainty === 'Observed import'));
  assert.ok(buttonTrace.steps.some(step => step.kind === 'API route candidate' && step.path === 'src/api/visits.js' && step.certainty === 'Route match inferred'));
  const greetingTrace = body.traces.find(trace => trace.type === 'Function' && trace.start.path === 'src/api/greeting-client.js' && trace.start.label.includes('fetchGreeting'));
  assert.ok(greetingTrace, 'The greeting client function should expose a trace.');
  assert.ok(greetingTrace.steps.some(step => step.kind === 'Observed endpoint match' && step.path === 'app/api/greeting/route.ts' && step.certainty === 'Observed request + endpoint'));
  assert.ok(greetingTrace.steps.some(step => step.kind === 'Endpoint implementation' && step.path === 'src/services/greeting.js' && step.certainty === 'Observed import'));
  assert.ok(greetingTrace.steps.some(step => step.path === 'src/data/database.js' && step.certainty === 'Observed import'));
  assert.ok(buttonTrace.steps.some(step => step.kind === 'External boundary' && step.certainty === 'Observed dependency'));
  assert.ok(buttonTrace.steps.every(step => step.evidence.length > 0));
  assert.ok(buttonTrace.frameworkEvidence.some(signal => signal.name === 'React component module' && signal.path === 'src/app.tsx'));
  assert.ok(buttonTrace.limits.some(limit => /not a recorded runtime session/i.test(limit)));
  assert.ok(body.impacts.length > 0);
  const buttonImpact = body.impacts.find(impact => impact.type === 'UI element' && impact.start.path === 'src/app.tsx' && impact.start.label === 'button');
  assert.ok(buttonImpact, 'The visible button should expose a source-backed change review.');
  assert.ok(buttonImpact.sections.some(section => section.title === 'Observed styling rules' && section.items.some(item => item.title === '.welcome-button')));
  assert.ok(buttonImpact.sections.some(section => section.title === 'Observed UI action' && section.items.some(item => /getWelcome/.test(item.title))));
  assert.ok(buttonImpact.sections.some(section => section.title === 'Direct local module dependencies' && section.items.some(item => item.title === 'src/api/welcome.js')));
  assert.ok(buttonImpact.limits.every(limit => /static|source-only|Dynamic/i.test(limit)));
  assert.ok(body.traceLessons.length > 0);
  const buttonLesson = body.traceLessons.find(lesson => lesson.id === buttonTrace.id);
  assert.ok(buttonLesson, 'Every trace should have a matching guided lesson.');
  assert.ok(buttonLesson.steps.some(step => step.kind === 'Observed UI action'));
  assert.ok(buttonLesson.questions.length >= 3);
  assert.ok(buttonLesson.questions.every(question => !Object.hasOwn(question, 'answer')));
  assert.ok(body.anatomy.ui.some(item => item.tag === 'Gradio Button' && item.path === 'demo.ipynb'));
  assert.ok(body.anatomy.layers.some(layer => layer.name === 'Frontend & user experience' && layer.files.some(file => file.path === 'demo.ipynb')));
  assert.ok(body.materials.some(item => item.path === 'README.md' && item.trust === 'context to verify'));
  assert.ok(body.materials.some(item => item.path === 'architecture.png' && item.trust === 'unverified visual'));
  assert.ok(body.materials.some(item => item.path === 'research.pdf' && item.readable && /Extracted text/.test(item.extraction)));
  assert.ok(body.buildPlan.steps.length >= 5);
  assert.ok(body.codeLab.chapters.length >= 4);
  assert.ok(body.codeLab.lessons.length >= 8);
  assert.equal(body.codeLab.lessons.length, body.codeLab.chapters.flatMap(chapter => chapter.topics).length);
  assert.ok(body.codeLab.chapters.every(chapter => chapter.topics.length > 0));
  assert.ok(body.codeLab.lessons.every(lesson => lesson.chapterId && lesson.runCases.length >= 3));
  assert.ok(body.codeLab.chapters.some(chapter => chapter.id === 'logic' && chapter.topics.some(topic => topic.title.includes('getWelcome'))));
  assert.ok(body.codeLab.chapters.some(chapter => chapter.id === 'data' && chapter.topics.length >= 2));
  assert.match(body.codeLab.safety, /never executes the original repository/i);
  assert.ok(body.challenges.length >= 3);
  assert.ok(body.challenges.every(challenge => !Object.hasOwn(challenge, 'answer')));
  const story = await readFile(path.join(fixture, '.codestory', 'CODE_STORY.md'), 'utf8');
  assert.match(story, /The Story of Sample Hotel/);
  assert.match(body.studyPlanPath, /STUDY_PLAN\.md$/);
  const studyPlan = await readFile(path.join(fixture, '.codestory', 'STUDY_PLAN.md'), 'utf8');
  assert.match(studyPlan, /Study Plan: Sample Hotel/);
  assert.match(studyPlan, /Feature Trace/);
  assert.match(studyPlan, /Change Impact/);
  globalThis.analysis = body;
});

test('answers and explains concepts without an API key', async () => {
  const analysis = globalThis.analysis;
  const chat = await request('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: analysis.sessionId, question: 'What is this project built for?', settings: { provider: 'static' } }) });
  assert.equal(chat.response.status, 200);
  assert.match(chat.body.answer, /small example application/i);
  const concept = analysis.learning.functions.find(item => item.term === 'getWelcome');
  const detail = await request('/api/concept', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: analysis.sessionId, conceptId: concept.id, settings: { provider: 'static' } }) });
  assert.equal(detail.response.status, 200);
  assert.match(detail.body.detailed, /getWelcome/);
  assert.ok(detail.body.realUse);
});

test('verifies a trace lesson on the server without exposing its answer in the analysis payload', async () => {
  const analysis = globalThis.analysis;
  const lesson = analysis.traceLessons.find(item => item.steps.some(step => step.kind === 'Observed UI action'));
  assert.ok(lesson);
  const question = lesson.questions[0];
  const verification = await request('/api/challenge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: analysis.sessionId, challengeId: question.id, answer: 'This is not one of the available answers.' }) });
  assert.equal(verification.response.status, 200);
  assert.equal(verification.body.correct, false);
  assert.ok(verification.body.correctAnswer);
  assert.ok(verification.body.evidence.length > 0);
});

test('returns a bounded, session-scoped source window for an observed line', async () => {
  const analysis = globalThis.analysis;
  const { response, body } = await request('/api/source', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: analysis.sessionId, path: 'src/app.tsx', line: 3 }) });
  assert.equal(response.status, 200);
  assert.equal(body.path, 'src/app.tsx');
  assert.ok(body.lines.some(item => item.number === 3 && item.text.includes('<button')));
  const missing = await request('/api/source', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: analysis.sessionId, path: '../outside.js', line: 1 }) });
  assert.equal(missing.response.status, 404);
});

test('searches the local Concept Library and keeps general knowledge separate from repository evidence', async () => {
  const analysis = globalThis.analysis;
  const node = await request(`/api/library?q=node&sessionId=${analysis.sessionId}`);
  assert.equal(node.response.status, 200);
  const nodeConcept = node.body.concepts.find(item => item.id === 'node-js');
  assert.ok(nodeConcept);
  assert.match(nodeConcept.simpleDefinition, /servers, command-line tools, and build scripts/i);
  assert.ok(nodeConcept.references.some(reference => /nodejs\.org/.test(reference.url)));
  assert.ok(['observed', 'not-detected'].includes(nodeConcept.repository.status));
  assert.ok(Array.isArray(nodeConcept.repository.evidence));

  const react = await request(`/api/library?q=react&sessionId=${analysis.sessionId}`);
  assert.equal(react.response.status, 200);
  const reactConcept = react.body.concepts.find(item => item.id === 'react');
  assert.ok(reactConcept);
  assert.equal(reactConcept.repository.status, 'observed');
  assert.ok(reactConcept.repository.evidence.some(location => location.startsWith('package.json:')));

  const sql = await request('/api/library?q=sql');
  assert.equal(sql.response.status, 200);
  assert.ok(sql.body.concepts.some(item => item.id === 'sql'));
  assert.equal(sql.body.concepts.find(item => item.id === 'sql').repository.status, 'no-repository');
});

test('discovers packages, notebook libraries, and local modules beyond the curated reference pack', async () => {
  const analysis = globalThis.analysis;
  assert.ok(analysis.discovery.some(item => item.name === '@supabase/supabase-js' && item.category === 'External package'));
  assert.ok(analysis.discovery.some(item => item.name === 'gradio' && item.category === 'External package'));
  assert.ok(analysis.discovery.some(item => item.name === 'src/api/welcome.js' && item.category === 'Local module'));
  assert.ok(analysis.discovery.every(item => /^(?:@?[A-Za-z0-9])/.test(item.name)), 'Discovery should exclude punctuation captured from code strings.');

  const library = await request(`/api/library?sessionId=${analysis.sessionId}`);
  assert.equal(library.response.status, 200);
  const supabase = library.body.discovery.concepts.find(item => item.name === '@supabase/supabase-js' && item.category === 'External package');
  assert.ok(supabase?.reference?.name === 'Supabase');
  assert.equal(library.body.discovery.concepts.filter(item => item.name === '@supabase/supabase-js').length, 1);
  const gradio = library.body.discovery.concepts.find(item => item.name === 'gradio');
  assert.equal(gradio.reference, null);
  assert.ok(gradio.evidence.some(location => location.startsWith('demo.ipynb:')));

  const cli = await request('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target: pythonCliFixture, settings: { provider: 'static' } }) });
  assert.equal(cli.response.status, 200);
  assert.ok(cli.body.discovery.some(item => item.name === 'typer' && item.category === 'External package'));
  assert.ok(cli.body.discovery.some(item => item.name === 'rich' && item.category === 'External package'));
  const cliLibrary = await request(`/api/library?q=typer&sessionId=${cli.body.sessionId}`);
  assert.equal(cliLibrary.response.status, 200);
  assert.ok(cliLibrary.body.discovery.concepts.some(item => item.name === 'typer' && item.evidence.some(location => location.startsWith('requirements.txt:'))));

  const notebook = await request('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target: notebookFixture, settings: { provider: 'static' } }) });
  assert.equal(notebook.response.status, 200);
  assert.ok(notebook.body.discovery.some(item => item.name === 'pandas' && item.category === 'External package'));
  assert.ok(notebook.body.discovery.some(item => item.name === 'matplotlib' && item.category === 'External package'));
});

test('reviews a CodeLab lesson without executing user-submitted code on the server', async () => {
  const analysis = globalThis.analysis;
  const lesson = analysis.codeLab.chapters.find(chapter => chapter.id === 'logic').topics[0];
  assert.equal(lesson.runCases.length, 3);
  const starter = await request('/api/codelab/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: analysis.sessionId, lessonId: lesson.id, code: lesson.starter }) });
  assert.equal(starter.response.status, 200);
  assert.equal(starter.body.state, 'starter');
  const missingEntry = await request('/api/codelab/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: analysis.sessionId, lessonId: lesson.id, code: 'throw new Error("this must not run")' }) });
  assert.equal(missingEntry.response.status, 200);
  assert.equal(missingEntry.body.state, 'needs-entry');
});

test('verifies a learning mission on the server instead of accepting a checkbox', async () => {
  const analysis = globalThis.analysis;
  const route = await request('/api/challenges', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: analysis.sessionId, scope: 'frontend', count: 20 }) });
  assert.equal(route.response.status, 200);
  assert.ok(route.body.recommended > 0 && route.body.recommended <= route.body.available);
  assert.ok(route.body.questions.length <= route.body.available);
  assert.ok(route.body.questions.every(item => item.options.length >= 3 && !Object.hasOwn(item, 'answer')));
  assert.ok(route.body.questions.every(item => item.lesson && item.kind && !/^where\s+is\b/i.test(item.prompt)), 'Learning missions should teach purpose and reasoning instead of asking for file locations.');
  const challenge = route.body.questions.find(item => item.kind === 'Understand the role' && item.prompt.includes('src/app.tsx'));
  assert.ok(challenge, 'The frontend route should include a source-grounded responsibility question about the React entry point.');
  const correct = await request('/api/challenge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: analysis.sessionId, challengeId: challenge.id, answer: 'It owns a user-facing screen or interaction.' }) });
  assert.equal(correct.response.status, 200);
  assert.equal(correct.body.correct, true);
  assert.equal(correct.body.correctAnswer, 'It owns a user-facing screen or interaction.');
  assert.ok(correct.body.score > 0);
  const wrong = await request('/api/challenge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: analysis.sessionId, challengeId: challenge.id, answer: 'It supports the product without owning the visible user flow.' }) });
  assert.equal(wrong.response.status, 200);
  assert.equal(wrong.body.correct, false);
  assert.equal(wrong.body.correctAnswer, 'It owns a user-facing screen or interaction.');
});

test('creates a separate contract learning route from explicit source-defined shapes', async () => {
  const analysis = globalThis.analysis;
  const route = await request('/api/challenges', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: analysis.sessionId, scope: 'contracts', count: 20 }) });
  assert.equal(route.response.status, 200);
  assert.ok(route.body.available >= 4);
  assert.ok(route.body.questions.every(item => item.kind === 'Understand the contract'));
  assert.ok(route.body.questions.some(item => item.prompt.includes('GreetingRequest')));
});

test('returns every available question when the learner requests the full route', async () => {
  const analysis = globalThis.analysis;
  const route = await request('/api/challenges', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: analysis.sessionId, scope: 'all', count: 9999 }) });
  assert.equal(route.response.status, 200);
  assert.equal(route.body.questions.length, route.body.available);
  assert.ok(route.body.questions.length >= analysis.challenges.length);
});

test('reports a separate question total and recommendation for each learning focus', async () => {
  const analysis = globalThis.analysis;
  const wholeProject = await request(`/api/challenges/meta?sessionId=${analysis.sessionId}&scope=all`);
  const frontend = await request(`/api/challenges/meta?sessionId=${analysis.sessionId}&scope=frontend`);
  assert.equal(wholeProject.response.status, 200);
  assert.equal(frontend.response.status, 200);
  assert.equal(wholeProject.body.scope, 'all');
  assert.equal(frontend.body.scope, 'frontend');
  assert.ok(frontend.body.available > 0 && frontend.body.available < wholeProject.body.available);
  assert.ok(frontend.body.recommended > 0 && frontend.body.recommended <= frontend.body.available);
  assert.notEqual(frontend.body.recommended, wholeProject.body.recommended);
});

test('falls back to static answers when an API key is unavailable', async () => {
  const analysis = globalThis.analysis;
  const { response, body } = await request('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: analysis.sessionId, question: 'Explain the architecture', settings: { provider: 'gemini', apiKey: '' } }) });
  assert.equal(response.status, 200);
  assert.match(body.confidence, /AI provider unavailable/i);
});

test('only permits approved explicit local-model downloads', async () => {
  const { response, body } = await request('/api/ollama/pull', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'not-a-model' }) });
  assert.equal(response.status, 400);
  assert.match(body.error, /recommended local models/i);
});
