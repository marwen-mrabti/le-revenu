/** Discussions and replies taken from the mockup (polls dropped). `minutesAgo` spreads dates over the past month. */
export interface ReplySeed {
  author: string;
  content: string;
  minutesAgo: number;
}

export interface DiscussionSeed {
  title: string;
  content: string;
  type: 'question' | 'discussion';
  category: string;
  author: string;
  minutesAgo: number;
  replies: ReplySeed[];
}

export const DISCUSSIONS: DiscussionSeed[] = [
  {
    title: 'Bienvenue dans la Communauté du Revenu ! Présentez-vous ici',
    content:
      "Bonjour à toutes et à tous,\n\nCet espace est le vôtre : posez vos questions, partagez vos expériences, aidez les autres membres. Les journalistes du Revenu passent chaque jour et répondent aux questions les plus utiles.\n\n**Pour bien démarrer :**\n- Présentez-vous en une phrase en réponse à ce message\n- Choisissez les espaces qui vous intéressent\n- Marquez « Utile » les réponses qui vous aident : c'est ce qui fait remonter les meilleures contributions\n\nBienvenue !",
    type: 'discussion',
    category: 'cafe',
    author: 'LaRedaction',
    minutesAgo: 12960,
    replies: [
      {
        author: 'Sophie.Invest',
        content:
          "Bonjour ! Abonnée au magazine depuis 6 ans, ravie de pouvoir enfin échanger avec d'autres lecteurs.",
        minutesAgo: 10560,
      },
      {
        author: 'JeuneEpargnant',
        content:
          'Salut tout le monde, Hugo, 25 ans. Premier CDI et premier salaire à placer : je suis là pour apprendre !',
        minutesAgo: 8160,
      },
      {
        author: 'PapyBoursier',
        content:
          "Bienvenue aux jeunes ! N'hésitez pas à poser des questions, même basiques. On est tous passés par là.",
        minutesAgo: 5760,
      },
      {
        author: 'Helene_R',
        content:
          "Hello, Hélène. Je viens de mettre un studio en location meublée et j'ai mille questions sur la fiscalité.",
        minutesAgo: 3360,
      },
    ],
  },
  {
    title: "Question de la semaine : quel est le meilleur conseil d'argent que vous ayez reçu ?",
    content:
      "Chaque semaine, la rédaction pose une question à la communauté. Les réponses les plus inspirantes pourront être reprises, avec votre accord, dans la newsletter.\n\nAlors : quel conseil d'argent a changé votre vie ? Qui vous l'a donné ?",
    type: 'discussion',
    category: 'cafe',
    author: 'LaRedaction',
    minutesAgo: 1800,
    replies: [
      {
        author: 'PapyBoursier',
        content:
          "Mon père : « N'investis jamais l'argent dont tu auras besoin dans les cinq ans. » Ça m'a évité bien des ventes en catastrophe.",
        minutesAgo: 1519,
      },
      {
        author: 'Vincent_ETF',
        content:
          '« Le temps passé sur le marché compte plus que le moment où on y entre. » Investir tous les mois, sans se poser de questions.',
        minutesAgo: 1238,
      },
      {
        author: 'Claire_Nantes',
        content:
          "Faire le tour de ses contrats une fois par an. J'économise plusieurs centaines d'euros par an sur mes assurances grâce à ça.",
        minutesAgo: 956,
      },
      {
        author: 'Nadia.Patrimoine',
        content:
          'Ma notaire : « Une succession se prépare de son vivant, pas après. » On a tout réorganisé ensuite.',
        minutesAgo: 675,
      },
      {
        author: 'JeuneEpargnant',
        content:
          "Se constituer une épargne de précaution avant d'investir. Simple, mais je ne l'aurais pas fait spontanément.",
        minutesAgo: 394,
      },
    ],
  },
  {
    title: 'Ouvrir un PEA avec 5 000 € : par où commencer ?',
    content:
      "Bonjour, je viens d'ouvrir un PEA en ligne et j'ai 5 000 € à y placer. Je ne connais pas grand-chose aux actions.\n\nVaut-il mieux tout investir d'un coup ou étaler ? Et sur quoi : des ETF, quelques actions ?",
    type: 'question',
    category: 'bourse',
    author: 'Thomas_PEA',
    minutesAgo: 3000,
    replies: [
      {
        author: 'PapyBoursier',
        content:
          "Première chose : vous avez bien une épargne de précaution à côté ? Le PEA, c'est de l'argent qu'on oublie au moins cinq ans.",
        minutesAgo: 2444,
      },
      {
        author: 'Vincent_ETF',
        content:
          "Mon expérience : pour débuter, un ETF éligible au PEA qui réplique un indice mondial fait très bien le travail. Une seule ligne, des frais faibles, une large diversification.\n\nPour l'entrée : investir une partie maintenant puis programmer un versement mensuel. On lisse son point d'entrée et on prend l'habitude.\n\nRappel utile : le PEA est plafonné à 150 000 € de versements, et après cinq ans les gains sont exonérés d'impôt sur le revenu (les prélèvements sociaux restent dus).",
        minutesAgo: 1889,
      },
      {
        author: 'Thomas_PEA',
        content:
          "Merci beaucoup, c'est très clair ! Oui, j'ai trois mois de salaire sur un livret à côté.",
        minutesAgo: 1333,
      },
      {
        author: 'LaRedaction',
        content:
          "Très bonne réponse de @Vincent_ETF. Nous avons consacré un dossier aux ETF : comparez surtout les frais courants et la taille du fonds avant de choisir. Et gardez la tête froide les jours de baisse : c'est là que la régularité paie.",
        minutesAgo: 778,
      },
    ],
  },
  {
    title: "J'ai 25 ans et 10 000 € de côté : je fais quoi ?",
    content:
      "Premier CDI depuis un an, j'ai réussi à mettre 10 000 € de côté sur un livret. Pas de projet immobilier avant quatre ou cinq ans.\n\nJe me sens un peu perdu entre PEA, assurance-vie, PER… Comment auriez-vous réparti à mon âge ?",
    type: 'question',
    category: 'epargne',
    author: 'JeuneEpargnant',
    minutesAgo: 840,
    replies: [
      {
        author: 'Claire_Nantes',
        content:
          'Garde déjà trois à six mois de dépenses sur ton livret. Le reste peut travailler.',
        minutesAgo: 684,
      },
      {
        author: 'Vincent_ETF',
        content:
          "À 25 ans, ouvrir un PEA et une assurance-vie tôt, même avec peu, c'est surtout prendre date pour la fiscalité. L'antériorité compte.",
        minutesAgo: 529,
      },
      {
        author: 'PapyBoursier',
        content:
          "Le PER peut attendre à mon avis : l'argent est bloqué jusqu'à la retraite (sauf achat de la résidence principale) et l'avantage fiscal est faible si ton taux d'imposition est bas.",
        minutesAgo: 373,
      },
      {
        author: 'Sophie.Invest',
        content:
          "Pareil que les autres. Et surtout : automatise tes versements, c'est ce qui fait la différence sur vingt ans.",
        minutesAgo: 218,
      },
    ],
  },
  {
    title: 'Assurance-vie après 70 ans : est-ce encore intéressant ?',
    content:
      "J'ai 71 ans et je me demande s'il est encore utile de verser sur une assurance-vie, notamment pour la transmission à mes petits-enfants. On m'a dit que la fiscalité était moins avantageuse après 70 ans ?",
    type: 'question',
    category: 'assurance-vie',
    author: 'Odile.Retraite',
    minutesAgo: 4320,
    replies: [
      {
        author: 'Nadia.Patrimoine',
        content:
          "Oui, mais ça reste souvent intéressant. Pour les versements après 70 ans, l'abattement est de 30 500 € au total (tous bénéficiaires confondus) et il ne porte que sur les primes versées : les gains, eux, sont exonérés de droits de succession. Sur une longue durée, ça peut peser lourd.",
        minutesAgo: 3338,
      },
      {
        author: 'Odile.Retraite',
        content:
          'Merci ! Je ne savais pas que les gains étaient exonérés. Je vais en parler à mon conseiller.',
        minutesAgo: 2356,
      },
      {
        author: 'LaRedaction',
        content:
          "Précision utile : pour les primes versées avant 70 ans, l'abattement est de 152 500 € par bénéficiaire. Les deux régimes peuvent se combiner sur un même contrat.",
        minutesAgo: 1375,
      },
    ],
  },
  {
    title: 'SCPI : vous avez renforcé ces derniers mois ou vous attendez ?',
    content:
      'Après les baisses de prix de parts de certaines SCPI, je vois deux écoles autour de moi : ceux qui en profitent pour renforcer et ceux qui ne veulent plus en entendre parler.\n\nEt vous, comment avez-vous réagi ?',
    type: 'discussion',
    category: 'immobilier',
    author: 'Karim_Immo',
    minutesAgo: 2160,
    replies: [
      {
        author: 'Helene_R',
        content: "J'attends. J'ai été échaudée par les délais de revente sur une de mes SCPI.",
        minutesAgo: 1669,
      },
      {
        author: 'PapyBoursier',
        content:
          "J'ai renforcé, mais uniquement sur des SCPI récentes, sans immobilier de bureaux acheté au plus haut.",
        minutesAgo: 1178,
      },
      {
        author: 'Karim_Immo',
        content:
          "C'est aussi mon approche. Je regarde maintenant de près le taux d'occupation et la diversification géographique.",
        minutesAgo: 687,
      },
    ],
  },
  {
    title: 'Frais réels ou abattement de 10 % : comment savoir ce qui est le plus avantageux ?',
    content:
      'Je fais 35 km aller-retour par jour en voiture pour aller travailler. Est-ce que je devrais passer aux frais réels ?',
    type: 'question',
    category: 'impots',
    author: 'Julie_Toulouse',
    minutesAgo: 5760,
    replies: [
      {
        author: 'Bertrand59',
        content:
          'Faites le calcul simplement : additionnez vos frais (barème kilométrique selon la puissance de la voiture, repas, etc.) et comparez avec 10 % de votre salaire. Si vos frais dépassent, les frais réels sont gagnants. Attention : il faut garder les justificatifs.',
        minutesAgo: 4066,
      },
      {
        author: 'Julie_Toulouse',
        content: "Je viens de faire le calcul et je gagne quelques centaines d'euros. Merci !",
        minutesAgo: 2372,
      },
    ],
  },
  {
    title: 'Donation aux enfants : faut-il le faire maintenant ou attendre ?',
    content:
      'Nos enfants ont 19, 22 et 25 ans. Nous pensons à leur donner une partie de notre épargne pour les aider à démarrer. Est-ce le bon moment ? Quels pièges éviter ?',
    type: 'question',
    category: 'transmission',
    author: 'Nadia.Patrimoine',
    minutesAgo: 2400,
    replies: [
      {
        author: 'Odile.Retraite',
        content:
          'Chaque parent peut donner 100 000 € par enfant en franchise de droits, et cet abattement se renouvelle tous les quinze ans. Plus on commence tôt, plus on peut en profiter plusieurs fois.',
        minutesAgo: 1855,
      },
      {
        author: 'PapyBoursier',
        content:
          'Le piège classique : donner trop et se retrouver juste soi-même. Gardez de quoi vivre confortablement !',
        minutesAgo: 1309,
      },
      {
        author: 'Me_Garnier',
        content:
          "J'ajoute un point de forme : une donation qui porte sur un bien immobilier passe obligatoirement devant notaire. Pour une somme d'argent, un don manuel suffit, mais il doit être déclaré à l'administration fiscale.",
        minutesAgo: 764,
      },
    ],
  },
  {
    title: "PER : vos retours d'expérience après quelques années ?",
    content:
      "J'ai ouvert un PER il y a trois ans pour la déduction fiscale. Je m'interroge sur les frais et la sortie. Vos retours ?",
    type: 'discussion',
    category: 'retraite',
    author: 'Bertrand59',
    minutesAgo: 3600,
    replies: [
      {
        author: 'Vincent_ETF',
        content:
          "Le point clé pour moi : les frais. Un PER en ligne avec des ETF, c'est très différent d'un PER bancaire avec 3 % de frais d'entrée.",
        minutesAgo: 2782,
      },
      {
        author: 'Odile.Retraite',
        content:
          "Pensez aussi à la fiscalité à la sortie : ce que vous déduisez aujourd'hui sera imposé plus tard.",
        minutesAgo: 1964,
      },
      {
        author: 'Sandrine_CGP',
        content:
          "Un point que je vois souvent négligé : si vous avez déduit vos versements, la part de capital correspondante sera imposée à la sortie, et les gains aussi. Comparez votre taux marginal d'imposition actuel avec celui que vous anticipez à la retraite : c'est lui qui dit si la déduction est vraiment avantageuse.",
        minutesAgo: 1145,
      },
    ],
  },
  {
    title: 'Or physique : pièces ou lingots, que privilégiez-vous ?',
    content:
      "Je commence à acheter un peu d'or physique. Pièces ou petits lingots ? Et où les stockez-vous ?",
    type: 'discussion',
    category: 'alternatifs',
    author: 'Marc_Lyon',
    minutesAgo: 6600,
    replies: [
      {
        author: 'PapyBoursier',
        content: 'Pièces, pour pouvoir revendre par petites quantités si besoin.',
        minutesAgo: 4659,
      },
      {
        author: 'Claire_Nantes',
        content:
          "Attention aux frais de garde et à la prime à l'achat, ça varie beaucoup d'un vendeur à l'autre.",
        minutesAgo: 2718,
      },
    ],
  },
  {
    title: 'Changer de banque : vos retours sur la mobilité bancaire ?',
    content:
      'Je veux quitter ma banque traditionnelle pour une banque en ligne. Le service de mobilité fonctionne-t-il vraiment bien ?',
    type: 'question',
    category: 'budget',
    author: 'Claire_Nantes',
    minutesAgo: 480,
    replies: [
      {
        author: 'Sophie.Invest',
        content:
          "Très bien chez moi, tous les prélèvements ont été transférés en quelques semaines. Gardez l'ancien compte ouvert un mois ou deux par sécurité.",
        minutesAgo: 280,
      },
    ],
  },
  {
    title: 'Quel sujet aimeriez-vous voir traité par la rédaction ?',
    content:
      "La rédaction lit ce forum, profitons-en ! Moi j'aimerais un dossier complet sur la succession dans les familles recomposées.",
    type: 'discussion',
    category: 'cafe',
    author: 'Sophie.Invest',
    minutesAgo: 1560,
    replies: [
      {
        author: 'Karim_Immo',
        content:
          "Un comparatif des SCPI par type d'actifs, avec le recul sur les dernières années.",
        minutesAgo: 1205,
      },
      {
        author: 'Helene_R',
        content: 'Un guide pas à pas de la déclaration en location meublée !',
        minutesAgo: 851,
      },
      {
        author: 'LaRedaction',
        content:
          "Merci pour ces idées, nous les notons toutes. Les familles recomposées sont justement au programme d'un prochain numéro.",
        minutesAgo: 496,
      },
    ],
  },
  {
    title: 'Location meublée : micro-BIC ou régime réel ?',
    content:
      'Je loue un studio meublé depuis deux mois. Je ne sais pas quel régime choisir pour ma première déclaration. Comment avez-vous fait votre choix ?',
    type: 'question',
    category: 'impots',
    author: 'Helene_R',
    minutesAgo: 300,
    replies: [],
  },
  {
    title: 'Dividendes sur un compte-titres : flat tax ou barème ?',
    content:
      "Je perçois des dividendes sur un compte-titres ordinaire. Flat tax ou barème progressif : qu'avez-vous choisi et pourquoi ?",
    type: 'question',
    category: 'bourse',
    author: 'LeRentier',
    minutesAgo: 180,
    replies: [],
  },
  {
    title: 'Rachat de trimestres : est-ce que ça vaut vraiment le coup ?',
    content:
      "Une amie a racheté des trimestres pour partir plus tôt. Le coût m'a paru énorme. Quelqu'un a fait le calcul ?",
    type: 'question',
    category: 'retraite',
    author: 'Odile.Retraite',
    minutesAgo: 7800,
    replies: [
      {
        author: 'Bertrand59',
        content:
          "Ça dépend énormément de votre situation. Demandez une simulation à votre caisse de retraite : elle calcule le coût et le gain de pension. Le rachat est déductible du revenu imposable, ce qui adoucit l'addition.",
        minutesAgo: 4550,
      },
    ],
  },
  {
    title: 'Fonds euros : quelle part gardez-vous dans votre contrat ?',
    content:
      "Suite à l'article du Revenu sur les rendements des fonds euros, je me demande quelle part vous conservez en fonds euros et en unités de compte.",
    type: 'discussion',
    category: 'assurance-vie',
    author: 'Vincent_ETF',
    minutesAgo: 1080,
    replies: [
      {
        author: 'Odile.Retraite',
        content: 'Environ 60 % en fonds euros, à mon âge je privilégie la sécurité.',
        minutesAgo: 835,
      },
      {
        author: 'Camille_B',
        content:
          'Autour de 35 % chez moi, le reste en unités de compte diversifiées. Je rééquilibre une fois par an.',
        minutesAgo: 589,
      },
      { author: 'Thomas_PEA', content: "20 % seulement, j'ai un horizon long.", minutesAgo: 344 },
    ],
  },
  {
    title: 'Crédit immobilier : renégocier ou faire racheter son prêt ?',
    content:
      'Mon taux actuel est plus élevé que les offres du moment. Vaut-il mieux renégocier avec ma banque ou passer par un rachat de crédit ? Vos expériences ?',
    type: 'question',
    category: 'immobilier',
    author: 'Karim_Immo',
    minutesAgo: 120,
    replies: [],
  },
  {
    title: 'Taux de la BCE : suivez-vous ses décisions pour vos placements ?',
    content:
      "Je découvre que les décisions de la Banque centrale européenne pèsent à la fois sur les crédits immobiliers, la rémunération de l'épargne et les marchés. Est-ce que vous les suivez, et est-ce qu'elles changent vos choix ?",
    type: 'discussion',
    category: 'economie',
    author: 'Bertrand59',
    minutesAgo: 1680,
    replies: [
      {
        author: 'Vincent_ETF',
        content:
          "Je les suis de loin : j'investis tous les mois quoi qu'il arrive. Je regarde surtout l'effet sur les fonds euros, qui réagissent avec retard aux variations de taux.",
        minutesAgo: 1186,
      },
      {
        author: 'Odile.Retraite',
        content:
          "Moi, c'est pour les livrets et les comptes à terme : leur rémunération finit toujours par suivre le mouvement.",
        minutesAgo: 692,
      },
    ],
  },
];
