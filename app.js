'use strict';

const ICONS = {
  logo: '<path d="M2 5v6m3-8v10m6-10v10m3-8v6M5 8h6"/>',
  workout: '<path d="M2 5v6m3-8v10m6-10v10m3-8v6M5 8h6"/>',
  history: '<rect x="2.5" y="4" width="11" height="9.5" rx="2"/><path d="M5 2.5v3m6-3v3M2.5 7h11m-8 3h2"/>',
  progress: '<path d="M2.5 2.5v11h11m-8-3 2.5-3 2 1 3-4"/>',
  guide: '<path d="M8 4v9.5M8 4c-1.5-1.4-3.2-1.7-5.5-1.5V12c2.2-.2 4 .2 5.5 1.5m0-9.5c1.5-1.4 3.2-1.7 5.5-1.5V12c-2.2-.2-4 .2-5.5 1.5"/>',
  settings: '<path d="M2.5 4h11m-11 4h11m-11 4h11"/><circle cx="6" cy="4" r="1.4"/><circle cx="10.5" cy="8" r="1.4"/><circle cx="6" cy="12" r="1.4"/>',
  edit: '<path d="m10.5 3 2.5 2.5M3 13l3.2-.7 7-7a1.8 1.8 0 0 0-2.5-2.5l-7 7L3 13Z"/>',
  check: '<path d="m3.5 8 3 3 6-6"/>',
  clock: '<circle cx="8" cy="8" r="5.5"/><path d="M8 4.7v3.5l2.2 1.1"/>',
  close: '<path d="m4 4 8 8m0-8-8 8"/>',
  down: '<path d="m4 6 4 4 4-4"/>',
  plus: '<path d="M8 3.5v9m-4.5-4.5h9"/>',
  minus: '<path d="M3.5 8h9"/>',
  play: '<path d="M5 3v10l8-5-8-5Z" fill="currentColor" stroke="none"/>',
  pause: '<path d="M5.5 4v8m5-8v8" stroke-width="2.8"/>',
  download: '<path d="M8 2v8m-3-3 3 3 3-3m-8 4v2.5h10V11"/>'
};
const PAGES = {
  workout: 'Séance',
  history: 'Journal',
  progress: 'Progression',
  guide: 'Guide',
  settings: 'Réglages'
};
const app = document.querySelector('#app');
const editor = document.querySelector('#editor');
let data;
let storageProblem = '';
try {
  const stored = localStorage.getItem(STORE);
  data = stored ? normalizeData(JSON.parse(stored)) : newData();
} catch {
  storageProblem = 'Les données locales sont illisibles ou indisponibles. Tu peux restaurer une sauvegarde dans Réglages.';
  data = newData();
}
let page = 'workout';
let selection = nextDateWorkout(data);
let editId = null;
let workout = makeDraft(data, selection, editId);
let chartId = 'chest';
let editorTrigger = null;
let stopMotion = null;
let notifiedTimer = null;
let toastTimeout;

function icon(name, size = 20) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}

function formatDate(value, options = {weekday:'long', day:'numeric', month:'long'}) {
  return new Date(value + 'T12:00:00').toLocaleDateString('fr-BE', options);
}

