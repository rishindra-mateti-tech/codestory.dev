const state = { analysis: null, lens: 'direct', buildMode: 'plan', codeLabChapterId: null, codeLabLessonId: null, codeLabRunCaseId: null, codeLabDrafts: {}, learningRoute: null, libraryQuery: '', traceId: null, traceLessonId: null, impactId: null };
const form = document.querySelector('#analyze-form');
const targetInput = document.querySelector('#target');
const formError = document.querySelector('#form-error');
const welcome = document.querySelector('#welcome');
const workspace = document.querySelector('#workspace');
const loading = document.querySelector('#loading');
const views = document.querySelector('#views');
const modal = document.querySelector('#concept-modal');
const sourceModal = document.querySelector('#source-modal');
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
const short = (value, length = 76) => value.length > length ? `${value.slice(0, length - 1)}...` : value;
const sourceLocation = (pathname, line) => `${pathname}:${line}`;

function settings() {
  const provider = document.querySelector('input[name="provider"]:checked')?.value || 'static';
  const model = provider === 'ollama' ? document.querySelector('#ollama-model').value.trim() : document.querySelector('#api-model').value.trim();
  return { provider, apiProvider: document.querySelector('#api-provider').value, apiKey: document.querySelector('#gemini-key').value.trim(), model, apiBase: document.querySelector('#api-base').value.trim(), ollamaUrl: 'http://localhost:11434' };
}
function activate(view) {
  document.querySelectorAll('.nav-item').forEach(button => button.classList.toggle('active', button.dataset.view === view));
  document.querySelectorAll('.view').forEach(section => section.classList.toggle('active', section.id === `${view}-view`));
}
function sourceButton(pathname, line = 1, label = sourceLocation(pathname, line)) { return `<button class="source-link" data-source-path="${esc(pathname)}" data-source-line="${line}">${esc(label)}</button>`; }
function wireSourceLinks(scope = document) { scope.querySelectorAll('[data-source-path]').forEach(button => button.addEventListener('click', () => openSource(button.dataset.sourcePath, Number(button.dataset.sourceLine)))); }
function traceButtonFor(pathname, line, label = 'Trace this feature', sourceLabel = '') {
  const trace = (state.analysis?.traces || []).find(item => item.start?.path === pathname && Number(item.start?.line) === Number(line) && (!sourceLabel || item.start?.label === sourceLabel));
  return trace ? `<button class="trace-link" data-trace="${esc(trace.id)}">${esc(label)}</button>` : '';
}
function wireTraceLinks(scope = document) {
  scope.querySelectorAll('[data-trace]').forEach(button => button.addEventListener('click', () => {
    state.traceId = button.dataset.trace;
    renderTrace(state.analysis);
    activate('trace');
  }));
}
function impactButtonFor(pathname, line, label = 'Review change impact', sourceLabel = '') {
  const impact = (state.analysis?.impacts || []).find(item => item.start?.path === pathname && Number(item.start?.line) === Number(line) && (!sourceLabel || item.start?.label === sourceLabel));
  return impact ? `<button class="impact-link" data-impact="${esc(impact.id)}">${esc(label)}</button>` : '';
}
function wireImpactLinks(scope = document) {
  scope.querySelectorAll('[data-impact]').forEach(button => button.addEventListener('click', () => {
    state.impactId = button.dataset.impact;
    renderImpact(state.analysis);
    activate('impact');
  }));
}
function allConcepts() { return state.analysis ? [...state.analysis.learning.technologies, ...state.analysis.learning.components, ...state.analysis.learning.functions] : []; }
function conceptButton(concept, label = concept?.term) { return concept ? `<button class="concept-link" data-concept="${esc(concept.id)}">${esc(label)}</button>` : esc(label); }
function wireConceptLinks(scope = document) { scope.querySelectorAll('[data-concept]').forEach(button => button.addEventListener('click', () => openConcept(button.dataset.concept))); }

function renderOverview(a) {
  const anatomy = a.anatomy;
  const scanNotice = a.scan?.truncated ? `<div class="ai-note">Large repository: CodeStory inspected ${a.scan.filesRead} files and read ${a.scan.sourceFilesRead} source files. Its map is source-grounded, but it does not claim to cover every file.</div>` : '';
  const profileNotice = a.profile?.note ? `<div class="ai-note"><strong>${esc(a.profile.label)}</strong><br>${esc(a.profile.note)}</div>` : '';
  const localStudyPack = a.studyPlanPath ? `<section class="detail-section"><h3>Your local study pack is ready</h3><p>CodeStory saved a story and a two-hour source-backed study plan inside the repository. You can read them later without reopening this browser session.</p><div class="evidence"><code>.codestory/CODE_STORY.md</code><code>.codestory/STUDY_PLAN.md</code></div></section>` : '';
  const metrics = [
    ['Architecture areas', anatomy.layers.length, 'Frontend, logic, data, and support'],
    ['Observed connections', anatomy.connections.length, 'Source imports resolved locally'],
    ['UI elements', anatomy.ui.length, 'Markup and notebook UI constructors'],
    ['Functions', a.functionCount, 'Definitions ranked for study']
  ];
  document.querySelector('#story-view').innerHTML = `<p class="page-kicker">Repository ownership map</p><span class="mode-badge">Evidence first</span><h2>Understand ${esc(a.displayName || a.name)} end to end</h2><p class="lead">${esc(a.summary)}</p>${profileNotice}${scanNotice}<div class="metric-grid">${metrics.map(([label, value, note]) => `<article class="metric-card"><strong>${value}</strong><span>${label}</span><small>${note}</small></article>`).join('')}</div><section class="detail-section"><h3>Start from a real boundary</h3><p>These likely entry points are inferred from file names and visible interface code. Open one and follow its evidence.</p><div class="evidence">${anatomy.entrypoints.slice(0, 6).map(item => sourceButton(item.path, item.line, `${item.layer}: ${item.path}`)).join('') || '<span>No conventional entry point was found. Start with the most connected file in Architecture.</span>'}</div></section>${localStudyPack}<section class="detail-section"><h3>How CodeStory treats evidence</h3><p>Code and configuration can prove relationships. README text, papers, diagrams, and screenshots provide context only until source supports their claims.</p><button class="primary-inline" data-go-materials>Review the evidence ledger</button></section>`;
  wireSourceLinks(document.querySelector('#story-view'));
  document.querySelector('[data-go-materials]')?.addEventListener('click', () => activate('materials'));
}

