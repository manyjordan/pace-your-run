import { ScrollReveal } from "@/components/ScrollReveal";

const TermsOfUse = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6 pb-24 md:pb-6">
        <ScrollReveal>
          <div className="max-w-3xl mx-auto space-y-8">
            {/* Header */}
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight">Conditions Générales d'Utilisation</h1>
              <p className="text-sm text-muted-foreground">Pace — Dernière mise à jour : avril 2026</p>
            </div>

            {/* Section 1 */}
            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">1. Acceptation des conditions</h2>
              <p className="text-muted-foreground">
                En utilisant Pace, vous acceptez les présentes conditions. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser l'application.
              </p>
            </section>

            {/* Section 2 */}
            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">2. Description du service</h2>
              <p className="text-muted-foreground">
                Pace est une application de suivi et d'entraînement à la course à pied. Elle permet d'enregistrer des courses, de suivre ses performances et de bénéficier de plans d'entraînement personnalisés.
              </p>
            </section>

            {/* Section 3 */}
            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">3. Compte utilisateur</h2>
              <p className="text-muted-foreground">
                Vous êtes responsable de la confidentialité de vos identifiants. Vous devez avoir au moins 16 ans pour utiliser Pace.
              </p>
            </section>

            {/* Section 4 */}
            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">4. Contenu utilisateur</h2>
              <p className="text-muted-foreground">
                Les courses et données que vous partagez publiquement sont visibles par les autres utilisateurs. Vous restez propriétaire de vos données. En les partageant, vous accordez à Pace une licence limitée pour les afficher dans l'application.
              </p>
            </section>

            {/* Section 5 */}
            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">5. Utilisation acceptable</h2>
              <p className="text-muted-foreground">Vous vous engagez à ne pas :</p>
              <ul className="space-y-2 text-muted-foreground ml-4">
                <li>• Usurper l'identité d'autres utilisateurs</li>
                <li>• Publier du contenu offensant ou inapproprié</li>
                <li>• Tenter d'accéder aux données d'autres utilisateurs</li>
                <li>• Utiliser l'application à des fins commerciales sans autorisation</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">6. Avertissement médical</h2>
              <p className="text-muted-foreground">
                Pace fournit des informations à titre informatif uniquement. Consultez un médecin avant de commencer tout programme d'entraînement intensif. Les informations sur les blessures sont indicatives et ne remplacent pas un avis médical professionnel.
              </p>
            </section>

            {/* Section 7 */}
            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">7. Limitation de responsabilité</h2>
              <p className="text-muted-foreground">
                Pace ne peut être tenu responsable des blessures survenues pendant l'utilisation de l'application. Les plans d'entraînement sont des suggestions — adaptez-les à votre condition physique.
              </p>
            </section>

            {/* Section 8 */}
            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">8. Modifications</h2>
              <p className="text-muted-foreground">
                Nous nous réservons le droit de modifier ces conditions. Les utilisateurs seront notifiés par email en cas de changement majeur.
              </p>
            </section>

            {/* Section 9 */}
            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">9. Droit applicable</h2>
              <p className="text-muted-foreground">
                Ces conditions sont régies par le droit français. Tout litige sera soumis aux tribunaux français compétents.
              </p>
            </section>

            {/* Section 10 */}
            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">10. Contact</h2>
              <p className="text-muted-foreground">
                <a href="mailto:many.jordan@gmail.com" className="text-accent hover:underline">many.jordan@gmail.com</a>
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

export default TermsOfUse;