function toast(message) {
  const element = document.querySelector('#toast');
  element.textContent = message;
  element.classList.add('visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => element.classList.remove('visible'), 3000);
}

function commit(next, replace = false) {
  if (storageProblem && !replace) {
    toast('Restaure une sauvegarde ou réinitialise le stockage dans Réglages.');
    return false;
  }
  try {
    localStorage.setItem(STORE, JSON.stringify(next));
  } catch {
    toast('Impossible d’enregistrer sur cet appareil.');
    return false;
  }
  data = next;
  storageProblem = '';
  return true;
}

function storeWorkout(next = workout, loads = data.loads, timer = data.timer) {
  const key = draftKey(selection, editId);
  if (!commit({...data, loads, timer, drafts: {...data.drafts, [key]: next}})) return false;
  workout = next;
  return true;
}

function navigation() {
  return `<nav class="navigation" aria-label="Navigation principale">
    ${Object.entries(PAGES).map(([id, label]) => `
      <button type="button" data-page="${id}" ${page === id ? 'aria-current="page"' : ''}>
        ${icon(id)}<span>${label}</span>
      </button>`).join('')}
  </nav>`;
}

function render({keepPosition = false, focusId = ''} = {}) {
  const top = window.scrollY;
  app.innerHTML = `<div class="frame">
    <header class="sidebar">
      <button class="wordmark" data-page="workout" aria-label="Home Gym, séance">
        <span class="brand-icon">${icon('logo', 23)}</span><span>HOME<span class="brand-space"> </span>GYM</span>
      </button>
      ${navigation()}
      <div class="sidebar-foot">Carnet d’entraînement</div>
    </header>
    <main id="content" tabindex="-1">
      ${storageProblem ? `<p class="notice warning" role="alert">${escapeHTML(storageProblem)}</p>` : ''}
      ${{workout: workoutPage, history: historyPage, progress: progressPage, guide: guidePage, settings: settingsPage}[page]()}
    </main>
    <div id="timer" class="timer-panel" hidden></div>
  </div>`;
  updateTimer(false);
  window.scrollTo(0, keepPosition ? top : 0);
  if (focusId) document.getElementById(focusId)?.focus({preventScroll: true});
}

function workoutPage() {
  const count = countDone(workout);
  const total = totalSets(workout.workout);
  const exercises = exercisesFor(workout.workout, usesCableCrunch(workout, Boolean(editId)));
  const next = exercises.find(ex => workout.exercises[ex.id].some(set => !set.done));
  const setWord = count === 1 ? 'série validée' : 'séries validées';
  return `
    <div class="page-heading">
      <div><p class="overline">${escapeHTML(formatDate(workout.date))}</p><h1>${editId ? 'Modifier la séance' : 'Ma séance'}</h1></div>
      ${editId ? '<button class="button secondary" data-action="exit-edit">Retour au journal</button>' :
        `<label class="date-field" title="Date de séance">${icon('history',18)}<span> Date</span><input id="workout-date" type="date" aria-label="Date de séance" value="${escapeHTML(selection.date)}"></label>`}
    </div>
    <section class="session-banner" aria-label="Progression de la séance">
      <div class="banner-content">
        ${editId ? `<span class="session-label">Séance ${workout.workout}</span>` :
          `<div class="segments banner-switch" role="group" aria-label="Choisir le programme">
            ${['A','B'].map(id => `<button type="button" id="workout-${id}" data-workout="${id}" aria-pressed="${selection.workout === id}">Séance ${id}</button>`).join('')}
          </div>`}
        <p class="banner-title">${count === total ? 'Séance complète' : 'Au programme'}</p>
        <p class="banner-meta">${exercises.length} exercices <span>·</span> ${total} séries</p>
      </div>
      <div class="banner-status">
        <p><strong>${count}<span> / ${total}</span></strong> ${setWord}</p>
        <progress max="${total}" value="${count}" aria-label="Séries validées"></progress>
        ${next ? `<a class="next-exercise" href="#exercise-${next.id}">${count ? 'Reprendre la séance' : 'Aller au premier exercice'}</a>` : ''}
      </div>
    </section>
    <div class="session-shortcuts">
      ${!editId ? `<button class="button secondary" id="quick-rest" data-action="choose-rest">${icon('clock', 18)} Repos</button>` : ''}
      <a class="button secondary" href="#finish-session">${icon('check', 17)} Fin de séance</a>
    </div>
    <div class="workout-layout">
      <section class="exercise-list" aria-label="Exercices de la séance">
        <h2>Exercices</h2>
        ${exercises.map(exerciseCard).join('')}
      </section>
      <aside class="session-aside" aria-label="Enregistrement et repos">
        ${!editId ? restCard() : ''}
        <section class="card finish-card" id="finish-session">
          <h2>${editId ? 'Modifications' : 'Fin de séance'}</h2>
          <label class="field" for="session-notes">Note <span>facultative</span></label>
          <textarea id="session-notes" rows="2" maxlength="4000" placeholder="Comment s’est passée la séance ?">${escapeHTML(workout.notes)}</textarea>
          <button class="button primary" data-action="save-session" ${count ? '' : 'disabled'}>${icon('check',18)} ${editId ? 'Enregistrer les modifications' : 'Enregistrer la séance'}</button>
          <p class="save-hint">${count ? (count < total ? 'Le journal comptabilise les séries cochées.' : 'Tes séries sont prêtes pour le journal.') : 'Coche une série pour pouvoir enregistrer.'}</p>
        </section>
      </aside>
    </div>`;
}

function exerciseCard(ex) {
  const sets = workout.exercises[ex.id];
  const done = sets.filter(set => set.done).length;
  const load = exerciseLoad(data, workout, ex.id, Boolean(editId));
  const resistance = isBand(ex) ? 'Bandes' : 'Charge';
  const label = load ? displayLoad(ex, load) : workout.skipped[ex.id] ? 'Non renseignée' : '';
  return `<article class="card exercise ${done === sets.length ? 'complete' : ''}" id="exercise-${ex.id}">
    <div class="exercise-heading">
      <div class="exercise-name"><span class="exercise-group">${escapeHTML(EXPLAIN[ex.id].focus)}</span><h3>${escapeHTML(ex.name)}</h3>
        <p>${escapeHTML(ex.gear)} <span>·</span> ${sets.length} × ${escapeHTML(ex.target)}</p></div>
      <span class="set-count" aria-label="${done} séries validées sur ${sets.length}">${done === sets.length ? icon('check', 15) : ''}${done}/${sets.length}</span>
    </div>
    <div class="exercise-controls">
      <button class="load-button ${label ? 'has-load' : ''}" id="load-${ex.id}" data-action="load" data-ex="${ex.id}" aria-label="${(label ? 'Modifier ' : 'Renseigner ') + resistance.toLowerCase()} – ${escapeHTML(ex.name)}${label ? ', ' + escapeHTML(label) : ''}">
        ${icon(label ? 'edit' : 'plus', 17)} <span>${label ? escapeHTML(label) : (isBand(ex) ? 'Renseigner les bandes' : 'Renseigner la charge')}</span>
      </button>
      <button class="technique-button" id="tech-${ex.id}" data-action="technique" data-ex="${ex.id}" aria-label="Technique – ${escapeHTML(ex.name)}">${icon('guide', 17)}<span>Technique</span></button>
    </div>
    <div class="set-grid" style="--set-count:${sets.length}">
      ${sets.map((set, index) => setCell(ex, set, index, load)).join('')}
    </div>
  </article>`;
}

function setCell(ex, set, index, current) {
  const number = index + 1;
  const reps = set.reps || (set.done ? '—' : defaultReps(ex));
  const differentLoad = set.done && set.load !== current;
  const actualLoad = set.load ? displayLoad(ex, set.load) : 'Sans charge notée';
  return `<div class="set-cell ${set.done ? 'checked' : ''}">
    <div class="set-info"><span>Série ${number}</span>
      <button class="reps-button" id="reps-${ex.id}-${index}" data-action="reps" data-ex="${ex.id}" data-set="${index}" aria-label="Modifier les répétitions de la série ${number}, ${escapeHTML(ex.name)}, ${escapeHTML(reps)}">${escapeHTML(reps)} <small>rép.</small></button>
    </div>
    <button class="set-check" id="set-${ex.id}-${index}" data-action="set" data-ex="${ex.id}" data-set="${index}" aria-label="${set.done ? 'Décocher' : 'Valider'} la série ${number}, ${escapeHTML(ex.name)}" aria-pressed="${set.done}">${icon('check', 19)}</button>
    ${differentLoad ? `<small class="set-load">${escapeHTML(actualLoad)}</small>` : ''}
  </div>`;
}

function restCard() {
  return `<section class="card rest-card">
    <h2>${icon('clock', 20)} Repos</h2>
    <div class="segments rest-options" role="group" aria-label="Lancer le repos">
      ${[[60, '1:00'], [90, '1:30'], [120, '2:00']].map(([seconds, label]) => `<button data-action="start-timer" data-seconds="${seconds}">${label}</button>`).join('')}
    </div>
    <p>${data.settings.autoRest ? `Départ automatique après une série · ${clockText(data.settings.rest)}` : 'Départ manuel'}</p>
  </section>`;
}

function historyPage() {
  const sessions = sortSessions(data.sessions);
  const drafts = Object.entries(data.drafts).filter(([key, draft]) => !key.startsWith('edit_') && (countDone(draft) || draft.notes || Object.keys(draft.loads).length || Object.values(draft.exercises).flat().some(set => set.reps)));
  return `<div class="page-heading"><div><h1>Journal</h1><p class="subtitle">${sessions.length} séance${sessions.length === 1 ? '' : 's'} enregistrée${sessions.length === 1 ? '' : 's'}</p></div></div>
    ${drafts.length ? `<h2>Séances en cours</h2><div class="record-grid">${[...drafts].reverse().map(([, draft]) => `
      <article class="card record"><p class="record-date">${escapeHTML(formatDate(draft.date))}</p><h3>Séance ${draft.workout}</h3><p>${countDone(draft)} / ${totalSets(draft.workout)} séries</p>
        <button class="button secondary" data-action="resume" data-date="${draft.date}" data-workout="${draft.workout}">Reprendre</button></article>`).join('')}</div>` : ''}
    <h2>Séances enregistrées</h2>
    ${sessions.length ? `<div class="record-grid">${sessions.map(session => `<article class="card record">
      <p class="record-date">${escapeHTML(formatDate(session.date, {weekday:'short', day:'numeric', month:'long', year:'numeric'}))}</p>
      <h3>Séance ${session.workout}</h3><p>${countDone(session)} / ${totalSets(session.workout)} séries validées</p>
      ${session.notes ? `<p class="record-note">${escapeHTML(session.notes)}</p>` : ''}
      <div class="actions"><button class="button secondary" data-action="edit-session" data-id="${escapeHTML(session.id)}">Ouvrir</button>
        <button class="button text-danger" data-action="delete-session" data-id="${escapeHTML(session.id)}">Supprimer</button></div></article>`).join('')}</div>`
      : '<div class="card empty"><h3>Le journal est encore vide</h3><p>Tes séances apparaîtront ici après leur enregistrement.</p><button class="button primary" data-page="workout">Ouvrir ma séance</button></div>'}`;
}

function chart(points, label) {
  if (!points.length) return '<p class="empty-chart">Les valeurs apparaîtront après une séance enregistrée.</p>';
  const max = Math.max(1, ...points.map(point => point.value));
  const xy = points.map((point, index) => [points.length === 1 ? 252 : 42 + index * 420 / (points.length - 1), 142 - point.value * 115 / max]);
  const format = value => new Intl.NumberFormat('fr-BE', {maximumFractionDigits: 2}).format(value);
  const dateLabel = point => formatDate(point.date, {day:'numeric', month:'short'});
  return `<svg class="chart" viewBox="0 0 496 172" role="img" aria-label="${escapeHTML(label)}">
    ${[0,1,2,3].map(index => `<line x1="42" x2="462" y1="${27 + index * 115 / 3}" y2="${27 + index * 115 / 3}"/><text x="2" y="${31 + index * 115 / 3}">${format(max * (3-index) / 3)}</text>`).join('')}
    <polyline points="${xy.map(point => point.join(',')).join(' ')}"/>
    ${xy.map(([x, y], index) => `<circle cx="${x}" cy="${y}" r="4"><title>${escapeHTML(dateLabel(points[index]))}, ${format(points[index].value)}</title></circle>`).join('')}
    <text text-anchor="${points.length === 1 ? 'middle' : 'start'}" x="${xy[0][0]}" y="165">${escapeHTML(dateLabel(points[0]))}</text>
    ${points.length > 1 ? `<text text-anchor="end" x="462" y="165">${escapeHTML(dateLabel(points.at(-1)))}</text>` : ''}
  </svg><p class="chart-last">Dernière valeur <strong>${format(points.at(-1).value)}</strong></p>`;
}

function progressPage() {
  const showCableCrunch = data.sessions.some(session => session.exercises.crunch?.some(set => set.done));
  const choices = showCableCrunch ? TRACKED_EXERCISES : EXERCISES;
  if (!choices.some(ex => ex.id === chartId)) chartId = choices[0].id;
  const ex = choices.find(item => item.id === chartId);
  const points = sortSessions(data.sessions).reverse().flatMap(session => {
    const sets = (session.exercises[chartId] || []).filter(set => set.done);
    if (!sets.length) return [];
    const loads = sets.filter(set => numericLoad.test(set.load)).map(set => Number(set.load.replace(',', '.'))).filter(Number.isFinite);
    const bands = [...new Set(sets.map(set => set.load).filter(hasLoad))];
    return [{date: session.date, reps: sets.reduce((sum, set) => sum + (Number(set.reps) || 0), 0), load: loads.length ? Math.max(...loads) : null, bands}];
  });
  return `<div class="page-heading"><div><h1>Progression</h1><p class="subtitle">À partir des séries validées dans le journal.</p></div></div>
    <div class="metrics"><div class="card"><strong>${data.sessions.length}</strong><span>Séances</span></div><div class="card"><strong>${data.sessions.reduce((count, session) => count + countDone(session), 0)}</strong><span>Séries validées</span></div></div>
    <section class="card settings-card">
      <label class="field" for="chart-ex">Exercice</label>
      <select id="chart-ex">${choices.map(item => `<option value="${item.id}" ${item.id === chartId ? 'selected' : ''}>${escapeHTML(item.name)}</option>`).join('')}</select>
      <h2>Répétitions par séance</h2>
      ${chart(points.map(point => ({date: point.date, value: point.reps})), 'Total des répétitions validées par séance')}
      ${isBand(ex) ? `<h2>Bandes utilisées</h2><ul class="band-history">${points.filter(point => point.bands.length).slice(-6).reverse().map(point => `<li>${escapeHTML(formatDate(point.date, {day:'numeric', month:'short', year:'numeric'}))}<strong>${escapeHTML(point.bands.join(' · '))}</strong></li>`).join('') || '<li>Aucune bande renseignée pour cet exercice.</li>'}</ul>`
          : `<h2>Charge maximale <small>${escapeHTML(ex.unit)}</small></h2>${chart(points.flatMap(point => point.load === null ? [] : [{date: point.date, value: point.load}]), 'Charge maximale validée par séance')}`}
    </section>`;
}

function guidePage() {
  return `<div class="page-heading"><div><h1>Guide</h1><p class="subtitle">Ton programme A/B et les gestes, exercice par exercice.</p></div></div>
    <section class="card settings-card">
      <h2>Ton programme A/B</h2>
      <div class="segments" role="group" aria-label="Semaine du programme">${[1,2].map(week => `<button id="week-${week}" data-action="week" data-week="${week}" aria-pressed="${data.settings.week === week}">Semaine ${week}</button>`).join('')}</div>
      <div class="week">${['Dimanche','Mardi','Jeudi'].map((day, index) => `<div><span>${day}</span><strong>${(data.settings.week === 1 ? 'ABA' : 'BAB')[index]}</strong></div>`).join('')}</div>
      <ul class="guide-notes">
        <li>Échauffement prévu dans ton programme : 5 min de marche ou de vélo doux, puis une série légère du premier exercice.</li>
        <li>Comme repère, garde environ 1 à 2 répétitions possibles en fin de série. Quand toutes les séries atteignent le haut de la fourchette avec un geste maîtrisé, augmente légèrement la charge.</li>
        <li>Pour les élastiques, garde des bandes et une distance à l’ancrage comparables d’une séance à l’autre.</li>
        <li>Garde les exercices de rééducation du kiné séparés. Si un mouvement réveille la douleur près de l’omoplate, arrête-le et demande conseil à ton kiné. Les shrugs restent facultatifs, après son accord.</li>
      </ul>
    </section>
    <h2>Bibliothèque des exercices</h2>
    <div class="library-list">${EXERCISES.map(ex => `<button class="library-item card" id="guide-${ex.id}" data-action="technique" data-ex="${ex.id}">
      <span><strong>${escapeHTML(ex.name)}</strong><small>${escapeHTML(ex.gear)}</small></span>${icon('guide', 20)}
    </button>`).join('')}</div>`;
}

function settingsPage() {
  return `<div class="page-heading"><div><h1>Réglages</h1></div></div>
    <section class="card settings-card">
      <h2>Chronomètre de repos</h2>
      <label class="toggle"><input id="auto-rest" type="checkbox" ${data.settings.autoRest ? 'checked' : ''}><span>Lancer après chaque série validée</span></label>
      <label class="field" for="rest-duration">Durée par défaut</label>
      <select id="rest-duration">${[60,90,120].map(seconds => `<option value="${seconds}" ${data.settings.rest === seconds ? 'selected' : ''}>${clockText(seconds)}</option>`).join('')}</select>
    </section>
    <section class="card settings-card">
      <h2>Données et sauvegarde</h2>
      <p>Tes séances, tes brouillons et tes charges restent dans le stockage de cette app sur cet appareil. Pour les transférer vers une nouvelle adresse ou un autre appareil, exporte puis importe un JSON. Les sauvegardes Home Gym V6 sont compatibles.</p>
      <div class="actions"><button class="button primary" data-action="export-json">${icon('download',17)} Exporter JSON</button>
        <button class="button secondary" data-action="export-csv">Exporter CSV</button>
        <button class="button secondary" data-action="import">Importer JSON</button>
        <input hidden type="file" id="import-json" accept=".json,application/json"></div>
    </section>
    <section class="card settings-card">
      <h2>Installer sur iPhone</h2>
      <p>Ouvre cette adresse dans Safari. Dans le menu Partager, sélectionne « Sur l’écran d’accueil » puis « Ajouter ». Ouvre une première fois l’app avec une connexion pour préparer le mode hors ligne.</p>
    </section>
    <section class="card settings-card"><h2>Effacer les données</h2>
      <p>Cette action supprime les séances, les brouillons et les charges mémorisées de cette app sur l’appareil.</p>
      <button class="button text-danger" data-action="erase">Effacer les données locales</button>
    </section>`;
}

function openEditor(title, contents, trigger, className = '') {
  editorTrigger = trigger;
  editor.className = className;
  editor.innerHTML = `<div class="dialog-head"><h2 id="editor-title">${title}</h2>
    <button type="button" class="icon-button" data-action="close" aria-label="Fermer">${icon('close')}</button></div>${contents}`;
  if (!editor.open) editor.showModal();
}

editor.addEventListener('click', event => {
  if (event.target === editor) editor.close();
});
editor.addEventListener('close', () => {
  stopMotion?.();
  stopMotion = null;
  if (!editorTrigger) return;
  document.getElementById(editorTrigger)?.focus({preventScroll: true});
  editorTrigger = null;
});

function openLoad(ex, trigger, pendingIndex) {
  const current = exerciseLoad(data, workout, ex.id, Boolean(editId));
  const band = isBand(ex);
  openEditor(band ? 'Bandes utilisées' : 'Charge utilisée', `
    <p class="dialog-context">${escapeHTML(ex.name)}</p>
    <form id="load-form">
      <label class="field" for="edit-load">${band ? 'Couleur ou combinaison' : escapeHTML(ex.unit)}</label>
      <input autofocus id="edit-load" value="${escapeHTML(current)}" inputmode="${band ? 'text' : 'decimal'}" maxlength="60" placeholder="${band ? 'P. ex. rouge + noire' : 'P. ex. 12,5'}" autocomplete="off" required>
      <p class="help-text">${editId ? 'Appliquée aux prochaines séries cochées de cette séance.' : 'Mémorisée pour cet exercice dans les séances A et B. Les séries déjà validées gardent leur charge.'}</p>
      <p class="form-error" id="load-error" role="alert" hidden></p>
      <div class="actions">
        <button class="button primary" type="submit">${pendingIndex === undefined ? 'Mémoriser' : 'Mémoriser et valider'}</button>
        <button class="button secondary" type="button" data-action="skip-load">${pendingIndex === undefined ? 'Sans charge notée' : 'Valider sans charge'}</button>
      </div>
    </form>`, trigger);
  const input = editor.querySelector('#edit-load');
  editor.querySelector('#load-form').onsubmit = event => {
    event.preventDefault();
    const load = parseLoad(ex, input.value);
    if (load === null) {
      const error = editor.querySelector('#load-error');
      error.textContent = band ? 'Indique une bande ou une combinaison.' : 'Entre un poids en kg, par exemple 12,5.';
      error.hidden = false;
      input.focus();
      return;
    }
    applyLoad(ex, load, pendingIndex, trigger);
  };
  editor.querySelector('[data-action="skip-load"]').onclick = () => applyLoad(ex, '', pendingIndex, trigger);
}

function applyLoad(ex, load, pendingIndex, trigger) {
  const skipped = {...workout.skipped};
  if (!load) skipped[ex.id] = 'yes';
  else delete skipped[ex.id];
  const next = {...workout, loads: {...workout.loads, [ex.id]: load}, skipped};
  const loads = editId || !load ? data.loads : {...data.loads, [ex.id]: load};
  if (pendingIndex !== undefined) {
    if (!applySet(ex, pendingIndex, next, loads, trigger)) return;
  } else {
    if (!storeWorkout(next, loads)) return;
    render({keepPosition:true, focusId:trigger});
    if (load) toast(editId ? 'Charge modifiée pour cette séance.' : 'Charge mémorisée.');
  }
  editor.close();
}

function openReps(ex, index, trigger) {
  const saved = workout.exercises[ex.id][index];
  openEditor('Répétitions', `<p class="dialog-context">${escapeHTML(ex.name)} · Série ${index + 1}</p>
    <form id="reps-form">
      <label class="field" for="edit-reps">${ex.target.includes('/') ? 'Répétitions ' + escapeHTML(ex.target.split('/')[1].trim() === 'jambe' ? 'par jambe' : 'par côté') : 'Nombre de répétitions'}</label>
      <div class="stepper">
        <button type="button" class="button secondary" data-step="-1" aria-label="Retirer une répétition">${icon('minus')}</button>
        <input autofocus id="edit-reps" type="number" inputmode="numeric" min="0" max="999" step="1" required value="${escapeHTML(saved.reps || defaultReps(ex))}">
        <button type="button" class="button secondary" data-step="1" aria-label="Ajouter une répétition">${icon('plus')}</button>
      </div>
      <button class="button primary" type="submit">Enregistrer</button>
    </form>`, trigger);
  const input = editor.querySelector('#edit-reps');
  editor.querySelectorAll('[data-step]').forEach(button => button.onclick = () => {
    input.value = Math.min(999, Math.max(0, Number(input.value) + Number(button.dataset.step)));
  });
  editor.querySelector('#reps-form').onsubmit = event => {
    event.preventDefault();
    const next = withSet(workout, ex, index, {...saved, reps: String(Number(input.value))});
    if (!storeWorkout(next)) return;
    render({keepPosition: true, focusId: trigger});
    editor.close();
  };
}

const MOTION_FRAMES = 24;
const MOTION_COLUMNS = 6;
const MOTION_CYCLE = 4300;

function technique(ex, trigger) {
  const guide = EXPLAIN[ex.id];
  openEditor(escapeHTML(ex.name), `<p class="dialog-context">${escapeHTML(ex.gear)}</p>
    <figure class="movement">
      <div class="motion-stage">
        <img src="exercises/${ex.id}-motion.webp" alt="" width="3072" height="1344" decoding="async" aria-hidden="true">
        <p class="motion-unavailable" hidden>Démonstration indisponible</p>
      </div>
      <figcaption class="motion-controls">
        <button type="button" class="motion-play icon-button" aria-label="Lire la démonstration">${icon('play')}</button>
        <div class="motion-timeline">
          <label class="visually-hidden" for="motion-position">Position dans le mouvement</label>
          <input id="motion-position" type="range" min="0" max="${MOTION_FRAMES - 1}" value="0">
          <div class="motion-positions">
            <button type="button" data-motion-frame="0">Départ</button>
            <button type="button" data-motion-frame="${MOTION_FRAMES - 1}">Fin de l’effort</button>
          </div>
        </div>
      </figcaption>
    </figure>
    <h3>Mise en place</h3><p>${escapeHTML(guide.setup)}</p>
    <h3>Mouvement</h3><ol class="technique-steps">${guide.steps.map(step => `<li>${escapeHTML(step)}</li>`).join('')}</ol>
    <p class="notice"><strong>À éviter</strong> ${escapeHTML(guide.avoid)}</p>
    <p class="help-text">${escapeHTML(ex.muscles)}</p>
    ${guide.source ? `<a class="technique-source" href="${escapeHTML(guide.source)}" target="_blank" rel="noopener noreferrer">Voir les photos de référence Bodylastics</a>` : ''}
  `, trigger, 'wide-dialog');
  stopMotion = connectMotion();
}

function phasePosition(phase) {
  if (phase < 0.11) return 0;
  if (phase < 0.46) return smoothStep((phase - 0.11) / 0.35);
  if (phase < 0.59) return 1;
  return 1 - smoothStep((phase - 0.59) / 0.41);
}

function smoothStep(value) {
  return value * value * (3 - 2 * value);
}

function connectMotion() {
  const figure = editor.querySelector('.movement');
  const img = figure.querySelector('img');
  const slider = figure.querySelector('input');
  const play = figure.querySelector('.motion-play');
  const positions = figure.querySelectorAll('[data-motion-frame]');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let handle = null;
  let playing = false;
  let origin;
  let phase = 0;
  let frame = -1;

  function show(next) {
    if (frame === next) return;
    frame = next;
    const column = next % MOTION_COLUMNS;
    const row = Math.floor(next / MOTION_COLUMNS);
    img.style.transform = `translate3d(-${column * 100 / MOTION_COLUMNS}%, -${row * 100 / (MOTION_FRAMES / MOTION_COLUMNS)}%, 0)`;
    slider.value = next;
    const words = next === 0 ? 'Départ' : next === MOTION_FRAMES - 1 ? 'Fin de l’effort' : Math.round(next / (MOTION_FRAMES - 1) * 100) + ' %';
    slider.setAttribute('aria-valuetext', words);
  }

  function tick(time) {
    origin ??= time;
    phase = ((time - origin) % MOTION_CYCLE) / MOTION_CYCLE;
    show(Math.round(phasePosition(phase) * (MOTION_FRAMES - 1)));
    handle = requestAnimationFrame(tick);
  }

  function setPlaying(next) {
    playing = next;
    cancelAnimationFrame(handle);
    handle = null;
    play.setAttribute('aria-label', next ? 'Mettre la démonstration en pause' : 'Lire la démonstration');
    play.innerHTML = icon(next ? 'pause' : 'play');
    if (next) {
      origin = performance.now() - phase * MOTION_CYCLE;
      handle = requestAnimationFrame(tick);
    }
  }

  function loadError() {
    setPlaying(false);
    img.hidden = true;
    figure.querySelector('.motion-unavailable').hidden = false;
    figure.querySelector('.motion-controls').hidden = true;
  }

  function onPreference(event) {
    if (event.matches) setPlaying(false);
  }

  function seek(next) {
    setPlaying(false);
    // Invert the easing curve so playback resumes at the selected frame.
    const fraction = next / (MOTION_FRAMES - 1);
    const linear = 0.5 - Math.sin(Math.asin(1 - 2 * fraction) / 3);
    phase = next === 0 ? 0 : 0.11 + 0.35 * linear;
    show(next);
  }

  play.onclick = () => setPlaying(!playing);
  slider.onfocus = () => { if (playing) setPlaying(false); };
  slider.oninput = () => seek(Number(slider.value));
  for (const position of positions) {
    position.onclick = () => seek(Number(position.dataset.motionFrame));
  }
  show(0);
  img.addEventListener('error', loadError, {once: true});
  if (img.complete && !img.naturalWidth) loadError();
  else if (!preference.matches) setPlaying(true);
  preference.addEventListener('change', onPreference);
  return () => {
    cancelAnimationFrame(handle);
    preference.removeEventListener('change', onPreference);
    img.removeEventListener('error', loadError);
  };
}

function withSet(draft, ex, index, value) {
  const sets = [...draft.exercises[ex.id]];
  sets[index] = value;
  return {...draft, exercises: {...draft.exercises, [ex.id]: sets}};
}

function applySet(ex, index, draft, loads, trigger) {
  const previous = draft.exercises[ex.id][index];
  const done = !previous.done;
  const set = done ? {
    done: true, load: exerciseLoad(data, draft, ex.id, Boolean(editId)),
    reps: previous.reps || defaultReps(ex)
  } : {...previous, done: false, load: ''};
  const timer = done && !editId && data.settings.autoRest ? timerFor(data.settings.rest) : data.timer;
  const updated = withSet(draft, ex, index, set);
  if (done) updated.loads = {...updated.loads, [ex.id]: set.load};
  if (!storeWorkout(updated, loads, timer)) return false;
  render({keepPosition:true, focusId:trigger});
  return true;
}

function toggleSet(ex, index, trigger) {
  if (!workout.exercises[ex.id][index].done && !exerciseLoad(data, workout, ex.id, Boolean(editId)) && !workout.skipped[ex.id]) {
    openLoad(ex, trigger, index);
    return;
  }
  applySet(ex, index, workout, data.loads, trigger);
}

function selectWorkout(next) {
  if (page === 'workout' && next.workout === selection.workout && next.date === selection.date && !editId) return;
  if (!commit({...data, selection: next})) return;
  selection = next;
  editId = null;
  workout = makeDraft(data, selection, editId);
  page = 'workout';
  render();
}

function saveSession() {
  const count = countDone(workout);
  if (!count) return;
  const existing = data.sessions.find(session => session.id === editId);
  const saved = {
    ...workout, id: existing?.id || (globalThis.crypto?.randomUUID?.() ?? 'session-' + Date.now() + '-' + Math.random().toString(36).slice(2)),
    created: existing?.created || new Date().toISOString()
  };
  const drafts = {...data.drafts};
  delete drafts[draftKey(selection, editId)];
  const sessions = existing ? data.sessions.map(session => session.id === editId ? saved : session) : [...data.sessions, saved];
  const next = {...data, drafts, sessions};
  if (!editId) {
    delete next.selection;
    delete next.timer;
  }
  if (!commit(next)) return;
  closeSession('history');
  toast('Séance enregistrée.');
}

function closeSession(destination) {
  editId = null;
  selection = nextDateWorkout(data);
  workout = makeDraft(data, selection, editId);
  page = destination;
  render();
}

function editSession(id) {
  const session = data.sessions.find(item => item.id === id);
  if (!session) return;
  editId = id;
  selection = {date: session.date, workout: session.workout};
  workout = makeDraft(data, selection, editId);
  page = 'workout';
  render();
}

function deleteSession(id) {
  if (!confirm('Supprimer cette séance du journal ?')) return;
  const drafts = {...data.drafts};
  delete drafts['edit_' + id];
  if (!commit({...data, drafts, sessions: data.sessions.filter(session => session.id !== id)})) return;
  render({keepPosition: true});
  toast('Séance supprimée.');
}

function clockText(seconds) {
  return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
}

function timerFor(duration) {
  return {end: Date.now() + duration * 1000, duration};
}

function timerAction(seconds) {
  const timer = seconds ? timerFor(seconds) : undefined;
  if (commit({...data, timer})) updateTimer(false);
}

function updateTimer(notify = true) {
  const panel = document.querySelector('#timer');
  const timer = data.timer;
  if (!timer) {
    panel.hidden = true;
    delete panel.dataset.end;
    return;
  }
  const left = Math.max(0, Math.ceil((timer.end - Date.now()) / 1000));
  if (!left && Date.now() - timer.end > 4 * 60 * 1000) {
    panel.hidden = true;
    return;
  }
  panel.hidden = false;
  if (panel.dataset.end !== String(timer.end)) {
    panel.dataset.end = timer.end;
    panel.innerHTML = `<span class="timer-icon">${icon('clock',20)}</span><div><span id="timer-label">Repos</span><strong id="timer-time"></strong></div>
      <button class="button timer-add" data-action="add-time">+15 s</button>
      <button class="icon-button" data-action="stop-timer" aria-label="Fermer le chronomètre">${icon('close')}</button>`;
  }
  panel.querySelector('#timer-time').textContent = clockText(left);
  panel.querySelector('#timer-label').textContent = left ? 'Repos' : 'Repos terminé';
  if (!left && notify && notifiedTimer !== timer.end) {
    notifiedTimer = timer.end;
    if (navigator.vibrate) navigator.vibrate(140);
    toast('Temps de repos terminé.');
  }
}

function download(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], {type: type + ';charset=utf-8'}));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function exportJson() {
  if (storageProblem) {
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) download('home-gym-donnees-locales-' + localDate() + '.json', raw, 'application/json');
      else toast('Aucune donnée locale à exporter.');
    } catch { toast('Stockage indisponible.'); }
    return;
  }
  download('home-gym-sauvegarde-' + localDate() + '.json',
    JSON.stringify({app: 'Home Gym', exported: new Date().toISOString(), data}, null, 2), 'application/json');
}