function renderArchitecture(a) {
  const anatomy = a.anatomy;
  const roleCountByFile = new Map();
  anatomy.layers.forEach(layer => layer.files.forEach(file => roleCountByFile.set(file.path, (roleCountByFile.get(file.path) || 0) + 1)));
  const mixedNotebook = [...roleCountByFile.entries()].some(([path, count]) => path.endsWith('.ipynb') && count > 1);
  const flow = anatomy.layers.slice(0, 6).map((layer, index) => `<div class="flow-node"><strong>${esc(layer.name)}</strong><span>${esc(layer.role)}</span><em>${layer.fileCount} mapped files</em></div>${!mixedNotebook && index < Math.min(anatomy.layers.length, 6) - 1 ? '<div class="flow-arrow">-></div>' : ''}`).join('');
  const layers = anatomy.layers.map(layer => `<article class="layer-card"><h3>${esc(layer.name)}</h3><p>${esc(layer.role)}</p><ul>${layer.files.map(file => `<li>${sourceButton(file.path, 1, file.path)} <small>${file.imports.length} imports, ${file.functions.length} functions</small></li>`).join('')}</ul></article>`).join('');
  const databases = anatomy.databases.length ? anatomy.databases.map(item => `<article class="layer-card"><h3>${esc(item.name)}</h3><p>Detected in source or configuration.</p><div class="evidence">${item.files.map(file => sourceButton(file, 1, file)).join('')}</div></article>`).join('') : '<div class="ai-note">No database technology was detected. It may be absent, external, or configured outside the scanned source.</div>';
  const frameworkEvidence = anatomy.frameworks?.length ? `<section class="detail-section framework-section"><h3>Framework conventions found in source</h3><p>These are recognizable source signatures with a cited location. They explain likely framework roles; they do not prove a live route, request, or database operation.</p><div class="framework-list">${anatomy.frameworks.map(signal => `<article><div><strong>${esc(signal.name)}</strong><span>${esc(signal.layer)}</span></div><p>${esc(signal.description)}</p>${sourceButton(signal.path, signal.line)}</article>`).join('')}</div></section>` : '<section class="detail-section"><h3>Framework conventions</h3><div class="ai-note">No supported framework convention was recognized from readable source. CodeStory will still show file roles, imports, and visible UI evidence.</div></section>';
  const endpointMap = anatomy.endpoints?.length ? `<section class="detail-section endpoint-section"><h3>Endpoint map</h3><p>These are explicit endpoint declarations found in code. A matching request may still pass through configuration or middleware at runtime.</p><div class="connection-list endpoint-list">${anatomy.endpoints.map(endpoint => `<div><code>${esc(endpoint.method)}</code><strong>${esc(endpoint.route)}</strong><span>${esc(endpoint.framework)}</span>${sourceButton(endpoint.path, endpoint.line)}</div>`).join('')}</div></section>` : '<section class="detail-section endpoint-section"><h3>Endpoint map</h3><div class="ai-note">No explicit supported route definition was found. CodeStory will still show request references and any filename-based study targets separately.</div></section>';
  const contractMap = anatomy.contracts?.length ? `<section class="detail-section contract-section"><h3>Data Contract Map</h3><p>These field names and shapes are explicitly declared in source. They are useful boundaries to study before changing a request, response, model, or table; they do not prove every field is populated at runtime.</p><div class="contract-list">${anatomy.contracts.map(contract => `<article><div><span>${esc(contract.kind)}</span>${sourceButton(contract.path, contract.line)}</div><h4>${esc(contract.name)}</h4><p>${contract.fields?.length ? contract.fields.map(field => `<code>${esc(field.name)}${field.optional ? '?' : ''}</code>`).join(' ') : 'No individual fields could be safely extracted from this declaration.'}</p></article>`).join('')}</div></section>` : '<section class="detail-section contract-section"><h3>Data Contract Map</h3><div class="ai-note">No supported explicit request, response, schema, model, or table definition was found. CodeStory will not invent a data shape from names alone.</div></section>';
  document.querySelector('#direct-view').innerHTML = `<p class="page-kicker">Architecture map</p><span class="mode-badge">Observed imports, explicit uncertainty</span><h2>How the pieces connect</h2><p class="lead">Files can play more than one role, especially notebooks. This map shows observable roles and resolves only links CodeStory can prove.</p>${mixedNotebook ? '<div class="ai-note">This notebook contains several roles in one file. These cards overlap; they are not a left-to-right request pipeline.</div>' : ''}<div class="architecture-flow ${mixedNotebook ? 'role-cluster' : ''}">${flow}</div><section class="detail-section"><h3>Architecture areas</h3><div class="layer-grid">${layers}</div></section>${frameworkEvidence}${endpointMap}${contractMap}<section class="detail-section"><h3>Data and persistence</h3><div class="layer-grid">${databases}</div></section><section class="detail-section"><h3>Exact source connections</h3><div class="connection-list">${anatomy.connections.slice(0, 70).map(item => `<div><span>${sourceButton(item.from, item.line)}</span><code>imports ${esc(item.specifier)}</code><span>${sourceButton(item.to, 1)}</span></div>`).join('') || '<p>No resolved local imports. This can happen with notebooks, generated code, dynamic imports, or unresolved aliases.</p>'}</div><p class="architecture-caption">${anatomy.notes.map(esc).join(' ')}</p></section>`;
  wireSourceLinks(document.querySelector('#direct-view'));
}

function uiStyleMarkup(item) {
  const classes = item.classTokens || [];
  const matchedRules = item.styleRules || [];
  if (matchedRules.length) {
    return `<p>Static classes: <code>${esc(classes.join(' ') || 'matched selector')}</code></p><div class="ui-style-evidence"><strong>Styling rules found</strong>${matchedRules.map(rule => sourceButton(rule.path, rule.line, `.${rule.name}`)).join('')}</div>`;
  }
  if (item.styling?.utilityTokens?.length) {
    return `<p>Utility-style classes: <code>${esc(item.styling.utilityTokens.join(' '))}</code>. They are written directly on this element; CodeStory does not assume which styling system compiles them.</p>`;
  }
  if (classes.length) return `<p>Static classes: <code>${esc(classes.join(' '))}</code>. No matching CSS selector was found in the scanned source.</p>`;
  return '<p>No static CSS class detected on this item.</p>';
}

function dependencyUsageMarkup(dependency) {
  if (dependency.sideEffect) return '<em class="dependency-side-effect">side-effect import</em>';
  if (dependency.usedBindings?.length) return `<em class="dependency-used">referenced here: ${esc(dependency.usedBindings.join(', '))}</em>`;
  if (dependency.bindings?.length) return `<em>not statically referenced by this component</em>`;
  return `<em>${esc(dependency.kind)}</em>`;
}

function uiComponentContextMarkup(item) {
  const owner = item.owner
    ? `<p><strong>Nearest component/function:</strong> ${sourceButton(item.path, item.owner.line, `${item.owner.name}(${item.owner.args})`)}</p>`
    : '<p><strong>Construction context:</strong> no conventional enclosing function was detected. This may be module-level UI code, a notebook cell, or a pattern CodeStory cannot statically identify.</p>';
  const dependencies = item.dependencies || [];
  const dependencyMarkup = dependencies.length
    ? `<div class="ui-dependency-list">${dependencies.map(dependency => `<div><span>${sourceButton(item.path, dependency.line, `imports ${dependency.specifier}`)}</span>${dependency.target ? sourceButton(dependency.target, 1, `local: ${dependency.target}`) : ''}${dependencyUsageMarkup(dependency)}</div>`).join('')}</div>`
    : '<p class="detail-meta">No direct imports were detected in this source file.</p>';
  return `<section class="ui-component-context"><strong>Component context</strong>${owner}<p class="detail-meta">These are direct dependencies of the containing source file. They may support this element, another element, or the surrounding component; inspect the cited import to verify the exact use.</p>${dependencyMarkup}</section>`;
}

function functionCallSitesMarkup(fn) {
  const sites = fn.callSites || [];
  if (!sites.length) return `<p class="detail-meta">No qualifying static call site was found. ${esc(fn.callSiteNote || 'This does not mean the function is never called at runtime.')}</p>`;
  return `<section class="function-call-sites"><strong>Observed static call sites</strong><div>${sites.map(site => `<span>${sourceButton(site.path, site.line, `${site.certainty}: ${site.path}:${site.line}`)}</span>`).join('')}</div><p>${esc(fn.callSiteNote || 'Static source evidence only; this is not runtime telemetry.')}</p></section>`;
}

function renderInspector(a) {
  const ui = a.anatomy.ui.slice(0, 120);
  document.querySelector('#detailed-view').innerHTML = `<p class="page-kicker">UI and source inspector</p><span class="mode-badge">Code, not screenshots</span><h2>See how the interface was built</h2><p class="lead">Each visible element is linked to its source, component context, direct dependencies, actions, and any matching styling rule CodeStory can prove. A screenshot is never used as proof of implementation.</p><section class="detail-section"><h3>Visible interface building blocks</h3><div class="inspector-grid">${ui.map(item => `<article class="inspect-card"><div><strong>${esc(item.tag)}</strong> ${sourceButton(item.path, item.line)}</div>${uiStyleMarkup(item)}${uiComponentContextMarkup(item)}<p class="detail-meta">Props: ${esc(item.props.join(', ') || 'not statically extracted')}${item.handlers?.length ? `<br>Observed action: ${esc(item.handlers.map(action => `${action.event} -> ${action.name}()`).join(', '))}` : ''}</p><div class="inspect-actions"><button class="snippet-link" data-source-path="${esc(item.path)}" data-source-line="${item.line}">Inspect nearby code</button>${traceButtonFor(item.path, item.line, 'Trace this feature', item.tag)}${impactButtonFor(item.path, item.line, 'Review change impact', item.tag)}</div></article>`).join('') || '<div class="ai-note">No browser or notebook UI constructors were detected. This may be a backend-only repository.</div>'}</div></section><section class="detail-section"><h3>Functions to learn next</h3><p>Ranked by observed static call sites. This is a study signal, not a claim about production runtime frequency.</p><div class="accordion">${a.functions.slice(0, 40).map((fn, index) => `<details><summary>${index + 1}. <code>${esc(fn.name)}(${esc(fn.args)})</code> (${Math.max(0, fn.staticCalls)} static references)</summary><p>Defined at ${sourceButton(fn.path, fn.line)}. Read its inputs, body, and callers. ${traceButtonFor(fn.path, fn.line, 'Trace this feature', fn.name)} ${impactButtonFor(fn.path, fn.line, 'Review change impact', fn.name)}</p>${functionCallSitesMarkup(fn)}<pre class="inline-snippet">${esc(fn.snippet || '')}</pre></details>`).join('') || '<p>No conventional function definitions were detected.</p>'}</div></section>`;
  const view = document.querySelector('#detailed-view');
  wireSourceLinks(view);
  wireTraceLinks(view);
  wireImpactLinks(view);
}

function sourceButtonFromLocation(location) {
  const match = String(location || '').match(/^(.*):(\d+)$/);
  return match ? sourceButton(match[1], Number(match[2])) : `<span class="trace-location">${esc(location)}</span>`;
}

function traceCertaintyClass(certainty) {
  if (certainty === 'Observed source') return 'observed';
  if (certainty === 'Observed import') return 'imported';
  if (certainty === 'Observed call' || certainty === 'Observed UI expression' || certainty === 'Observed request' || certainty === 'Observed request + endpoint') return 'call';
  if (certainty === 'Route match inferred') return 'inferred';
  return 'boundary';
}

