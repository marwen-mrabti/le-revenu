/** Demo readers. Two test accounts first, then the mockup's authors. All share DEMO_PASSWORD. */
export const DEMO_PASSWORD = 'Password123!';

export interface UserSeed {
  username: string;
  email: string;
  /** Shown instead of the username when set; most demo readers keep their handle. */
  displayName?: string;
}

export const USERS: UserSeed[] = [
  { username: 'alice', email: 'alice@demo.lerevenu.test' },
  { username: 'bob', email: 'bob@demo.lerevenu.test' },
  {
    username: 'LaRedaction',
    displayName: 'La rédaction du Revenu',
    email: 'laredaction@demo.lerevenu.test',
  },
  {
    username: 'Sophie.Invest',
    displayName: 'Sophie Martin',
    email: 'sophie.invest@demo.lerevenu.test',
  },
  { username: 'JeuneEpargnant', email: 'jeuneepargnant@demo.lerevenu.test' },
  { username: 'PapyBoursier', email: 'papyboursier@demo.lerevenu.test' },
  { username: 'Helene_R', email: 'helene.r@demo.lerevenu.test' },
  {
    username: 'Vincent_ETF',
    displayName: 'Vincent Leroy',
    email: 'vincent.etf@demo.lerevenu.test',
  },
  {
    username: 'Claire_Nantes',
    displayName: 'Claire Nantes',
    email: 'claire.nantes@demo.lerevenu.test',
  },
  { username: 'Nadia.Patrimoine', email: 'nadia.patrimoine@demo.lerevenu.test' },
  { username: 'Thomas_PEA', email: 'thomas.pea@demo.lerevenu.test' },
  { username: 'Odile.Retraite', email: 'odile.retraite@demo.lerevenu.test' },
  { username: 'Karim_Immo', email: 'karim.immo@demo.lerevenu.test' },
  { username: 'Julie_Toulouse', email: 'julie.toulouse@demo.lerevenu.test' },
  { username: 'Bertrand59', email: 'bertrand59@demo.lerevenu.test' },
  { username: 'Me_Garnier', email: 'me.garnier@demo.lerevenu.test' },
  { username: 'Sandrine_CGP', email: 'sandrine.cgp@demo.lerevenu.test' },
  { username: 'Marc_Lyon', email: 'marc.lyon@demo.lerevenu.test' },
  { username: 'LeRentier', email: 'lerentier@demo.lerevenu.test' },
  { username: 'Camille_B', email: 'camille.b@demo.lerevenu.test' },
];
