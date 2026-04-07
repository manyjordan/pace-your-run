# Pace — Votre coach running personnalisé

Application mobile de coaching running avec plans d'entraînement personnalisés, suivi GPS, feed social et forum communautaire.

## Stack technique

- **Frontend** : React 18 + TypeScript + Vite
- **UI** : Tailwind CSS + shadcn/ui
- **Backend** : Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Cartes** : Leaflet
- **Animations** : Framer Motion
- **Monitoring** : Sentry
- **PWA** : vite-plugin-pwa

## Prérequis

- Node.js 18+
- Un projet Supabase (gratuit sur [supabase.com](https://supabase.com))
- Un compte Sentry (optionnel, gratuit sur [sentry.io](https://sentry.io))

## Installation

```bash
git clone https://github.com/manyjordan/pace-your-run.git
cd pace-your-run
npm install
cp .env.example .env
# Remplir les variables dans .env
npm run dev
```

## Variables d'environnement

Voir `.env.example` pour la liste complète des variables nécessaires.

## Scripts disponibles

| Commande          | Description                 |
| ----------------- | --------------------------- |
| `npm run dev`     | Lancer en développement     |
| `npm run build`   | Build de production         |
| `npm run preview` | Prévisualiser le build      |
| `npm run test`    | Lancer les tests            |
| `npm run lint`    | Vérifier le code            |

## Architecture

```
src/
├── components/     # Composants réutilisables
│   ├── dashboard/  # Composants du tableau de bord
│   ├── plan/       # Composants du plan d'entraînement
│   ├── social/     # Composants sociaux et forum
│   └── ui/         # Composants shadcn/ui
├── contexts/       # Contextes React (Auth)
├── hooks/          # Hooks personnalisés
├── lib/            # Utilitaires et logique métier
│   ├── parsers/    # Parsers GPX, FIT, Apple Health
│   └── plans/      # Plans d'entraînement statiques
├── pages/          # Pages de l'application
└── test/           # Tests unitaires
```

## Déploiement

L'application se déploie automatiquement via GitHub Actions sur push sur `main`.

Les Edge Functions Supabase sont déployées via `.github/workflows/deploy-functions.yml`.

## Licence

Propriétaire — tous droits réservés.