function renderTrace(a) {
  const view = document.querySelector('#trace-view');
  const traces = a?.traces || [];
  if (!traces.length) {
    view.innerHTML = `<p class="page-kicker">Feature trace</p><h2>No traceable source path yet</h2><p class="lead">CodeStory needs a readable source file, UI element, function, or resolved local import before it can build an evidence-backed feature trace.</p>`;
    return;
  }
  const active = traces.find(item => item.id === state.traceId) || traces[0];
  state.traceId = active.id;
  const frameworkClues = active.frameworkEvidence?.length ? `<section class="trace-framework"><h3>Framework clues in this path</h3><p>These source signatures help you understand the framework role around this feature. They are not a runtime recording.</p><div>${active.frameworkEvidence.map(signal => `<article><strong>${esc(signal.name)}</strong><span>${esc(signal.description)}</span>${sourceButton(signal.path, signal.line)}</article>`).join('')}</div></section>` : '';
  view.innerHTML = `<p class="page-kicker">Smart feature trace</p><span class="mode-badge">Static evidence, not runtime claims</span><h2>${esc(active.title)}</h2><p class="lead">${esc(active.summary)}</p><div class="trace-layout"><aside class="trace-picker"><strong>Traceable starting points</strong><p>Choose a UI element, function, or package reference.</p><div>${traces.map(item => `<button class="trace-option ${item.id === active.id ? 'active' : ''}" data-trace="${esc(item.id)}"><span>${esc(item.type)}</span>${esc(item.title)}</button>`).join('')}</div></aside><section class="trace-stage"><h3>Observed path</h3><p class="trace-caption">CodeStory follows visible actions, matching local functions, resolved imports, and explicit request references. Anything else is marked as an inference.</p><ol class="trace-steps">${active.steps.map((step, index) => `<li class="trace-step"><span class="trace-step-number">${index + 1}</span><div><div class="trace-step-heading"><span class="trace-kind">${esc(step.kind)}</span><span class="trace-certainty ${traceCertaintyClass(step.certainty)}">${esc(step.certainty)}</span></div><h4>${esc(step.title)}</h4><p>${esc(step.explanation)}</p><div class="trace-evidence"><strong>Evidence</strong>${(step.evidence || []).map(sourceButtonFromLocation).join('')}</div></div></li>`).join('')}</ol>${frameworkClues}<section class="trace-safe-change"><h3>Before you change this</h3><p>${esc(active.safeChange)}</p></section><section class="trace-limits"><h3>What this trace cannot prove</h3><ul>${active.limits.map(limit => `<li>${esc(limit)}</li>`).join('')}</ul></section></section></div>`;
  view.querySelector('.trace-stage')?.insertAdjacentHTML('beforeend', `<section class="trace-lesson-launch"><div><strong>Ready to learn this flow?</strong><p>Turn these exact steps into a short lesson, then prove you understand the purpose, connections, and safe change path.</p></div><button class="primary-inline" data-learn-trace="${esc(active.id)}">Learn this trace</button></section>`);
  wireSourceLinks(view);
  view.querySelectorAll('[data-trace]').forEach(button => button.addEventListener('click', () => { state.traceId = button.dataset.trace; renderTrace(a); }));
  view.querySelector('[data-learn-trace]')?.addEventListener('click', () => { state.traceLessonId = active.id; renderTraceLesson(a); activate('trace-lesson'); });
}

function renderImpact(a) {
  const view = document.querySelector('#impact-view');
  const impacts = a?.impacts || [];
  if (!impacts.length) {
    view.innerHTML = `<p class="page-kicker">Change impact</p><h2>No source-backed change review yet</h2><p class="lead">CodeStory needs a readable UI element or function before it can review static dependencies and potential consumers.</p>`;
    return;
  }
  const active = impacts.find(item => item.id === state.impactId) || impacts[0];
  state.impactId = active.id;
  view.innerHTML = `<p class="page-kicker">Safe change review</p><span class="mode-badge">Observed source dependencies only</span><h2>${esc(active.title)}</h2><p class="lead">${esc(active.summary)}</p><div class="trace-layout"><aside class="trace-picker"><strong>Change reviews</strong><p>Choose an interface element or function before editing it.</p><div>${impacts.map(item => `<button class="trace-option ${item.id === active.id ? 'active' : ''}" data-impact="${esc(item.id)}"><span>${esc(item.type)}</span>${esc(item.title)}</button>`).join('')}</div></aside><section class="trace-stage impact-stage"><h3>What could be affected</h3><p class="trace-caption">Each card is grounded in a source relationship. It is a review checklist, not a claim that the full runtime path has been recorded.</p><div class="impact-sections">${active.sections.map(section => `<section><h4>${esc(section.title)}</h4><div>${section.items.map(item => `<article><div><span>${esc(item.kind)}</span><strong>${esc(item.title)}</strong></div><p>${esc(item.detail)}</p><div class="trace-evidence"><strong>Evidence</strong>${(item.evidence || []).map(sourceButtonFromLocation).join('')}</div></article>`).join('')}</div></section>`).join('')}</div><section class="trace-safe-change"><h3>Safe editing order</h3><p>Read the starting source, inspect every cited local dependency or consumer, make one small change, then run the repository’s own tests or manual checks. CodeStory does not execute the original repository.</p></section><section class="trace-limits"><h3>What this review cannot prove</h3><ul>${active.limits.map(limit => `<li>${esc(limit)}</li>`).join('')}</ul></section></section></div>`;
  wireSourceLinks(view);
  view.querySelectorAll('[data-impact]').forEach(button => button.addEventListener('click', () => { state.impactId = button.dataset.impact; renderImpact(a); }));
}

