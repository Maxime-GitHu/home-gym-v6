'use strict';

const PREFIX = 'home-gym-app-';
const CACHE = PREFIX + '7-3-' + encodeURIComponent(self.registration.scope);
const SHELL = [
  './index.html', './style.css', './program.js', './model.js', './app.js', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png',
  ...['chest','pulldown','squat','row','curl','lateral','crunch','bandcrunch','legcurl','legext','triceps','kickback','pallof','calves']
    .map(id => './exercises/' + id + '-motion.webp')
];
const urls = new Set(SHELL.map(path => new URL(path, self.registration.scope).href));
const indexUrl = new URL('./index.html', self.registration.scope).href;
const entryPaths = new Set([new URL(self.registration.scope).pathname, new URL(indexUrl).pathname]);

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE)
    .then(cache => cache.addAll(SHELL.map(path => new Request(new URL(path, self.registration.scope), {cache: 'reload'}))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  const scope = encodeURIComponent(self.registration.scope);
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key.endsWith('-' + scope) && key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const {request} = event;
  if (request.method !== 'GET' || !request.url.startsWith(self.registration.scope)) return;
  if (request.mode === 'navigate' && entryPaths.has(new URL(request.url).pathname)) {
    event.respondWith(caches.open(CACHE).then(cache => cache.match(indexUrl)).then(response => response || fetch(request)));
  } else if (urls.has(request.url)) {
    event.respondWith(caches.open(CACHE).then(cache => cache.match(request)).then(response => response || fetch(request)));
  }
});
