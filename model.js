'use strict';

const STORE = 'homegym_v6_data_v1';
const newData = () => ({version: 2, sessions: [], drafts: {}, loads: {}, settings: {week: 1, rest: 90, autoRest: true}});
const emptySet = () => ({load: '', reps: '', done: false});
const isObject = value => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const numericLoad = /^(?:\d+(?:[.,]\d+)?|[.,]\d+)$/;
const isBand = ex => ex.unit === 'bande(s)';
const defaultReps = ex => ex.target.match(/^\d+/)[0];
const hasLoad = value => typeof value === 'string' && value.trim() !== '';
const sortSessions = sessions => [...sessions].sort((a, b) => b.date.localeCompare(a.date) || b.created.localeCompare(a.created));

function localDate(date = new Date()) {
  const midnight = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return midnight.toISOString().slice(0, 10);
}

function isDate(value) {
  if (typeof value !== 'string' || !datePattern.test(value)) return false;
  const date = new Date(value + 'T12:00:00Z');
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function textField(value) {
  if (value == null) return '';
  if (typeof value !== 'string' && typeof value !== 'number') throw Error('Valeur invalide');
  return String(value);
}

function knownLoads(value) {
  if (value === undefined) return {};
  if (!isObject(value)) throw Error('Charges invalides');
  return Object.fromEntries(TRACKED_EXERCISES.filter(ex => Object.hasOwn(value, ex.id)).map(ex => [ex.id, textField(value[ex.id])]));
}

function sessionShape(session) {
  if (!isObject(session) || !Object.hasOwn(PROGRAM, session.workout) || !isDate(session.date) || !isObject(session.exercises)) {
    throw Error('Séance invalide');
  }
  const exercises = Object.fromEntries(Object.entries(session.exercises).map(([id, sets]) => {
    if (!Array.isArray(sets)) throw Error('Séries invalides');
    return [id, sets.map(set => {
      if (!isObject(set)) throw Error('Série invalide');
      return {load: textField(set.load), reps: textField(set.reps), done: set.done === true};
    })];
  }));
  return {
    date: session.date, workout: session.workout, notes: textField(session.notes), exercises,
    loads: knownLoads(session.loads), skipped: knownLoads(session.skipped),
    ...(typeof session.id === 'string' ? {id: session.id} : {}),
    ...(typeof session.created === 'string' ? {created: session.created} : {})
  };
}

function normalizeData(raw) {
  if (!isObject(raw) || !Array.isArray(raw.sessions) || !isObject(raw.drafts) || !isObject(raw.settings)) {
    throw Error('Sauvegarde invalide');
  }
  const data = newData();
  data.sessions = raw.sessions.map((session, index) => {
    const parsed = sessionShape(session);
    return {...parsed, id: parsed.id || 'legacy-' + index, created: parsed.created || parsed.date};
  });
  if (new Set(data.sessions.map(session => session.id)).size !== data.sessions.length) throw Error('Identifiants en double');
  data.drafts = Object.fromEntries(Object.entries(raw.drafts).map(([key, session]) => {
    const parsed = sessionShape(session);
    const linked = parsed.id && data.sessions.some(saved => saved.id === parsed.id);
    return [linked ? 'edit_' + parsed.id : key, parsed];
  }));
  data.loads = knownLoads(raw.loads);
  const historical = sortSessions(data.sessions);
  for (const ex of TRACKED_EXERCISES) {
    if (Object.hasOwn(data.loads, ex.id)) continue;
    for (const session of historical) {
      const latest = [...(session.exercises[ex.id] || [])].reverse().find(set => set.done && hasLoad(set.load));
      if (latest) {
        data.loads[ex.id] = latest.load;
        break;
      }
    }
  }
  data.settings = {
    week: raw.settings.week === 2 ? 2 : 1,
    rest: [60,90,120].includes(raw.settings.rest) ? raw.settings.rest : 90,
    autoRest: raw.settings.autoRest !== false
  };
  const selection = raw.selection;
  if (isObject(selection) && isDate(selection.date) && Object.hasOwn(PROGRAM, selection.workout)) {
    data.selection = {date: selection.date, workout: selection.workout};
  }
  if (isObject(raw.timer) && Number.isFinite(raw.timer.end) && Number.isFinite(raw.timer.duration)) {
    data.timer = {end: raw.timer.end, duration: raw.timer.duration};
  }
  return data;
}

function suggestedWorkout(data) {
  return sortSessions(data.sessions)[0]?.workout === 'A' ? 'B' : 'A';
}

function nextDateWorkout(data) {
  const today = localDate();
  const open = Object.values(data.drafts).find(draft => draft.date === today && !draft.id);
  const todayChoice = data.selection?.date === today ? data.selection.workout : null;
  return {date: today, workout: todayChoice || open?.workout || suggestedWorkout(data)};
}

function draftKey(selection, editId) {
  return editId ? 'edit_' + editId : selection.date + '_' + selection.workout;
}

function usesCableCrunch(draft, historical) {
  if (draft.workout !== 'A' || Object.hasOwn(draft.exercises, 'bandcrunch')) return false;
  return historical || Object.hasOwn(draft.loads, 'crunch')
    || Boolean(draft.exercises.crunch?.some(set => set.done || hasLoad(set.load) || set.reps));
}

function makeDraft(data, selection, editId) {
  const stored = data.drafts[draftKey(selection, editId)];
  const source = stored || data.sessions.find(session => session.id === editId);
  const draft = source ? sessionShape(source) : {...selection, notes: '', exercises: {}, loads: {}, skipped: {}};
  if (!usesCableCrunch(draft, Boolean(editId))) {
    delete draft.exercises.crunch;
    delete draft.loads.crunch;
    delete draft.skipped.crunch;
  }
  for (const ex of exercisesFor(draft.workout, usesCableCrunch(draft, Boolean(editId)))) {
    const existingSets = draft.exercises[ex.id] || [];
    if (!Object.hasOwn(draft.loads, ex.id)) {
      const previous = [...existingSets].reverse().find(set => hasLoad(set.load));
      if (previous) draft.loads[ex.id] = previous.load;
    }
    draft.exercises[ex.id] = Array.from({length: ex.sets}, (_, index) => existingSets[index] || emptySet());
  }
  return draft;
}

function exerciseLoad(data, draft, exId, editing) {
  return draft.loads[exId] ?? (editing ? '' : data.loads[exId] ?? '');
}

function countDone(session) {
  return Object.values(session.exercises).flat().filter(set => set.done).length;
}

function totalSets(workout) {
  return PROGRAM[workout].reduce((sum, ex) => sum + ex.sets, 0);
}

function parseLoad(ex, value) {
  const label = value.trim();
  if (!label || label.length > 60) return null;
  if (isBand(ex)) return label;
  if (!numericLoad.test(label)) return null;
  const kg = Number(label.replace(',', '.'));
  return Number.isFinite(kg) && kg <= 9999 ? String(kg).replace('.', ',') : null;
}

function displayLoad(ex, load) {
  if (!hasLoad(load)) return '—';
  if (isBand(ex)) return load;
  return load + (ex.unit === 'kg' ? ' kg' : ' kg/haltère');
}
