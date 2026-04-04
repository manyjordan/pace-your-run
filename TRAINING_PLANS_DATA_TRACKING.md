# Tracking Training Plan Data in Supabase

## ✅ Ce qui remonte dans Supabase

### 1. **Plan Choisi & Niveau Détecté** 
**Table:** `profiles.goal_data` (JSONB)
- `selectedPlanId` → ID du plan sélectionné (ex: "semi_beginner_3days_12weeks")
- `level` → Niveau détecté (beginner/intermediate/advanced)
- `availableDaysPerWeek` → Jours disponibles pour s'entraîner

```sql
-- Exemple de goal_data sauvegardé:
{
  "weightKg": "75",
  "goalType": "race",
  "availableDaysPerWeek": "4",
  "level": "intermediate",
  "selectedPlanId": "semi_intermediate_4days_12weeks",
  "goalSavedAt": "2026-04-02T14:30:00.000Z",
  "raceType": "semi",
  "raceDistanceKm": "21.097",
  "raceTargetDate": "2026-06-15"
}
```

### 2. **Sessions Complétées (Nouveau)**
**Table:** `training_plan_sessions`

Structure:
```sql
- id: UUID (clé primaire)
- user_id: UUID (référence auth.users)
- plan_id: text (ex: "semi_intermediate_4days_12weeks")
- week_number: integer (1-16)
- session_day: text (Lun, Mar, Mer, Jeu, Ven, Sam, Dim)
- session_type: text (Sortie facile, Tempo, etc.)
- completed: boolean (true/false)
- completed_at: timestamptz (timestamp de completion)
- notes: text (optionnel)
- distance_km: numeric (optionnel)
- duration_minutes: integer (optionnel)
- created_at: timestamptz
- updated_at: timestamptz
```

**RLS Policy:** L'utilisateur ne peut voir/modifier que ses propres sessions

### 3. **Données Auto-Calculées**
- `goalSavedAt` → Sauvegardé quand l'utilisateur clique sur "Sauvegarder"
- Semaine actuelle = (maintenant - goalSavedAt) / 7
- Progression = semaines complétées / total des semaines

---

## 📊 Exemple de données remontées

### Pour un utilisateur "Jordan"

**Profile (goal_data):**
```json
{
  "selectedPlanId": "semi_intermediate_4days_12weeks",
  "level": "intermediate",
  "goalSavedAt": "2026-03-01T10:00:00Z",
  "goalType": "race",
  ...autres champs du goal
}
```

**Training Sessions (exemples):**
```
Semaine 1, Lun: Sortie facile, 5km - ✅ Completed (2026-03-03 18:30)
Semaine 1, Mar: Intervalles - ❌ Not completed
Semaine 1, Mer: Récupération, 4km - ✅ Completed (2026-03-04 07:00)
Semaine 1, Jeu: Sortie tempo - ❌ Not completed
```

---

## 🔄 Flux de Données

1. **Utilisateur définit son objectif** (GoalTab.tsx)
   - Choisit: goal type, niveau, jours disponibles
   - Système auto-sélectionne le meilleur plan
   - Sauvegarde `selectedPlanId` + `goalSavedAt` + `level` dans `profiles.goal_data`

2. **Plan s'affiche** (TrainingTab.tsx)
   - Récupère les données du profil
   - Charge le plan depuis `trainingPlans.ts`
   - Calcule semaine courante = (maintenant - goalSavedAt) / 7
   - Charge les sessions complétées depuis `training_plan_sessions`

3. **Utilisateur marque une session comme complétée** (TrainingTab.tsx)
   - Click sur le cercle vide → insère/update `training_plan_sessions`
   - `completed = true` + `completed_at = maintenant`
   - Cercle devient vert (CheckCircle2)
   - Session affiche "line-through"

4. **Progression trackée** (pour futures analyses)
   - Nombre de sessions complétées
   - Adhérence au plan (%)
   - Semaines avec au moins une session complétée

---

## 💾 API Functions (dans src/lib/database.ts)

```typescript
// Charger les sessions d'une semaine
await getWeekSessions(userId, planId, weekNumber)
// → TrainingPlanSessionRow[]

// Cocher/décocher une session
await toggleSessionCompleted(planId, weekNumber, sessionDay, userId, notes?)
// → { completed: boolean }

// Compter les sessions complétées
await getCompletedSessionsCount(userId, planId)
// → number

// Progression globale du plan
await getPlanProgress(userId, planId, totalWeeks)
// → { totalCompleted, weeksWithProgress, totalWeeks }
```

---

## 🎯 Cas d'Usage: Analytics & Reporting

Avec ces données, tu peux construire:

1. **Dashboard de progression**
   - "Vous avez complété 7 séances sur 24"
   - "3 semaines avec 100% de complétion"
   - Graphique: ligne de progression

2. **Recommandations**
   - "Vous êtes à la traîne, rattrapage nécessaire"
   - "Excellent adhérence cette semaine!"
   - "Manquez-vous une séance avant d'avancer?"

3. **Adaptations dynamiques**
   - Si faible adhérence: suggérer réduction jours/semaine
   - Si haute adhérence: suggérer progression

4. **Notifications**
   - "Vous avez 3 séances cette semaine"
   - "Vous avez manqué une séance hier"

---

## 🔐 Sécurité (RLS)

Toutes les tables ont Row Level Security activée:
- `training_plan_sessions`: L'utilisateur voit/modifie SEULEMENT ses sessions
- Les données sont isolées par `user_id`
- Impossible pour un utilisateur d'accéder aux plans d'un autre

