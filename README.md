# Home Gym 7

Carnet personnel de musculation A/B pour iPhone. L’archive contient un site statique prêt à héberger, avec les 13 démonstrations animées du programme et les icônes.

## Mise à jour d’une installation existante

1. Depuis l’app déjà installée, ouvre **Réglages → Exporter JSON**. Enregistre le fichier dans Fichiers.
2. Pour mettre à jour une installation existante, remplace les fichiers de l’ancien hébergement par tout le contenu de cette archive, à la même adresse. Inclue les dossiers `icons` et `exercises`. L’app lit la même clé de stockage local et convertit les données à la première saisie. Après publication, ouvre l’app en ligne, puis ferme et rouvre-la si elle affiche encore l’ancienne version.
3. Si tu changes d’adresse ou d’appareil, installe d’abord la nouvelle app, puis utilise **Réglages → Importer JSON** dans l’app installée. L’import remplace les données du stockage où tu l’effectues.

## Installer sur iPhone

- Héberge le contenu de l’archive à une adresse HTTPS. Pour GitHub Pages, place `index.html` et les autres fichiers à la racine publiée.
- Dans Safari, ouvre l’adresse, touche **Partager → Sur l’écran d’accueil → Ajouter** et ouvre l’icône Home Gym une première fois avec une connexion.
- Les séances, les démonstrations et le guide restent utilisables hors ligne après le premier chargement complet. Le chronomètre se recale quand tu reviens dans l’app. Le stockage est propre à cette installation et à cet appareil.

## Pendant une séance

- **Charge ou bandes**. Renseigne la valeur une fois. Le crayon est à côté de la valeur mémorisée. Un changement s’applique aux prochaines séries cochées. Les séries déjà validées gardent leur poids.
- **Séries**. Touche la coche pour valider. Les répétitions affichées partent du bas de la fourchette du programme. Touche le nombre pour indiquer tes répétitions réelles, même après validation.
- **Technique**. Ouvre la démonstration depuis un exercice ou le guide. Tu peux la mettre en pause, parcourir les positions avec le curseur ou passer directement au départ et à la fin de l’effort. Si la réduction des animations est activée sur l’appareil, lance la lecture avec le bouton.
- **Repos**. Le compteur part par défaut après une série. Tu peux changer la durée ou désactiver le départ automatique dans Réglages.
- **Journal**. Enregistre la séance quand tu as fini. Si tu quittes l’app entre-temps, elle laisse le brouillon dans le journal. Une modification de charge dans une séance du journal s’applique à cette séance. Pour corriger une série déjà validée, décoche-la, ajuste sa charge au crayon puis recoche-la.
- **Sauvegarde**. Le JSON transporte l’historique, les brouillons, les charges et les réglages. Le CSV sert à consulter les séries dans un tableur.

## Crunch à l’élastique

Les nouvelles séances A proposent le crunch à genoux face à un ancrage haut, à raison de 3 séries de 12 à 15 répétitions. Les charges à la poulie restent en kg dans les anciennes séances. Si tu avais déjà commencé à noter un crunch à la poulie dans un brouillon, tu peux terminer cette séance avec la même variante. [Référence Bodylastics](https://bodylastics.com/exercises/resistance-bands/abs/kneeling-crunch)

## Changements depuis la V6

| Point observé | Mise à jour |
| --- | --- |
| Charge saisie dans chaque série et ancienne charge affichée en référence | Une charge mémorisée par exercice dans A et B. Les séries validées gardent leur valeur dans le journal. |
| Saisie dispersée pendant les séances, nombreux boutons de repos | Cartes compactes, grandes coches, raccourcis de séance et chronomètre commun. |
| Illustrations générées parfois incohérentes et schéma générique pour les mollets | Treize mouvements animés avec lecture, pause et positions accessibles à l’arrêt. Les élastiques sont dessinés en orange. Pour le leg curl debout, l’ancrage est bas devant toi, dans l’axe opposé au déplacement du talon. |
| Une nouvelle séance à la même date pouvait écraser l’ancienne | Chaque enregistrement a son propre identifiant. Les corrections du journal et les brouillons du jour sont distincts. |
| Les charges vides pouvaient apparaître à 0 kg dans le graphique | Seules les valeurs numériques renseignées entrent dans le graphique. Les combinaisons d’élastiques ont leur propre liste. |
| Le cache V6 pouvait supprimer les caches d’autres apps sur la même adresse | Le nouveau service worker limite son nettoyage à ses versions et à son périmètre. |

Hevy affiche les valeurs de la séance précédente et permet de les recopier d’un geste. Liftosaur propose une progression automatique configurable. Ici, la charge est reconduite automatiquement et tu décides quand la modifier. [Hevy](https://www.hevyapp.com/features/track-exercises/) · [Liftosaur](https://www.liftosaur.com/features/program-editor)
