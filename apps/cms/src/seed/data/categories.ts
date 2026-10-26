/** The 11 spaces of the mockup, with their English translation. Order = display order. */
export interface CategorySeed {
  slug: string;
  color: string;
  fr: { name: string; description: string };
  en: { name: string; description: string };
}

export const CATEGORIES: CategorySeed[] = [
  {
    slug: 'bourse',
    color: '#007aff',
    fr: {
      name: 'Bourse & actions',
      description: "Actions, ETF, PEA, compte-titres : stratégies et retours d'expérience.",
    },
    en: {
      name: 'Stocks & markets',
      description: 'Shares, ETFs, PEA, brokerage accounts: strategies and real-life feedback.',
    },
  },
  {
    slug: 'economie',
    color: '#3d5a80',
    fr: {
      name: 'Économie',
      description:
        "Conjoncture, taux, inflation, emploi : l'actualité économique en France, en Europe et dans le monde.",
    },
    en: {
      name: 'Economy',
      description: 'Growth, rates, inflation, jobs: economic news in France, Europe and worldwide.',
    },
  },
  {
    slug: 'epargne',
    color: '#34c759',
    fr: {
      name: 'Épargne & placements',
      description: 'Livrets, fonds euros, obligations, comptes à terme.',
    },
    en: {
      name: 'Savings & investments',
      description: 'Savings accounts, euro funds, bonds, term deposits.',
    },
  },
  {
    slug: 'assurance-vie',
    color: '#30b0c7',
    fr: { name: 'Assurance-vie', description: 'Choisir son contrat, arbitrer, transmettre.' },
    en: {
      name: 'Life insurance',
      description: 'Choosing a contract, switching funds, passing it on.',
    },
  },
  {
    slug: 'immobilier',
    color: '#ff9500',
    fr: {
      name: 'Immobilier & SCPI',
      description: 'Résidence principale, locatif, SCPI, crédit immobilier.',
    },
    en: { name: 'Property & REITs', description: 'Main home, rentals, SCPI, mortgages.' },
  },
  {
    slug: 'impots',
    color: '#5856d6',
    fr: {
      name: 'Impôts & fiscalité',
      description: 'Déclaration, niches fiscales, IFI : payer le juste impôt.',
    },
    en: {
      name: 'Taxes',
      description: 'Tax returns, tax breaks, wealth tax: paying the right amount.',
    },
  },
  {
    slug: 'retraite',
    color: '#ff2d55',
    fr: { name: 'Retraite', description: 'PER, rachat de trimestres, cumul emploi-retraite.' },
    en: {
      name: 'Retirement',
      description: 'PER plans, buying back quarters, working while retired.',
    },
  },
  {
    slug: 'transmission',
    color: '#af52de',
    fr: {
      name: 'Famille & transmission',
      description: 'Donation, succession, protection du conjoint.',
    },
    en: {
      name: 'Family & inheritance',
      description: 'Gifts, inheritance, protecting your spouse.',
    },
  },
  {
    slug: 'alternatifs',
    color: '#00c7be',
    fr: {
      name: 'Or, cryptos & alternatifs',
      description: 'Or physique, cryptoactifs, forêts, private equity.',
    },
    en: {
      name: 'Gold, crypto & alternatives',
      description: 'Physical gold, crypto assets, forests, private equity.',
    },
  },
  {
    slug: 'budget',
    color: '#8e8e93',
    fr: { name: 'Budget & conso', description: 'Banques, crédits, assurances, bons plans.' },
    en: { name: 'Budget & spending', description: 'Banks, loans, insurance, good deals.' },
  },
  {
    slug: 'cafe',
    color: '#a2845e',
    fr: {
      name: 'Le Café du Revenu',
      description: 'Présentations, discussions libres, idées pour la rédaction.',
    },
    en: {
      name: 'The Le Revenu Café',
      description: 'Introductions, open discussions, ideas for the newsroom.',
    },
  },
];
