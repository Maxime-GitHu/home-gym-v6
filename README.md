# Home Gym V6 — application iPhone (PWA)

Application personnelle de suivi du programme A/B, en français, sans serveur ni abonnement.

## Fonctions
- Séances A et B, 15 fiches d'exercices (exercices communs inclus), muscles, consignes et séries
- Charges, couleurs/combinaisons d'élastiques, répétitions et cases « fait »
- Brouillon enregistré au fil de la saisie, reprise d'une séance, historique modifiable
- Dernières charges utilisées, chronomètre de repos 60/90/120 s
- Graphiques de progression, export CSV et sauvegarde/restauration JSON
- Mode hors ligne après installation, interface iPhone/iPad/ordinateur
- Aucun compte, aucun cookie de suivi, aucune API externe

## Publication gratuite : GitHub Pages
1. Créer un compte GitHub (si nécessaire) et un dépôt public, par exemple `home-gym-v6`.
2. Ajouter **le contenu** de ce dossier à la racine du dépôt : `index.html`, `style.css`, `app.js`, `sw.js`, `manifest.webmanifest` et `icons/`.
3. Dans **Settings → Pages → Build and deployment**, choisir **Deploy from a branch**, `main` et `/ (root)` ; enregistrer.
4. Attendre la publication, puis ouvrir l'URL `https://VOTRE_IDENTIFIANT.github.io/home-gym-v6/` dans Safari sur iPhone.
5. Dans Safari, toucher **Partager → Sur l'écran d'accueil → Ajouter**.
6. Ouvrir l'icône Home Gym. Après le premier chargement, l'application peut fonctionner hors ligne.

**Important :** un dépôt GitHub Pages gratuit est normalement **public** : le code et le programme d'exercices sont visibles, mais **pas les séances personnelles**, qui restent enregistrées localement sur ton appareil. Ne publie jamais tes fichiers JSON de sauvegarde dans le dépôt.

## Tester sur ordinateur
Dans le dossier : `python -m http.server 8000`, puis ouvrir `http://localhost:8000`.
Le mode hors ligne et l'installation sur iPhone nécessitent HTTPS (GitHub Pages le fournit). Un simple double-clic sur `index.html` n'est pas un test PWA fiable.

## Sauvegarde et limites
- Les données sont conservées dans `localStorage` sur l'appareil et dans le contexte de navigation utilisé ; elles **ne se synchronisent pas** entre iPhone, iPad et ordinateur.
- Exporter régulièrement le JSON dans Fichiers/iCloud Drive. L'import remplace l'historique courant.
- Effacer les données Safari, désinstaller l'app ou un nettoyage iOS peut entraîner une perte de données locales.
- Le site héberge uniquement le code statique ; aucun serveur ne reçoit les charges saisies.
- L'app est une PWA, pas une application native App Store. Certaines fonctions et politiques de stockage dépendent d'iOS.
- Le programme d'entraînement n'est pas un protocole de rééducation. Les exercices du kiné restent séparés.

## Mise à jour
Modifier les fichiers et les repousser sur GitHub Pages. Le cache hors ligne est versionné dans `sw.js` (`CACHE`). Pour forcer le rafraîchissement des appareils lors d'une mise à jour, changer `home-gym-v6-1` en `home-gym-v6-2`, etc.


## Visuels réalistes (v3)
12 fiches incluent des démonstrations réalistes de départ et de fin du mouvement, générées pour cette application. Les images sont locales et mises en cache pour une consultation hors ligne. Le mouvement des mollets conserve un schéma. Les visuels sont pédagogiques, pas des captures Apple Fitness ni des vidéos.

## V6.1 — Validation visuelle des exercices

Chaque exercice affiche désormais un indicateur de progression (0/3, 1/3, etc.). Dès que toutes ses séries sont cochées, une coche verte « Terminé » apparaît et sa fiche change subtilement de couleur. L'indicateur se met à jour immédiatement, y compris si une série est décochée. Les coches individuelles et l'enregistrement automatique restent inchangés.