function traceLessonProgressKey() { return `codestory-trace-lesson-${state.analysis?.source || 'unknown'}`; }
function getTraceLessonProgress() { try { return JSON.parse(localStorage.getItem(traceLessonProgressKey()) || '{}'); } catch { return {}; } }
function traceLessonQuestionMarkup(question, progress) {
  const passed = Boolean(progress[question.id]);
  return `<article class="trace-question ${passed ? 'passed' : ''}" data-trace-question="${esc(question.id)}" data-trace-token="${esc(question.verificationToken || '')}"><div><span>${esc(question.kind)}</span><b>${question.score} pts</b></div><p class="trace-question-study">${esc(question.lesson)}</p><h4>${esc(question.prompt)}</h4><div class="mission-options">${question.options.map(option => `<button type="button" data-trace-answer="${esc(option)}" ${passed ? 'disabled' : ''}>${esc(option)}</button>`).join('')}</div><div class="mission-feedback" id="trace-feedback-${esc(question.id)}">${passed ? 'Passed. Explain the answer in your own words, then revisit the relevant source line.' : 'Study the lesson evidence, then choose an answer.'}</div></article>`;
}
function renderTraceLesson(a) {
  const view = document.querySelector('#trace-lesson-view');
  const lessons = a?.traceLessons || [];
  if (!lessons.length) {
    view.innerHTML = `<p class="page-kicker">Trace lesson</p><h2>No lesson is available yet</h2><p class="lead">Create a Smart Trace first. CodeStory needs source-backed steps before it can teach a flow.</p>`;
    return;
  }
  const active = lessons.find(item => item.id === state.traceLessonId) || lessons.find(item => item.id === state.traceId) || lessons[0];
  state.traceLessonId = active.id;
  state.traceId = active.id;
  const progress = getTraceLessonProgress();
  const passedCount = active.questions.filter(question => progress[question.id]).length;
  view.innerHTML = `<p class="page-kicker">Trace-based learning</p><span class="mode-badge">${passedCount}/${active.questions.length} checks proved</span><h2>Learn ${esc(active.title.replace(/^Trace\s+/i, ''))}</h2><p class="lead">${esc(active.summary)}</p><div class="trace-layout"><aside class="trace-picker"><strong>Available trace lessons</strong><p>Each lesson follows one real source-backed flow.</p><div>${lessons.map(item => `<button class="trace-option ${item.id === active.id ? 'active' : ''}" data-trace-lesson="${esc(item.id)}"><span>${item.questions.length} checks</span>${esc(item.title)}</button>`).join('')}</div></aside><section class="trace-stage trace-lesson-stage"><div class="trace-lesson-toolbar"><button class="secondary-inline" data-open-trace="${esc(active.id)}">View trace map</button><span>Read a step, explain why it exists, then answer.</span></div><h3>Learn the flow in order</h3><ol class="trace-lesson-steps">${active.steps.map(step => `<li><span>${step.number}</span><div><div class="trace-step-heading"><span class="trace-kind">${esc(step.kind)}</span><span class="trace-certainty ${traceCertaintyClass(step.certainty)}">${esc(step.certainty)}</span></div><h4>${esc(step.title)}</h4><p>${esc(step.explanation)}</p><p class="trace-step-why"><strong>Why it matters</strong>${esc(step.why)}</p><div class="trace-evidence"><strong>Evidence</strong>${(step.evidence || []).map(sourceButtonFromLocation).join('')}</div></div></li>`).join('')}</ol><section class="trace-checks"><div><h3>Prove this flow</h3><p>These questions test the reason for the flow and the risk of changing it, not just the file location.</p></div><div class="trace-question-grid">${active.questions.map(question => traceLessonQuestionMarkup(question, progress)).join('')}</div></section></section></div>`;
  wireSourceLinks(view);
  view.querySelectorAll('[data-trace-lesson]').forEach(button => button.addEventListener('click', () => { state.traceLessonId = button.dataset.traceLesson; renderTraceLesson(a); }));
  view.querySelector('[data-open-trace]')?.addEventListener('click', () => { state.traceId = active.id; renderTrace(a); activate('trace'); });
  view.querySelectorAll('[data-trace-question]').forEach(card => card.querySelectorAll('[data-trace-answer]').forEach(button => button.addEventListener('click', () => verifyTraceLessonQuestion(card.dataset.traceQuestion, button.dataset.traceAnswer, card.dataset.traceToken))));
}
async function verifyTraceLessonQuestion(challengeId, answer, verificationToken) {
  const feedback = document.querySelector(`#trace-feedback-${challengeId}`); if (!feedback) return;
  feedback.textContent = 'Checking the cited source evidence...';
  try {
    const response = await fetch('/api/challenge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: state.analysis.sessionId, challengeId, answer, verificationToken }) });
    const result = await response.json(); if (!response.ok) throw new Error(result.error);
    const card = feedback.closest('[data-trace-question]');
    card?.querySelectorAll('[data-trace-answer]').forEach(button => {
      button.disabled = true;
      button.classList.remove('correct-answer', 'incorrect-answer');
      if (button.dataset.traceAnswer === result.correctAnswer) button.classList.add('correct-answer');
      else if (button.dataset.traceAnswer === answer) button.classList.add('incorrect-answer');
    });
    feedback.textContent = `${result.correct ? 'Correct.' : 'Not quite.'} ${result.explanation} Evidence: ${(result.evidence || []).join(', ')}`;
    if (result.correct) {
      const progress = getTraceLessonProgress(); progress[challengeId] = true;
      localStorage.setItem(traceLessonProgressKey(), JSON.stringify(progress));
      window.setTimeout(() => renderTraceLesson(state.analysis), 1300);
    }
  } catch (error) { feedback.textContent = `Could not verify this answer: ${error.message}`; }
}

function progressKey() { return `codestory-proof-${state.analysis?.source || 'unknown'}`; }
function getProgress() { try { return JSON.parse(localStorage.getItem(progressKey()) || '{}'); } catch { return {}; } }
function questionCountOptions(meta, selected) {
  const available = Number(meta.available) || 0;
  if (!available) return '<option value="0" selected>No questions available</option>';
  const limit = available;
  const safeSelected = Math.max(1, Math.min(Number(selected) || 10, limit));
  const values = [10, 20, 30, 40, 50, 75, 100].filter(value => value < limit);
  values.push(limit, safeSelected);
  return [...new Set(values)].sort((a, b) => a - b).map(value => {
    const suffix = value === limit ? ' (all available)' : value === meta.recommended ? ' (Recommended)' : '';
    return `<option value="${value}" ${value === safeSelected ? 'selected' : ''}>${value}${suffix}</option>`;
  }).join('');
}
function pageSizeOptions(total, selected) {
  const limit = Math.max(1, Number(total) || 1);
  const safeSelected = Math.max(1, Math.min(Number(selected) || 10, limit));
  const values = [10, 25, 50, 100].filter(value => value < limit);
  values.push(Math.min(limit, safeSelected));
  return [...new Set(values)].sort((a, b) => a - b).map(value => `<option value="${value}" ${value === safeSelected ? 'selected' : ''}>${value} per page</option>`).join('');
}
function availabilityMessage(meta) {
  const available = Number(meta?.available) || 0;
  if (!available) return 'No source-grounded questions are available for this focus. Choose a broader area or Whole project.';
  return `${available} useful questions are available for this focus. CodeStory recommends ${Number(meta.recommended) || 0} to cover it properly.`;
}
async function refreshQuestionScope(scope) {
  const countSelect = document.querySelector('#question-count');
  const createButton = document.querySelector('#load-questions');
  const recommendation = document.querySelector('#scope-availability');
  if (!countSelect || !createButton || !recommendation || !state.analysis) return;
  const requestedScope = scope;
  countSelect.disabled = true;
  createButton.disabled = true;
  recommendation.textContent = 'Checking the source-grounded question bank for this focus...';
  try {
    const response = await fetch(`/api/challenges/meta?sessionId=${encodeURIComponent(state.analysis.sessionId)}&scope=${encodeURIComponent(requestedScope)}`);
    const meta = await response.json(); if (!response.ok) throw new Error(meta.error);
    if (document.querySelector('#question-scope')?.value !== requestedScope) return;
    const previousCount = Number(countSelect.value) || 10;
    countSelect.innerHTML = questionCountOptions(meta, previousCount);
    countSelect.disabled = !meta.available;
    createButton.disabled = !meta.available;
    recommendation.textContent = availabilityMessage(meta);
  } catch (error) {
    countSelect.disabled = false;
    createButton.disabled = false;
    recommendation.textContent = `Could not update this focus: ${error.message}`;
  }
}
function renderPath(a, selectedChallenges = a.challenges || [], selection = { scope: 'all', count: Math.min(10, a.challengeMeta?.available || 10), meta: a.challengeMeta || {} }) {
  const pathView = document.querySelector('#path-view');
  pathView.classList.remove('route-loading');
  const meta = selection.meta || a.challengeMeta || {};
  const routeCount = selectedChallenges.length;
  const preferredPageSize = selection.pageSize || (routeCount > 50 ? 25 : Math.min(10, Math.max(1, routeCount)));
  const pageSize = Math.max(1, Math.min(Number(preferredPageSize) || 10, Math.max(1, routeCount)));
  const pageCount = Math.max(1, Math.ceil(routeCount / pageSize));
  const page = Math.max(1, Math.min(Number(selection.page) || 1, pageCount));
  const firstQuestion = (page - 1) * pageSize;
  const visibleChallenges = selectedChallenges.slice(firstQuestion, firstQuestion + pageSize);
  const routeSelection = { scope: selection.scope || 'all', count: Math.max(1, Math.min(Number(selection.count) || 10, Number(meta.available) || Math.max(1, routeCount))), meta, page, pageSize };
  state.learningRoute = { questions: selectedChallenges, selection: routeSelection };
  const passed = getProgress();
  const score = selectedChallenges.reduce((total, challenge) => total + (passed[challenge.id] ? challenge.score : 0), 0);
  const missions = visibleChallenges.map((challenge, index) => {
    const studyEvidence = (challenge.evidence || []).slice(0, 2).map(evidenceButton).join('');
    return `<article class="mission ${passed[challenge.id] ? 'passed' : ''}" data-mission="${esc(challenge.id)}" data-verification-token="${esc(challenge.verificationToken || '')}"><div class="mission-top"><span>Mission ${firstQuestion + index + 1}</span><b>${challenge.score} pts</b></div><div class="mission-study"><span>${esc(challenge.kind || 'Understand the code')}</span><strong>Learn before you answer</strong><p>${esc(challenge.lesson || 'Read the cited source first. Explain the responsibility before choosing an answer.')}</p><div class="mission-evidence">${studyEvidence}</div></div><h3>${esc(challenge.prompt)}</h3><div class="mission-options">${challenge.options.map(option => `<button type="button" data-answer="${esc(option)}" ${passed[challenge.id] ? 'disabled' : ''}>${esc(option)}</button>`).join('')}</div><div class="mission-feedback" id="feedback-${esc(challenge.id)}">${passed[challenge.id] ? 'Passed. Re-open the source evidence and explain this in your own words.' : 'Choose an answer after studying the source evidence.'}</div></article>`;
  }).join('') || '<div class="ai-note">No questions are available for this focus. Choose Whole project or a broader related area.</div>';
  const pager = routeCount ? `<nav class="route-pager" aria-label="Learning route pages"><label for="questions-per-page">Questions shown per page<select id="questions-per-page">${pageSizeOptions(routeCount, pageSize)}</select></label><p aria-live="polite">Showing ${firstQuestion + 1}-${Math.min(firstQuestion + pageSize, routeCount)} of ${routeCount} questions. Page ${page} of ${pageCount}.</p><div><button class="secondary-inline" id="previous-question-page" ${page === 1 ? 'disabled' : ''}>Previous</button><button class="primary-inline" id="next-question-page" ${page === pageCount ? 'disabled' : ''}>Next</button></div></nav>` : '';
  pathView.innerHTML = `<p class="page-kicker">Learning missions</p><span class="mode-badge">${score} points proved</span><h2>Build your learning route</h2><p class="lead">Learn what each part does, why it exists, how it connects, and what a safe change could affect. Exact source locations are evidence—not the lesson.</p><div class="learn-controls"><label>What do you want to learn?<select id="question-scope"><option value="all">Whole project</option><option value="frontend">Frontend and UI</option><option value="backend">Backend and functions</option><option value="api">API and imports</option><option value="middleware">Middleware</option><option value="data">Data and persistence</option><option value="functions">Functions</option><option value="imports">Connections and imports</option><option value="evidence">Evidence and documents</option></select></label><label>Number of questions<select id="question-count">${questionCountOptions(meta, routeSelection.count)}</select></label><button class="primary-inline" id="load-questions" ${meta.available ? '' : 'disabled'}>Create learning route</button><button class="secondary-inline" id="open-deep-questions">Ask a deeper question</button></div><p class="recommendation" id="scope-availability" aria-live="polite">${availabilityMessage(meta)}</p><div class="proof-summary"><strong>${score}</strong><span>verified points</span><p>Pass missions to prove understanding. Full ownership still requires a real small change and a test.</p></div><div class="mission-grid">${missions}</div>${pager}`;
  const scopeSelect = document.querySelector('#question-scope');
  if (!scopeSelect.querySelector('option[value="contracts"]')) {
    const contractOption = document.createElement('option');
    contractOption.value = 'contracts';
    contractOption.textContent = 'Data contracts and schemas';
    scopeSelect.insertBefore(contractOption, scopeSelect.querySelector('option[value="functions"]'));
  }
  scopeSelect.value = selection.scope;
  scopeSelect.addEventListener('change', () => refreshQuestionScope(scopeSelect.value));
  document.querySelector('#load-questions').addEventListener('click', () => loadQuestionRoute(scopeSelect.value, Number(document.querySelector('#question-count').value)));
  document.querySelector('#open-deep-questions').addEventListener('click', openDeepQuestions);
  document.querySelectorAll('[data-mission]').forEach(card => card.querySelectorAll('[data-answer]').forEach(button => button.addEventListener('click', () => verifyChallenge(card.dataset.mission, button.dataset.answer, card.dataset.verificationToken))));
  document.querySelector('#questions-per-page')?.addEventListener('change', event => renderPath(a, selectedChallenges, { ...routeSelection, page: 1, pageSize: Number(event.target.value) }));
  document.querySelector('#previous-question-page')?.addEventListener('click', () => renderPath(a, selectedChallenges, { ...routeSelection, page: page - 1 }));
  document.querySelector('#next-question-page')?.addEventListener('click', () => renderPath(a, selectedChallenges, { ...routeSelection, page: page + 1 }));
  wireSourceLinks(pathView);
}
async function loadQuestionRoute(scope, count) {
  const container = document.querySelector('#path-view');
  container.classList.add('route-loading');
  try {
    const response = await fetch('/api/challenges', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: state.analysis.sessionId, scope, count }) });
    const result = await response.json(); if (!response.ok) throw new Error(result.error);
    renderPath(state.analysis, result.questions, { scope: result.scope, count: result.questions.length, meta: result, page: 1 });
  } catch (error) { container.classList.remove('route-loading'); container.insertAdjacentHTML('afterbegin', `<div class="ai-note">Could not create this route: ${esc(error.message)}</div>`); }
}
async function verifyChallenge(challengeId, answer, verificationToken) {
  const feedback = document.querySelector(`#feedback-${challengeId}`); if (!feedback) return;
  feedback.textContent = 'Checking source evidence...';
  try {
    const response = await fetch('/api/challenge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: state.analysis.sessionId, challengeId, answer, verificationToken }) });
    const result = await response.json(); if (!response.ok) throw new Error(result.error);
    const mission = feedback.closest('[data-mission]');
    mission?.querySelectorAll('[data-answer]').forEach(button => {
      button.disabled = true;
      button.classList.remove('correct-answer', 'incorrect-answer');
      if (button.dataset.answer === result.correctAnswer) button.classList.add('correct-answer');
      else if (button.dataset.answer === answer) button.classList.add('incorrect-answer');
    });
    const answerNote = result.correct ? 'You chose the correct answer.' : `Correct answer: ${result.correctAnswer}`;
    feedback.textContent = `${result.correct ? 'Correct.' : 'Not quite.'} ${answerNote} ${result.explanation} Evidence: ${(result.evidence || []).join(', ')}`;
    if (result.correct) {
      const next = getProgress();
      next[challengeId] = true;
      localStorage.setItem(progressKey(), JSON.stringify(next));
      setTimeout(() => {
        const route = state.learningRoute;
        if (route) renderPath(state.analysis, route.questions, route.selection);
        else renderPath(state.analysis);
      }, 1400);
    }
  } catch (error) { feedback.textContent = `Could not verify this answer: ${error.message}`; }
}

function evidenceButton(evidence) {
  const parts = String(evidence).split(':');
  const line = Number(parts.at(-1));
  return Number.isFinite(line) && line > 0 ? sourceButton(parts.slice(0, -1).join(':'), line, evidence) : sourceButton(evidence, 1, evidence);
}
function buildPlanMarkup(plan) {
  return `<p class="lead">${esc(plan.premise)}</p><div class="build-steps">${plan.steps.map((step, index) => `<article class="build-step"><span>${index + 1}</span><div><h3>${esc(step.title)}</h3><p>${esc(step.why)}</p><p class="build-action">Do this: ${esc(step.action)}</p><div class="evidence">${step.evidence.map(evidenceButton).join('')}</div></div></article>`).join('')}</div><section class="detail-section"><h3>Tools chosen here and alternatives</h3><p>Alternatives can be better for a different team or goal. They do not mean this repository chose incorrectly.</p><div class="alternative-grid">${plan.alternatives.map(item => `<article><strong>${esc(item.name)}</strong><p>This project references it. For a new build, compare:</p><div>${item.alternatives.map(value => `<button class="alt-pill" data-alt="${esc(value)}">${esc(value)}</button>`).join('')}</div></article>`).join('') || '<div class="ai-note">No named frameworks with known alternatives were detected.</div>'}</div></section><div id="alternative-note" class="ai-note hidden"></div>`;
}

function selectCodeLabLesson(lab) {
  const chapter = lab.chapters.find(item => item.id === state.codeLabChapterId) || lab.chapters[0];
  state.codeLabChapterId = chapter.id;
  const lesson = chapter.topics.find(item => item.id === state.codeLabLessonId) || chapter.topics[0];
  state.codeLabLessonId = lesson.id;
  const runCase = lesson.runCases.find(item => item.id === state.codeLabRunCaseId) || lesson.runCases[0];
  state.codeLabRunCaseId = runCase.id;
  return { chapter, lesson, runCase };
}

function codeLabMarkup(lab, chapter, lesson, runCase) {
  const currentCode = state.codeLabDrafts[lesson.id] ?? lesson.starter;
  const chapterIndex = lab.chapters.indexOf(chapter) + 1;
  const topicIndex = chapter.topics.indexOf(lesson) + 1;
  return `<p class="lead">${esc(lab.premise)}</p><div class="codelab-safety"><strong>Safe learning environment</strong><span>${esc(lab.safety)}</span></div><div class="codelab-layout"><aside class="codelab-chapters" aria-label="CodeLab curriculum">${lab.chapters.map((item, index) => `<section class="codelab-chapter-group"><button class="${item.id === chapter.id ? 'active' : ''}" data-codelab-chapter="${esc(item.id)}" aria-current="${item.id === chapter.id ? 'step' : 'false'}"><span>${index + 1}</span><strong>${esc(item.title)}</strong><small>${item.topics.length} topic${item.topics.length === 1 ? '' : 's'} · ${item.topics.reduce((total, topic) => total + topic.runCases.length, 0)} run cases</small></button>${item.id === chapter.id ? `<div class="codelab-topics" aria-label="Topics in ${esc(item.title)}">${item.topics.map((topic, topicIndex) => `<button class="${topic.id === lesson.id ? 'active' : ''}" data-codelab-lesson="${esc(topic.id)}"><span>${topicIndex + 1}</span>${esc(topic.title)}</button>`).join('')}</div>` : ''}</section>`).join('')}</aside><section class="codelab-workspace"><div class="codelab-heading"><div><p class="page-kicker">Chapter ${chapterIndex} of ${lab.chapters.length}</p><h3>${esc(chapter.title)}</h3><p>${esc(chapter.goal)}</p></div><code>${esc(lesson.fileName)}</code></div><div class="codelab-topic-heading"><span>Topic ${topicIndex} of ${chapter.topics.length}</span><h4>${esc(lesson.title)}</h4><p>${esc(lesson.goal)}</p></div><div class="codelab-original"><strong>How this relates to the original repo</strong><p>${esc(lesson.original)}</p><div>${lesson.evidence.map(evidenceButton).join('')}</div></div><section class="codelab-cases" aria-label="Safe run cases"><div><strong>Run cases</strong><p>Choose one safe scenario. It changes only the input for this small lesson, never the original repository.</p></div><div class="codelab-case-list">${lesson.runCases.map(item => `<button type="button" class="${item.id === runCase.id ? 'active' : ''}" data-codelab-case="${esc(item.id)}"><strong>${esc(item.label)}</strong><span>${esc(item.expectation)}</span></button>`).join('')}</div></section><label class="codelab-editor-label" for="codelab-editor">Edit the small learning version</label><textarea id="codelab-editor" class="codelab-editor" spellcheck="false" aria-label="CodeLab code editor">${esc(currentCode)}</textarea><div class="codelab-controls"><label>Try input<input id="codelab-input" value="${esc(runCase.input)}" aria-label="CodeLab test input" /></label><button id="run-codelab" class="primary-inline">Run this case</button><button id="review-codelab" class="secondary-inline">Review my change</button><button id="reset-codelab" class="secondary-inline">Reset topic</button></div><p class="codelab-challenge"><strong>Try this:</strong> ${esc(lesson.challenge)}</p><section id="codelab-result" class="codelab-result" aria-live="polite"><strong>Run the selected case to inspect the input, transformation, and visible result.</strong><span>Expected learning behavior: ${esc(runCase.expectation)}</span></section><section class="codelab-trace"><h4>What CodeLab will trace</h4>${lesson.trace.map((step, index) => `<div><span>${index + 1}</span><strong>${esc(step.phase)}</strong><p>${esc(step.detail)}</p></div>`).join('')}</section></section></div>`;
}

function renderBuild(a) {
  const plan = a.buildPlan;
  const lab = a.codeLab;
  const { chapter, lesson, runCase } = selectCodeLabLesson(lab);
  const content = state.buildMode === 'codelab' ? codeLabMarkup(lab, chapter, lesson, runCase) : buildPlanMarkup(plan);
  document.querySelector('#build-view').innerHTML = `<p class="page-kicker">Rebuild lab</p><span class="mode-badge">From zero to a working version</span><h2>Build a smaller version from scratch</h2><div class="build-mode-switch" role="tablist" aria-label="Build from scratch modes"><button role="tab" aria-selected="${state.buildMode === 'plan'}" class="${state.buildMode === 'plan' ? 'active' : ''}" data-build-mode="plan">Plan mode</button><button role="tab" aria-selected="${state.buildMode === 'codelab'}" class="${state.buildMode === 'codelab' ? 'active' : ''}" data-build-mode="codelab">CodeLab</button></div>${content}`;
  wireSourceLinks(document.querySelector('#build-view'));
  document.querySelectorAll('[data-build-mode]').forEach(button => button.addEventListener('click', () => { state.buildMode = button.dataset.buildMode; renderBuild(a); }));
  document.querySelectorAll('[data-alt]').forEach(button => button.addEventListener('click', () => { const note = document.querySelector('#alternative-note'); note.textContent = `${button.dataset.alt} is an alternative. Compare documentation, team skills, runtime needs, and deployment before replacing the current tool.`; note.classList.remove('hidden'); }));
  document.querySelectorAll('[data-codelab-chapter]').forEach(button => button.addEventListener('click', () => { state.codeLabChapterId = button.dataset.codelabChapter; state.codeLabLessonId = null; state.codeLabRunCaseId = null; renderBuild(a); }));
  document.querySelectorAll('[data-codelab-lesson]').forEach(button => button.addEventListener('click', () => { state.codeLabLessonId = button.dataset.codelabLesson; state.codeLabRunCaseId = null; renderBuild(a); }));
  document.querySelectorAll('[data-codelab-case]').forEach(button => button.addEventListener('click', () => { state.codeLabRunCaseId = button.dataset.codelabCase; renderBuild(a); }));
  const editor = document.querySelector('#codelab-editor');
  if (!editor) return;
  editor.addEventListener('input', () => { state.codeLabDrafts[lesson.id] = editor.value; });
  document.querySelector('#reset-codelab').addEventListener('click', () => { delete state.codeLabDrafts[lesson.id]; renderBuild(a); });
  document.querySelector('#run-codelab').addEventListener('click', () => runCodeLab(lesson, runCase));
  document.querySelector('#review-codelab').addEventListener('click', () => reviewCodeLab(lesson));
}

function runLessonInWorker(code, input) {
  const workerScript = `const blocked = () => { throw new Error('Network access is disabled in CodeLab.'); }; self.fetch = blocked; self.XMLHttpRequest = function () { throw new Error('Network access is disabled in CodeLab.'); }; self.WebSocket = function () { throw new Error('Network access is disabled in CodeLab.'); }; self.EventSource = function () { throw new Error('Network access is disabled in CodeLab.'); }; self.importScripts = blocked; if (self.navigator) self.navigator.sendBeacon = blocked; self.onmessage = async ({ data }) => { try { const execute = new Function('userInput', '"use strict";\\n' + data.code + '\\nif (typeof runLesson !== "function") throw new Error("Define function runLesson(userInput) before running this chapter.");\\nreturn runLesson(userInput);'); const value = await execute(data.input); self.postMessage({ kind: 'result', value: JSON.stringify(value, null, 2) }); } catch (error) { self.postMessage({ kind: 'error', message: error && error.message ? error.message : String(error) }); } };`;
  return new Promise((resolve, reject) => {
    const blob = new Blob([workerScript], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);
    const finish = () => { worker.terminate(); URL.revokeObjectURL(url); };
    const timer = window.setTimeout(() => { finish(); reject(new Error('This lesson ran longer than one second, so CodeLab stopped it. Keep the experiment small.')); }, 1000);
    worker.onmessage = event => { if (!event.data || !['result', 'error'].includes(event.data.kind)) return; window.clearTimeout(timer); finish(); event.data.kind === 'result' ? resolve(event.data.value) : reject(new Error(event.data.message)); };
    worker.onerror = () => { window.clearTimeout(timer); finish(); reject(new Error('CodeLab could not run this code. Check the syntax and try one small change.')); };
    worker.postMessage({ code, input });
  });
}

async function runCodeLab(lesson, runCase) {
  const result = document.querySelector('#codelab-result');
  const code = document.querySelector('#codelab-editor').value;
  const input = document.querySelector('#codelab-input').value;
  state.codeLabDrafts[lesson.id] = code;
  result.innerHTML = '<strong>Running the small CodeLab lesson...</strong><span>No repository scripts are being run.</span>';
  try {
    const output = await runLessonInWorker(code, input);
    result.innerHTML = `<strong>CodeLab result: ${esc(runCase.label)}</strong><span>Expected learning behavior: ${esc(runCase.expectation)}</span><pre>${esc(output)}</pre><div class="codelab-run-trace">${lesson.trace.map((step, index) => `<div><b>${index + 1}</b><span><strong>${esc(step.phase)}</strong>${esc(step.detail)}</span></div>`).join('')}</div>`;
  } catch (error) { result.innerHTML = `<strong>CodeLab stopped this run</strong><span>${esc(error.message)}</span>`; }
}

async function reviewCodeLab(lesson) {
  const result = document.querySelector('#codelab-result');
  const code = document.querySelector('#codelab-editor').value;
  result.innerHTML = '<strong>Reviewing the lesson shape...</strong><span>CodeStory is checking structure only. It does not execute your submitted code on the server.</span>';
  try {
    const response = await fetch('/api/codelab/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: state.analysis.sessionId, lessonId: lesson.id, code }) });
    const review = await response.json(); if (!response.ok) throw new Error(review.error);
    result.innerHTML = `<strong>${esc(review.feedback)}</strong><ul>${(review.suggestions || []).map(item => `<li>${esc(item)}</li>`).join('')}</ul>`;
  } catch (error) { result.innerHTML = `<strong>Could not review this change</strong><span>${esc(error.message)}</span>`; }
}

function renderMaterials(a) {
  const materials = a.materials || [];
  document.querySelector('#materials-view').innerHTML = `<p class="page-kicker">Evidence ledger</p><span class="mode-badge">Claims are not proof</span><h2>Read supporting material safely</h2><p class="lead">README files, research papers, diagrams, and screenshots can explain intent. CodeStory never relies on them alone to infer how the system works.</p><div class="evidence-policy"><article><strong>Strong evidence</strong><p>Executable source, dependency manifests, and resolved imports.</p></article><article><strong>Context to verify</strong><p>README and text documents. Useful only when source agrees.</p></article><article><strong>Unverified attachments</strong><p>Images and office files are shown to the learner, never treated as proof. PDF text can be read as context only.</p></article></div><div class="materials-grid">${materials.map(material => `<article class="material-card"><div><span>${esc(material.kind)}</span><b>${esc(material.trust)}</b></div><h3>${esc(material.path)}</h3><p>${esc(material.extraction || (material.readable ? 'Open as context, then compare every architecture claim with source.' : 'This attachment is catalogued but excluded from automated architecture conclusions.'))}</p>${material.readable ? sourceButton(material.path, 1, 'Open material') : '<span class="material-disabled">Not used as proof</span>'}</article>`).join('') || '<div class="ai-note">No README, document, diagram, research paper, or image was found.</div>'}</div>`;
  wireSourceLinks(document.querySelector('#materials-view'));
}

function libraryList(label, values) {
  return values?.length ? `<section><h4>${esc(label)}</h4><ul>${values.map(value => `<li>${esc(value)}</li>`).join('')}</ul></section>` : '';
}

function safeExternalUrl(value) {
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
}

function libraryRepositoryMarkup(repository) {
  const evidence = repository.evidence?.length ? `<div class="library-evidence">${repository.evidence.map(item => {
    const [pathname, line = '1'] = item.split(/:(?=\d+$)/);
    return sourceButton(pathname, Number(line), item);
  }).join('')}</div>` : '';
  const label = repository.status === 'observed' ? 'Observed in this repository' : repository.status === 'not-detected' ? 'Not directly detected' : 'Repository comparison unavailable';
  return `<section class="library-repository ${esc(repository.status)}"><div><span>${esc(label)}</span><p>${esc(repository.summary)}</p></div>${evidence}</section>`;
}

function libraryCard(concept) {
  const syntax = concept.syntax?.code ? `<section class="library-syntax"><h4>${esc(concept.syntax.language || 'Example')}</h4><pre>${esc(concept.syntax.code)}</pre></section>` : '';
  const references = (concept.references || []).map(reference => {
    const href = safeExternalUrl(reference.url);
    return href ? `<a href="${esc(href)}" target="_blank" rel="noreferrer">${esc(reference.label)} ↗</a>` : '';
  }).filter(Boolean).join('');
  const connections = (concept.connections || []).map(value => `<button class="library-chip" data-library-query="${esc(value)}">${esc(value)}</button>`).join('');
  return `<article class="library-card"><header><span>${esc(concept.category)}</span><h3>${esc(concept.name)}</h3><p>${esc(concept.definition)}</p></header><section class="library-simple"><h4>In simple words</h4><p>${esc(concept.simpleDefinition)}</p></section>${libraryRepositoryMarkup(concept.repository)}<details><summary>Practical guide</summary><div class="library-detail-grid"><section><h4>Why projects use it</h4><p>${esc(concept.why)}</p></section>${libraryList('Common uses', concept.uses)}<section><h4>When to use it</h4><p>${esc(concept.whenToUse)}</p></section>${syntax}${libraryList('Alternatives', concept.alternatives)}${libraryList('Watch out for', concept.pitfalls)}</div><section class="library-connections"><h4>Often connected to</h4><div>${connections || '<span>Connections are still being added.</span>'}</div></section>${references ? `<footer class="library-references"><span>Learn more</span>${references}</footer>` : ''}</details></article>`;
}

function discoveryCard(concept) {
  const evidence = concept.evidence?.length ? `<div class="discovery-evidence">${concept.evidence.map(item => {
    const [pathname, line = '1'] = item.split(/:(?=\d+$)/);
    return sourceButton(pathname, Number(line), item);
  }).join('')}</div>` : '';
  const importers = concept.importers?.length ? `<p class="detail-meta">Observed from: ${esc(concept.importers.join(', '))}</p>` : '';
  const reference = concept.reference ? `<button class="library-reference-link" data-library-query="${esc(concept.reference.name)}">Read the ${esc(concept.reference.name)} guide</button>` : '<span class="discovery-unmapped">No general guide is bundled for this term yet. CodeStory is showing only what the repository proves.</span>';
  return `<article class="discovery-card"><header><span>${esc(concept.category)}</span><h3>${esc(concept.name)}</h3></header><p>${esc(concept.summary)}</p>${importers}${evidence}<footer>${reference}</footer></article>`;
}

async function loadLibraryResults(a, query) {
  const results = document.querySelector('#library-results');
  if (!results) return;
  results.innerHTML = '<div class="library-loading">Searching the local Concept Library...</div>';
  try {
    const response = await fetch(`/api/library?q=${encodeURIComponent(query)}&sessionId=${encodeURIComponent(a.sessionId)}`);
    const data = await response.json(); if (!response.ok) throw new Error(data.error);
    const heading = query ? `${data.total} matching concept${data.total === 1 ? '' : 's'}` : `${data.total} concepts in the starter library`;
    const discovery = data.discovery || { available: 0, total: 0, concepts: [] };
    const discoveryHeading = query ? `${discovery.total} matching item${discovery.total === 1 ? '' : 's'} detected in this repository` : `${discovery.available} concepts detected in this repository`;
    const discoveredMarkup = discovery.available ? `<section class="discovery-section"><div class="discovery-heading"><h3>${esc(discoveryHeading)}</h3><p>These names came from dependency manifests, imports, notebooks, or resolved local modules. This section never invents a definition for an unfamiliar tool.</p></div><div class="discovery-grid">${discovery.concepts.map(discoveryCard).join('') || '<div class="ai-note">No repository-discovered concept matches this search. Try the package name, import name, or a broader keyword.</div>'}</div></section>` : '';
    results.innerHTML = `${discoveredMarkup}<section class="reference-section"><p class="library-count">${esc(heading)}. This is CodeStory's curated reference pack. Repository evidence stays separate on every guide.</p><div class="library-grid">${data.concepts.map(libraryCard).join('') || '<div class="ai-note">No reference guide matches this search. If the repository uses the term, check the detected concepts above for exact source evidence.</div>'}</div></section>`;
    wireSourceLinks(results);
    results.querySelectorAll('[data-library-query]').forEach(button => button.addEventListener('click', () => {
      const nextQuery = button.dataset.libraryQuery || '';
      const input = document.querySelector('#library-query');
      if (input) input.value = nextQuery;
      state.libraryQuery = nextQuery;
      loadLibraryResults(a, nextQuery);
    }));
  } catch (error) { results.innerHTML = `<div class="ai-note">The Concept Library could not load: ${esc(error.message)}</div>`; }
}

function renderLibrary(a) {
  const query = state.libraryQuery || '';
  const view = document.querySelector('#library-view');
  view.innerHTML = `<p class="page-kicker">Local concept library</p><span class="mode-badge">General knowledge + repository proof</span><h2>Understand the tools behind the code</h2><p class="lead">Search a concept such as Node.js, SQL, React, or middleware. CodeStory explains the general idea, then separately shows whether it can find direct evidence in the repository you are studying.</p><form id="library-search" class="library-search"><label for="library-query">Search the library</label><div><input id="library-query" value="${esc(query)}" placeholder="Try SQL, Node.js, authentication..." autocomplete="off" /><button class="primary-inline">Search</button><button type="button" class="secondary-inline" data-library-reset>Show all</button></div></form><div id="library-results"></div>`;
  document.querySelector('#library-search').addEventListener('submit', event => { event.preventDefault(); const nextQuery = document.querySelector('#library-query').value.trim(); state.libraryQuery = nextQuery; loadLibraryResults(a, nextQuery); });
  document.querySelector('[data-library-reset]').addEventListener('click', () => { state.libraryQuery = ''; document.querySelector('#library-query').value = ''; loadLibraryResults(a, ''); });
  loadLibraryResults(a, query);
}

function setModalLens(lens, detail) {
  state.lens = lens;
  document.querySelector('#concept-content').innerHTML = `<p class="mode-badge">${esc(lens)} explanation</p><p class="concept-answer">${esc(detail[lens] || detail.direct || 'No explanation is available.')}</p><p class="concept-answer"><strong>Real-world use</strong><br>${esc(detail.realUse || 'This is used where the repository needs this capability.')}</p><p class="concept-evidence">Evidence: ${esc((detail.evidence || []).join(', '))}<br>${esc(detail.confidence || 'Repository evidence')}</p>`;
  document.querySelectorAll('.lens-switch button').forEach(button => button.classList.toggle('active', button.dataset.lens === lens));
}
async function openConcept(id) {
  const concept = allConcepts().find(item => item.id === id); if (!concept) return;
  modal.classList.remove('hidden'); document.querySelector('#concept-type').textContent = concept.type; document.querySelector('#concept-title').textContent = concept.term;
  setModalLens('direct', { ...concept.detail, evidence: concept.evidence, confidence: 'Loading deeper context...' });
  try { const response = await fetch('/api/concept', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: state.analysis.sessionId, conceptId: id, settings: settings() }) }); const detail = await response.json(); if (!response.ok) throw new Error(detail.error); modal.dataset.detail = JSON.stringify(detail); setModalLens(state.lens, detail); }
  catch (error) { const detail = { ...concept.detail, evidence: concept.evidence, confidence: `Using static evidence: ${error.message}` }; modal.dataset.detail = JSON.stringify(detail); setModalLens(state.lens, detail); }
}
async function openSource(pathname, line) {
  sourceModal.classList.remove('hidden'); document.querySelector('#source-title').textContent = pathname; document.querySelector('#source-caption').textContent = `Loading lines around ${pathname}:${line}...`; document.querySelector('#source-code').textContent = '';
  try { const response = await fetch('/api/source', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: state.analysis.sessionId, path: pathname, line }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); document.querySelector('#source-caption').textContent = `Lines ${data.start}-${data.end} of ${data.totalLines}; highlighted line ${data.requestedLine}`; document.querySelector('#source-code').innerHTML = data.lines.map(item => `<span class="${item.number === data.requestedLine ? 'source-highlight' : ''}"><b>${item.number}</b>${esc(item.text)}</span>`).join(''); }
  catch (error) { document.querySelector('#source-caption').textContent = error.message; }
}
function updateDeepProvider() {
  const provider = document.querySelector('#deep-provider').value;
  document.querySelector('#deep-api-fields').classList.toggle('hidden', provider !== 'gemini');
  document.querySelector('#deep-ollama-fields').classList.toggle('hidden', provider !== 'ollama');
}
function deepSettings() {
  const provider = document.querySelector('#deep-provider').value;
  return {
    provider,
    apiProvider: document.querySelector('#deep-api-provider').value,
    apiKey: document.querySelector('#deep-api-key').value.trim(),
    model: provider === 'ollama' ? document.querySelector('#deep-ollama-model').value : document.querySelector('#deep-model').value.trim(),
    apiBase: document.querySelector('#deep-api-base').value.trim(),
    ollamaUrl: 'http://localhost:11434'
  };
}
function openDeepQuestions() {
  document.querySelector('#deep-question-modal').classList.remove('hidden');
  document.querySelector('#deep-answer').textContent = '';
  updateDeepProvider();
}
async function askDeepQuestion() {
  const question = document.querySelector('#deep-question-input').value.trim();
  const answer = document.querySelector('#deep-answer');
  if (!question) { answer.textContent = 'Write a question first.'; return; }
  answer.textContent = 'Reading the selected repository evidence...';
  try {
    const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: state.analysis.sessionId, question, settings: deepSettings() }) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error);
    answer.innerHTML = `<strong>${esc(data.answer)}</strong><span>Evidence: ${(data.evidence || []).map(esc).join(', ')}<br>${esc(data.confidence || '')}</span>`;
  } catch (error) { answer.textContent = `Could not answer: ${error.message}`; }
}
function renderAsk() {
  document.querySelector('#ask-view').innerHTML = `<p class="page-kicker">Source-grounded chat</p><h2>Ask this codebase</h2><p class="lead">Ask after exploring the map. CodeStory answers from the local scan and says when the evidence is incomplete.</p><div class="quick-prompts"><button>Which file starts the user flow?</button><button>Explain the architecture</button><button>Where is the database used?</button></div><div class="chat-shell"><div class="chat-log" id="chat-log"><div class="message assistant">I mapped the codebase. Ask me to trace a feature, inspect an import, or explain a visible interaction.</div></div><form id="chat-form" class="chat-form"><input id="chat-input" placeholder="How does this screen reach the backend?" required /><button>Ask</button></form></div>`;
  document.querySelectorAll('.quick-prompts button').forEach(button => button.addEventListener('click', () => ask(button.textContent)));
  document.querySelector('#chat-form').addEventListener('submit', event => { event.preventDefault(); ask(document.querySelector('#chat-input').value); });
}
async function ask(question) {
  const input = document.querySelector('#chat-input'); const log = document.querySelector('#chat-log'); const clean = question.trim(); if (!clean) return;
  log.insertAdjacentHTML('beforeend', `<div class="message user">${esc(clean)}</div>`); input.value = '';
  try { const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: state.analysis.sessionId, question: clean, settings: settings() }) }); const answer = await response.json(); if (!response.ok) throw new Error(answer.error); log.insertAdjacentHTML('beforeend', `<div class="message assistant">${esc(answer.answer)}<span class="chat-evidence">Evidence: ${(answer.evidence || []).map(esc).join(', ')}<br>${esc(answer.confidence || '')}</span></div>`); }
  catch (error) { log.insertAdjacentHTML('beforeend', `<div class="message assistant">I could not answer that yet: ${esc(error.message)}</div>`); }
  log.scrollTop = log.scrollHeight;
}
function render(a) {
  state.analysis = a; document.querySelector('#repo-name').textContent = a.displayName || a.name; document.querySelector('#repo-source').textContent = short(a.source, 34); document.querySelector('#repo-initial').textContent = (a.displayName || a.name)[0]?.toUpperCase() || 'R';
  renderOverview(a); renderArchitecture(a); renderTrace(a); renderImpact(a); renderTraceLesson(a); renderInspector(a); renderPath(a); renderBuild(a); renderLibrary(a); renderMaterials(a); renderAsk(); loading.classList.add('hidden'); views.classList.remove('hidden'); activate('story');
}
document.querySelectorAll('.nav-item').forEach(button => button.addEventListener('click', () => activate(button.dataset.view)));
document.querySelectorAll('[data-close-concept]').forEach(button => button.addEventListener('click', () => modal.classList.add('hidden')));
document.querySelectorAll('[data-close-source]').forEach(button => button.addEventListener('click', () => sourceModal.classList.add('hidden')));
document.querySelectorAll('[data-close-deep]').forEach(button => button.addEventListener('click', () => document.querySelector('#deep-question-modal').classList.add('hidden')));
document.querySelectorAll('.lens-switch button').forEach(button => button.addEventListener('click', () => setModalLens(button.dataset.lens, JSON.parse(modal.dataset.detail || '{}'))));
document.querySelector('#deep-provider').addEventListener('change', updateDeepProvider);
document.querySelector('#deep-api-provider').addEventListener('change', () => { document.querySelector('#deep-api-base').classList.toggle('hidden', document.querySelector('#deep-api-provider').value !== 'compatible'); });
document.querySelector('#ask-deep-question').addEventListener('click', askDeepQuestion);
function setProviderFields() { const provider = document.querySelector('input[name="provider"]:checked')?.value; document.querySelector('#gemini-fields').classList.toggle('hidden', provider !== 'gemini'); document.querySelector('#ollama-fields').classList.toggle('hidden', provider !== 'ollama'); }
function updateApiProvider() { const provider = document.querySelector('#api-provider').value; const help = document.querySelector('#api-help'); const base = document.querySelector('#api-base'); const model = document.querySelector('#api-model'); base.classList.toggle('hidden', provider !== 'compatible'); if (provider === 'gemini') { model.value = 'gemini-3.5-flash'; help.href = 'https://aistudio.google.com/app/apikey'; help.textContent = 'No key? Gemini is free to start. Create a key in Google AI Studio.'; } if (provider === 'openai') { model.value = 'gpt-4.1-mini'; help.href = 'https://platform.openai.com/api-keys'; help.textContent = 'Create or manage an OpenAI API key.'; } if (provider === 'openrouter') { model.value = 'openrouter/free'; help.href = 'https://openrouter.ai/keys'; help.textContent = 'Review OpenRouter free-model options.'; } if (provider === 'compatible') { model.value = ''; help.href = 'https://ollama.com'; help.textContent = 'Use an OpenAI-compatible endpoint and model you control.'; } }
async function checkOllama() { const status = document.querySelector('#ollama-status'); status.textContent = 'Checking local Ollama...'; try { const response = await fetch('/api/ollama/status'); const data = await response.json(); status.textContent = data.ready ? (data.models.length ? `Ollama is ready. Available models: ${data.models.join(', ')}` : 'Ollama is running. Choose a model to download.') : 'Ollama is not running yet. Download it, install it, then choose Check setup.'; } catch { status.textContent = 'Could not check Ollama right now.'; } }
document.querySelectorAll('input[name="provider"]').forEach(input => input.addEventListener('change', setProviderFields)); document.querySelector('#api-provider').addEventListener('change', updateApiProvider); document.querySelector('#check-ollama').addEventListener('click', checkOllama);
document.querySelector('#install-local-model').addEventListener('click', async () => { const button = document.querySelector('#install-local-model'); const status = document.querySelector('#ollama-status'); const model = document.querySelector('#ollama-model').value; if (!confirm(`Download ${model}? This is a large model download and may take time.`)) return; button.disabled = true; status.textContent = `Starting download of ${model}...`; try { const response = await fetch('/api/ollama/pull', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); status.textContent = data.message; setTimeout(checkOllama, 8000); } catch (error) { status.textContent = error.message; } finally { button.disabled = false; } });
setProviderFields(); updateApiProvider(); checkOllama();
form.addEventListener('submit', async event => { event.preventDefault(); formError.textContent = ''; const target = targetInput.value.trim(); if (!target) return; welcome.classList.add('hidden'); workspace.classList.remove('hidden'); loading.classList.remove('hidden'); views.classList.add('hidden'); try { const response = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target, settings: settings() }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); render(data); } catch (error) { workspace.classList.add('hidden'); welcome.classList.remove('hidden'); formError.textContent = error.message; } });
fetch('/api/default-target').then(response => response.json()).then(({ target }) => { if (target) { targetInput.value = target; form.requestSubmit(); } }).catch(() => {});