function csvCell(value) {
  let field = String(value ?? '');
  if (/^[\s]*[=+\-@]|^[\t\r\n]/.test(field)) field = "'" + field;
  return '"' + field.replace(/"/g, '""') + '"';
}

function exportCsv() {
  const rows = [['Date','Séance','Exercice','Série','Charge / bande','Répétitions','Validée','Notes']];
  for (const session of sortSessions(data.sessions)) {
    for (const [id, sets] of Object.entries(session.exercises)) {
      const name = TRACKED_EXERCISES.find(ex => ex.id === id)?.name || id;
      sets.forEach((set, index) => rows.push([session.date, session.workout, name, index + 1, set.load, set.reps, set.done ? 'Oui' : 'Non', session.notes]));
    }
  }
  download('home-gym-journal-' + localDate() + '.csv', '\ufeff' + rows.map(row => row.map(csvCell).join(';')).join('\r\n'), 'text/csv');
}

async function importJson(input) {
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  let imported;
  try {
    const document = JSON.parse(await file.text());
    imported = normalizeData(document.data || document);
    delete imported.timer;
  } catch {
    toast('Ce fichier n’est pas une sauvegarde Home Gym compatible.');
    return;
  }
  if (!confirm(`Importer ${imported.sessions.length} séance(s) ? Les données locales actuelles seront remplacées.`)) return;
  if (!commit(imported, true)) return;
  closeSession('settings');
  toast('Sauvegarde importée.');
}

function setSettings(values) {
  return commit({...data, settings: {...data.settings, ...values}});
}

app.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  const {action, ex: exId, set, seconds, id, week} = button.dataset;
  if (button.dataset.page) {
    if (button.dataset.page === page) return;
    page = button.dataset.page;
    render({focusId: 'content'});
    return;
  }
  const ex = TRACKED_EXERCISES.find(item => item.id === exId);
  if (!action && button.dataset.workout) selectWorkout({...selection, workout: button.dataset.workout});
  if (action === 'load') openLoad(ex, button.id);
  if (action === 'reps') openReps(ex, Number(set), button.id);
  if (action === 'set') toggleSet(ex, Number(set), button.id);
  if (action === 'technique') technique(ex, button.id);
  if (action === 'choose-rest') openEditor('Chronomètre de repos', `<div class="segments dialog-rest" role="group" aria-label="Lancer le repos">
    ${[60,90,120].map(delay => `<button data-seconds="${delay}">${clockText(delay)}</button>`).join('')}
  </div>`, button.id);
  if (action === 'start-timer') timerAction(Number(seconds));
  if (action === 'stop-timer') timerAction(0);
  if (action === 'add-time') {
    const end = Math.max(data.timer.end, Date.now()) + 15000;
    if (commit({...data, timer: {...data.timer, end}})) {
      updateTimer(false);
      document.querySelector('[data-action="add-time"]').focus({preventScroll: true});
    }
  }
  if (action === 'save-session') saveSession();
  if (action === 'edit-session') editSession(id);
  if (action === 'exit-edit') closeSession('history');
  if (action === 'delete-session') deleteSession(id);
  if (action === 'resume') selectWorkout({date: button.dataset.date, workout: button.dataset.workout});
  if (action === 'week' && setSettings({week: Number(week)})) render({keepPosition:true, focusId:button.id});
  if (action === 'export-json') exportJson();
  if (action === 'export-csv') exportCsv();
  if (action === 'import') document.querySelector('#import-json').click();
  if (action === 'erase' && confirm('Effacer toutes les données Home Gym de cet appareil ?') && commit(newData(), true)) {
    closeSession('settings');
    toast('Données locales effacées.');
  }
});

