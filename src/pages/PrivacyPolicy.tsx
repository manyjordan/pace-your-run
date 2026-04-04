import { ScrollReveal } from "@/components/ScrollReveal";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6 pb-24 md:pb-6">
        <ScrollReveal>
          <div className="max-w-3xl mx-auto space-y-8">
            {/* Header */}
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight">Politique de Confidentialité</h1>
              <p className="text-sm text-muted-foreground">Pace — Dernière mise à jour : avril 2026</p>
            </div>

            {/* Section 1 */}
            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">1. Données collectées</h2>
              <p className="text-muted-foreground">Nous collectons les données suivantes :</p>
              <ul className="space-y-2 text-muted-foreground ml-4">
                <li>• <strong>Adresse email et mot de passe</strong> (via Supabase Auth)</li>
                <li>• <strong>Prénom, genre, date de naissance</strong> (optionnel)</li>
                <li>• <strong>Données de course</strong> : distance, durée, allure, dénivelé, trace GPS</li>
                <li>• <strong>Fréquence cardiaque</strong> (si capteur Bluetooth ou Apple Watch connecté)</li>
                <li>• <strong>Données d'activité Strava</strong> (si compte connecté)</li>
                <li>• <strong>Données Apple Santé</strong> (si autorisation accordée sur iPhone)</li>
              </ul>
            </section>

            {/* Section 2 */}
            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">2. Utilisation des données</h2>
              <p className="text-muted-foreground">Vos données sont utilisées pour :</p>
              <ul className="space-y-2 text-muted-foreground ml-4">
                <li>• Générer et personnaliser votre plan d'entraînement</li>
                <li>• Afficher vos statistiques et progression</li>
                <li>• Partager vos courses avec vos abonnés (uniquement si vous choisissez de publier)</li>
                <li>• Améliorer l'application</li>
              </ul>
              <p className="text-muted-foreground mt-4 font-semibold">Nous ne vendons jamais vos données à des tiers.</p>
            </section>

            {/* Section 3 */}
            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">3. Localisation GPS</h2>
              <p className="text-muted-foreground">
                L'application utilise votre position GPS uniquement pendant l'enregistrement d'une course, avec votre autorisation explicite. Les données GPS sont stockées sur nos serveurs sécurisés (Supabase) et associées à votre compte.
              </p>
            </section>

            {/* Section 4 */}
            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">4. Données Apple Santé (HealthKit)</h2>
              <p className="text-muted-foreground">
                Si vous autorisez l'accès à Apple Santé, nous lisons vos données de course et de fréquence cardiaque. Ces données ne sont jamais partagées avec des tiers. Nous respectons les directives Apple concernant l'utilisation des données HealthKit.
              </p>
            </section>

            {/* Section 5 */}
            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">5. Connexion Strava</h2>
              <p className="text-muted-foreground">
                Si vous connectez votre compte Strava, nous accédons à vos activités de course avec votre autorisation explicite (OAuth). Vous pouvez déconnecter Strava à tout moment depuis les paramètres.
              </p>
            </section>

            {/* Section 6 */}
            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">6. Stockage et sécurité</h2>
              <p className="text-muted-foreground">
                Vos données sont stockées sur Supabase (infrastructure AWS, région Europe). Toutes les communications sont chiffrées via HTTPS. Nous appliquons des politiques de sécurité Row Level Security pour que chaque utilisateur n'accède qu'à ses propres données.
              </p>
            </section>

            {/* Section 7 */}
            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">7. Vos droits (RGPD)</h2>
              <p className="text-muted-foreground">Conformément au RGPD, vous disposez des droits suivants :</p>
              <ul className="space-y-2 text-muted-foreground ml-4">
                <li>• Droit d'accès à vos données</li>
                <li>• Droit de rectification</li>
                <li>• Droit à l'effacement (droit à l'oubli)</li>
                <li>• Droit à la portabilité</li>
              </ul>
              <p className="text-muted-foreground mt-4">Pour exercer ces droits, contactez-nous à : <a href="mailto:many.jordan@gmail.com" className="text-accent hover:underline">many.jordan@gmail.com</a></p>
            </section>

            {/* Section 8 */}
            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">8. Suppression du compte</h2>
              <p className="text-muted-foreground">
                Vous pouvez supprimer votre compte et toutes vos données depuis Paramètres → Supprimer mon compte. La suppression est définitive et immédiate.
              </p>
            </section>

            {/* Section 9 */}
            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">9. Contact</h2>
              <p className="text-muted-foreground">
                Pour toute question : <a href="mailto:many.jordan@gmail.com" className="text-accent hover:underline">many.jordan@gmail.com</a>
              </p>
            </section>

            {/* Back to app link */}
            <div className="pt-8 border-t border-border">
              <a href="/" className="text-accent hover:underline text-sm">
                ← Retour à l'application
              </a>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
