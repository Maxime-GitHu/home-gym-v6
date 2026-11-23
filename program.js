'use strict';

const PROGRAM = {
  A: [
    {id:'chest',name:'Développé poitrine',gear:'Home gym',muscles:'Pectoraux · triceps · deltoïdes antérieurs',sets:3,target:'10–12',tip:'Pousse les poignées vers l’avant, puis reviens lentement sans décoller le dos.',unit:'kg'},
    {id:'pulldown',name:'Tirage vertical',gear:'Home gym',muscles:'Grand dorsal · biceps · haut du dos',sets:3,target:'10–12',tip:'Tire vers le haut de la poitrine, jamais derrière la nuque. Épaules basses.',unit:'kg'},
    {id:'squat',name:'Squat avec 2 haltères',gear:'Haltères',muscles:'Quadriceps · fessiers · gainage du tronc',sets:3,target:'10–12',tip:'Un haltère dans chaque main, bras le long du corps. Plie hanches et genoux puis remonte en gardant les pieds au sol.',unit:'kg / haltère'},
    {id:'row',name:'Rowing horizontal',gear:'Élastiques · ancrage torse',muscles:'Grand dorsal · rhomboïdes · trapèzes moyens · biceps',sets:3,target:'10–15',tip:'Ramène les coudes en arrière sans hausser les épaules ni basculer le buste.',unit:'bande(s)'},
    {id:'curl',name:'Curl biceps',gear:'Haltères',muscles:'Biceps · brachial · avant-bras',sets:2,target:'10–12',tip:'Garde les coudes près du buste, monte sans élan puis redescends lentement.',unit:'kg / haltère'},
    {id:'lateral',name:'Élévations latérales',gear:'Haltères',muscles:'Deltoïdes moyens · stabilisateurs des épaules',sets:2,target:'12–15',tip:'Monte les bras sur les côtés sans hausser les épaules. Réduis la charge si nécessaire.',unit:'kg / haltère'},
    {id:'bandcrunch',name:'Crunch à genoux à l’élastique',gear:'Élastique · ancrage haut',muscles:'Grand droit de l’abdomen · obliques secondaires',sets:3,target:'12–15',unit:'bande(s)'}
  ],
  B: [
    {id:'legcurl',name:'Leg curl',gear:'Élastiques · ancrage bas',muscles:'Ischio-jambiers',sets:3,target:'12–15 / jambe',tip:'Ramène le talon vers la fesse sans bouger le bassin. Fais chaque jambe.',unit:'bande(s)'},
    {id:'chest',name:'Développé poitrine',gear:'Home gym',muscles:'Pectoraux · triceps · deltoïdes antérieurs',sets:3,target:'10–12',tip:'Pousse sans verrouiller brutalement les coudes, contrôle le retour.',unit:'kg'},
    {id:'row',name:'Rowing horizontal',gear:'Élastiques · ancrage torse',muscles:'Grand dorsal · rhomboïdes · trapèzes moyens · biceps',sets:3,target:'10–15',tip:'Ramène les coudes en arrière, buste stable et épaules détendues.',unit:'bande(s)'},
    {id:'legext',name:'Leg extension',gear:'Élastiques · ancrage bas',muscles:'Quadriceps',sets:3,target:'12–15 / jambe',tip:'Tends le genou lentement sans à-coup, puis contrôle le retour.',unit:'bande(s)'},
    {id:'triceps',name:'Extension triceps',gear:'Home gym · poulie',muscles:'Triceps',sets:2,target:'10–12',tip:'Garde les coudes près du corps et tends les bras sans élan.',unit:'kg'},
    {id:'kickback',name:'Kickback fessiers',gear:'Élastiques · ancrage bas',muscles:'Grand fessier · stabilisateurs du bassin',sets:2,target:'12–15 / jambe',tip:'Pousse la jambe vers l’arrière sans cambrer le bas du dos.',unit:'bande(s)'},
    {id:'pallof',name:'Pallof press',gear:'Élastiques · ancrage torse',muscles:'Obliques · transverse · stabilisateurs du tronc',sets:3,target:'12 / côté',tip:'Place-toi de profil à l’ancrage. Tends les bras sans laisser tourner ton buste.',unit:'bande(s)'},
    {id:'calves',name:'Extensions des mollets',gear:'Haltères',muscles:'Gastrocnémiens · soléaire',sets:2,target:'15–20',tip:'Monte sur les pointes des pieds puis redescends lentement, avec appui stable.',unit:'kg / haltère'}
  ]
};

