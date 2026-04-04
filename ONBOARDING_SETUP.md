# Étape 10 : Onboarding Utilisateur

## Statut : ✅ Complété

L'onboarding utilisateur a été entièrement implémenté avec animations fluides et un flux intuitive.

## Fichiers créés/modifiés

### 1. **src/pages/Onboarding.tsx** (✨ Nouveau)
- Flux complet en 5 étapes avec animations framer-motion
- Transitions fluides entre les étapes (slide-in/out)
- Mobile-first responsive design
- Progress bar avec indicateurs de points

### 2. **src/hooks/useOnboarding.ts** (✨ Nouveau)
- Vérifie si l'utilisateur a complété l'onboarding
- Récupère le statut `onboarding_completed` depuis Supabase
- Retourne `{ needsOnboarding, loading }`

### 3. **src/components/ProtectedRoute.tsx** (📝 Modifié)
- Intègre le hook `useOnboarding`
- Redirige automatiquement vers `/onboarding` si nécessaire
- Gère les états de chargement

### 4. **src/App.tsx** (📝 Modifié)
- Ajoute la route `/onboarding`
- Refactorise les routes en fonction `AppRoutes()`

### 5. **src/lib/database.ts** (📝 Modifié)
- Ajoute les nouveaux champs au type `ProfileRow`
- Supporte `first_name`, `gender`, `date_of_birth`, `onboarding_completed`

### 6. **supabase/migrations/003_onboarding.sql** (✨ Nouveau)
- Ajoute les colonnes à la table `profiles`

## Le flux d'onboarding en 5 étapes

### **Step 1 — Bienvenue** 🎯
- Affiche le logo "Pace" avec le tagline
- 3 avantages principaux avec emojis
- Bouton "Commencer"

### **Step 2 — Votre profil** 👤
- Champ prénom (requis)
- Sélecteur genre (Homme/Femme) via cartes
- Datepicker date de naissance (optionnel)

### **Step 3 — Votre niveau** 🏃
- 3 cartes sélectionnables : Débutant, Intermédiaire, Avancé
- Range d'km par semaine pour chaque niveau
- Icônes cohérentes

### **Step 4 — Votre objectif** 🎯
- 3 cartes : Perdre du poids, Courir une distance, Préparer une course
- Sub-sélecteurs pour distance (5k/10k/20k/semi/marathon)
- Datepicker et champ temps cible (pour courses)

### **Step 5 — Vos disponibilités** 🗓️
- 4 cartes : 2/3/4/5 jours par semaine
- Descriptions pour chaque option
- Bouton "Créer mon plan" avec spinner de chargement

## Design

✅ Dark theme cohérent avec l'app
✅ Accent glow sur les cartes sélectionnées : `shadow-[0_0_0_2px_hsl(var(--accent))]`
✅ Animations fluides framer-motion
✅ Mobile-first (testé sur 390px)
✅ Progress bar + indicateurs de points

## Flux de données au complétion

1. ✅ Collecte de toutes les données utilisateur
2. ✅ Appel à `selectPlan()` pour générer le plan personnalisé
3. ✅ Appel à `upsertProfile()` avec toutes les données
4. ✅ Set `onboarding_completed = true`
5. ✅ Redirection automatique vers `/`

## Prochaines étapes

1. **Exécuter la migration SQL** dans le Supabase SQL editor :
   ```sql
   alter table profiles
     add column if not exists onboarding_completed boolean default false,
     add column if not exists gender text,
     add column if not exists date_of_birth date,
     add column if not exists first_name text;
   ```

2. **Tester le flux** :
   - Créer un nouvel utilisateur
   - Vérifier la redirection vers `/onboarding`
   - Compléter les 5 étapes
   - Vérifier la génération du plan

3. **Vérifications** :
   - ✅ Les données sont sauvegardées dans Supabase
   - ✅ Le plan personnalisé est créé
   - ✅ L'utilisateur est redirigé vers le dashboard
   - ✅ Le contenu du dashboard est pré-rempli avec le plan
