# Tests E2E - Faux Profils

Ce script cree de vrais utilisateurs dans Supabase, teste tous les flux critiques, puis nettoie tout.

## Prerequis

1. Creer un fichier `.env.local` a la racine (voir `.env.local.example`)
2. Y ajouter ta `SUPABASE_SERVICE_ROLE_KEY` (Supabase -> Settings -> API)

## Lancer les tests

```bash
npm run test:e2e
```

## Ce qui est teste

- ? Creation de profils utilisateurs
- ? Sauvegarde de courses avec trace GPS
- ? Publications sociales
- ? Systeme de follow
- ? Systeme de likes + notifications automatiques
- ? Securite RLS - un user ne peut pas supprimer les donnees d'un autre
- ? Prevention des likes en double
- ? Nettoyage automatique apres les tests

## Important

Ne jamais committer `.env.local` - il contient la service role key.
