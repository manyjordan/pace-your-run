import { ScrollReveal } from "@/components/ScrollReveal";

const LegalNotice = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6 pb-24 md:pb-6">
        <ScrollReveal>
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight">Mentions Légales</h1>
              <p className="text-sm text-muted-foreground">Pace — Dernière mise à jour : avril 2026</p>
            </div>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">1. Éditeur de l'application</h2>
              <p className="text-muted-foreground">
                L'application Pace est éditée à titre personnel, sans structure juridique commerciale.
              </p>
              <p className="text-muted-foreground">
                <strong>Contact :</strong> many.jordan@gmail.com
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">2. Hébergement</h2>
              <p className="text-muted-foreground">
                L'application est hébergée par :
              </p>
              <ul className="space-y-1 text-muted-foreground ml-4">
                <li>• <strong>Supabase Inc.</strong> — 970 Toa Payoh North, Singapour — supabase.com</li>
                <li>• <strong>Sentry (Functional Software Inc.)</strong> — 45 Fremont Street, San Francisco, CA — sentry.io</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">3. Propriété intellectuelle</h2>
              <p className="text-muted-foreground">
                L'ensemble des éléments de l'application Pace (design, code source, contenu, logo) sont protégés par le droit de la propriété intellectuelle. Toute reproduction, distribution ou utilisation sans autorisation est interdite.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">4. Données personnelles</h2>
              <p className="text-muted-foreground">
                Le traitement des données personnelles est décrit dans notre{" "}
                <a href="/privacy" className="text-accent underline underline-offset-2">
                  Politique de Confidentialité
                </a>.
                Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold">5. Limitation de responsabilité</h2>
              <p className="text-muted-foreground">
                Pace est une application de loisir sportif. Les informations fournies ne constituent pas un avis médical. L'éditeur ne saurait être tenu responsable des dommages directs ou indirects liés à l'utilisation de l'application.
              </p>
            </section>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
};

export default LegalNotice;