editor.addEventListener('click', event => {
  const delay = event.target.closest('[data-seconds]')?.dataset.seconds;
  if (delay) {
    timerAction(Number(delay));
    editor.close();
  }
  if (event.target.closest('[data-action="close"]')) editor.close();
});

app.addEventListener('input', event => {
  if (event.target.id === 'session-notes' && !storeWorkout({...workout, notes: event.target.value})) {
    event.target.value = workout.notes;
  }
});

app.addEventListener('change', event => {
  const {id, value, checked} = event.target;
  if (id === 'workout-date') {
    if (isDate(value)) selectWorkout({...selection, date: value});
    else event.target.value = selection.date;
  }
  if (id === 'chart-ex') {
    chartId = value;
    render({keepPosition:true, focusId:id});
  }
  if (id === 'auto-rest' && !setSettings({autoRest: checked})) event.target.checked = data.settings.autoRest;
  if (id === 'rest-duration' && !setSettings({rest: Number(value)})) event.target.value = data.settings.rest;
  if (id === 'import-json') importJson(event.target);
});

window.addEventListener('storage', event => {
  if (event.key !== STORE) return;
  try {
    data = event.newValue ? normalizeData(JSON.parse(event.newValue)) : newData();
  } catch { return; }
  if (editId && !data.sessions.some(session => session.id === editId)) {
    editId = null;
    selection = nextDateWorkout(data);
  }
  workout = makeDraft(data, selection, editId);
  if (editor.open) editor.close();
  render({keepPosition: true});
});
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) updateTimer();
});
render();
setInterval(updateTimer, 350);

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('./sw.js', {updateViaCache:'none'}).catch(() => {});
}