const EXPLAIN = {
  chest:{setup:'Assieds-toi, dos en contact avec le dossier, poignées à hauteur de poitrine.',steps:['Pousse les poignées devant toi en soufflant.','Garde les épaules basses et les poignets alignés.','Reviens lentement sans laisser les poids claquer.'],avoid:'Épaules remontées, dos décollé, coudes verrouillés brutalement.',focus:'Poitrine'},
  pulldown:{setup:'Assieds-toi sous la barre, cuisses stabilisées et mains un peu plus larges que les épaules.',steps:['Abaisse les épaules puis tire les coudes vers les côtes.','Amène la barre vers le haut de la poitrine.','Remonte de manière contrôlée sans basculer en arrière.'],avoid:'Tirer derrière la nuque, donner un coup de dos ou hausser les épaules.',focus:'Dos'},
  squat:{setup:'Debout, un haltère dans chaque main le long du corps, pieds environ largeur d’épaules.',steps:['Recule légèrement les hanches et fléchis genoux et hanches.','Descends aussi bas que tu le contrôles, pieds bien à plat.','Remonte en poussant dans le sol et en soufflant.'],avoid:'Talons décollés, genoux qui s’effondrent vers l’intérieur, dos qui s’arrondit.',focus:'Jambes'},
  row:{setup:'Élastique fixé à hauteur du sternum, recule jusqu’à obtenir une légère tension initiale.',steps:['Tiens les poignées, bras devant toi, buste stable.','Tire les coudes vers l’arrière en rapprochant doucement les omoplates.','Reviens lentement sans laisser l’élastique te tirer.'],avoid:'Hausser les épaules, cambrer ou tirer par à-coups.',focus:'Dos'},
  curl:{setup:'Debout ou assis, haltères le long du corps et coudes proches des flancs.',steps:['Plie les coudes pour monter les haltères.','Évite de balancer le tronc.','Redescends complètement mais sans relâcher brusquement.'],avoid:'Élan du dos, épaules qui avancent, poignets cassés.',focus:'Bras'},
  lateral:{setup:'Debout ou assis, haltères légers près des cuisses, coudes souples.',steps:['Écarte les bras sur les côtés jusqu’à environ hauteur des épaules.','Garde les épaules basses et le mouvement contrôlé.','Redescends doucement.'],avoid:'Hausser les trapèzes, balancer le corps ou utiliser une charge excessive.',focus:'Épaules'},
  bandcrunch:{
    setup:'Fixe un élastique léger à un ancrage haut conçu pour cet usage. Mets-toi à genoux face à l’ancrage, assis en arrière vers les talons. Prends une extrémité ou une poignée de chaque côté du front.',
    steps:[
      'Recule assez pour sentir une légère tension au départ. Garde les coudes proches et le bassin stable.',
      'Souffle et rapproche les côtes du bassin en arrondissant le buste. Les coudes descendent devant les genoux.',
      'Remonte lentement en gardant la tension. Les mains restent près du front.'
    ],
    avoid:'Tirer avec les bras, basculer le bassin ou laisser l’élastique te ramener brusquement. Vérifie l’état de la bande et de son ancrage avant la série.',
    focus:'Abdominaux',
    source:'https://bodylastics.com/exercises/resistance-bands/abs/kneeling-crunch'
  },
  crunch:{setup:'À genoux face à la poulie haute, corde près des tempes, bassin relativement stable.',steps:['Contracte les abdominaux et enroule le haut du buste vers le bas.','Garde les mains près de la tête, sans tirer avec les bras.','Remonte lentement en contrôlant la charge.'],avoid:'Faire un simple mouvement de hanches ou tirer avec les bras.',focus:'Abdominaux'},
  legcurl:{setup:'Face à un ancrage bas, fixe l’élastique à la cheville de la jambe qui travaille. Tiens un appui stable.',steps:['Pars jambe presque tendue, l’élastique déjà légèrement tendu. Garde la cuisse stable.','Plie le genou pour rapprocher le talon de la fesse.','Reviens lentement puis change de jambe.'],avoid:'Cambrer le dos, bouger le bassin ou laisser revenir l’élastique brutalement.',focus:'Ischios'},
  legext:{setup:'Assieds-toi sur un support stable. Fixe l’élastique bas derrière le siège et à la cheville de la jambe qui travaille.',steps:['Pars genou fléchi, pied libre de bouger.','Tends progressivement la jambe devant toi.','Replie lentement, sans forcer le verrouillage du genou.'],avoid:'À-coups, appui instable ou tension douloureuse dans le genou.',focus:'Quadriceps'},
  triceps:{setup:'Debout devant la poulie haute, coudes près du buste.',steps:['Garde le haut des bras immobile.','Tends les coudes vers le bas en soufflant.','Remonte lentement jusqu’à une flexion confortable.'],avoid:'Faire bouger les épaules ou balancer le tronc.',focus:'Triceps'},
  kickback:{setup:'Élastique fixé bas devant toi et attaché à la cheville, mains sur un appui solide.',steps:['Garde le buste stable et le genou légèrement souple.','Pousse la jambe vers l’arrière sans cambrer.','Reviens doucement puis change de jambe.'],avoid:'Cambrure du bas du dos et grands mouvements incontrôlés.',focus:'Fessiers'},
  pallof:{setup:'Debout de profil à un élastique fixé à hauteur de poitrine, pieds écartés et genoux souples.',steps:['Tiens les poignées contre le sternum.','Tends les bras droit devant toi sans tourner le buste.','Ramène les mains vers la poitrine puis change de côté.'],avoid:'Tourner les épaules ou se pencher vers l’ancrage.',focus:'Tronc'},
  calves:{setup:'Debout sur sol plat, haltères le long du corps. Si tu as besoin d’un appui, libère une main.',steps:['Monte lentement sur la pointe des pieds.','Marque un court arrêt en haut.','Redescends en contrôlant sans rebond.'],avoid:'Rebondir, rouler sur les chevilles ou perdre l’équilibre.',focus:'Mollets'}
};
  
const EXERCISES = [...new Map(Object.values(PROGRAM).flat().map(ex => [ex.id, ex])).values()];

const CABLE_CRUNCH = {
  id: 'crunch', name: 'Crunch à la poulie haute', gear: 'Home gym · corde',
  muscles: 'Grand droit de l’abdomen · obliques secondaires', sets: 3, target: '12–15', unit: 'kg'
};
const TRACKED_EXERCISES = [...EXERCISES, CABLE_CRUNCH];

function exercisesFor(workout, cableCrunch = false) {
  return cableCrunch && workout === 'A'
    ? PROGRAM.A.map(ex => ex.id === 'bandcrunch' ? CABLE_CRUNCH : ex)
    : PROGRAM[workout];
}
