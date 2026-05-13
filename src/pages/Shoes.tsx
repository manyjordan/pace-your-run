import { ScrollReveal } from "@/components/ScrollReveal";
import { AppCard, PageContainer, PageHeader } from "@/components/ui/page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createShoe, getShoeKm, getShoes, retireShoe, type ShoeRow } from "@/lib/database";
import { useAuth } from "@/contexts/AuthContext";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

type ShoeWithKm = ShoeRow & { kmUsed: number };

function formatDate(dateString: string | null): string {
  if (!dateString) return "date inconnue";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const ShoesPage = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [retiringId, setRetiringId] = useState<string | null>(null);
  const [shoes, setShoes] = useState<ShoeWithKm[]>([]);
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [kmLimit, setKmLimit] = useState("600");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  const loadShoes = useCallback(async () => {
    if (!session?.user?.id) {
      setShoes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await getShoes(session.user.id);
      const withKm = await Promise.all(
        list.map(async (shoe) => ({
          ...shoe,
          kmUsed: await getShoeKm(shoe.id),
        })),
      );
      setShoes(withKm);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les chaussures.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, toast]);

  useEffect(() => {
    void loadShoes();
  }, [loadShoes]);

  const handleCreateShoe = async () => {
    if (!session?.user?.id) return;
    if (!name.trim()) {
      toast({ title: "Nom requis", description: "Ajoutez un nom de chaussure.", variant: "destructive" });
      return;
    }
    const parsedLimit = Number.parseInt(kmLimit, 10);
    const safeLimit = Number.isFinite(parsedLimit) ? Math.max(100, Math.min(2000, parsedLimit)) : 600;
    setSaving(true);
    try {
      await createShoe(session.user.id, {
        name: name.trim(),
        brand: brand.trim() || undefined,
        km_limit: safeLimit,
        notes: notes.trim() || undefined,
        start_date: startDate || undefined,
      });
      setName("");
      setBrand("");
      setKmLimit("600");
      setStartDate(new Date().toISOString().slice(0, 10));
      setNotes("");
      await loadShoes();
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la chaussure.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRetire = async (shoeId: string) => {
    setRetiringId(shoeId);
    try {
      await retireShoe(shoeId);
      await loadShoes();
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de retirer la chaussure.",
        variant: "destructive",
      });
    } finally {
      setRetiringId(null);
    }
  };

  const shoeCards = useMemo(() => shoes, [shoes]);

  return (
    <PageContainer>
      <ScrollReveal>
        <PageHeader title="Mes chaussures" subtitle="Suivez l'usure de vos paires de running" />
      </ScrollReveal>

      <ScrollReveal>
        <AppCard className="space-y-4">
          <h2 className="text-sm font-semibold">Ajouter une chaussure</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="shoe-name">Nom</Label>
              <Input id="shoe-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Pegasus 40" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shoe-brand">Marque</Label>
              <Input id="shoe-brand" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Nike" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shoe-limit">Limite km</Label>
              <Input
                id="shoe-limit"
                type="number"
                min={100}
                max={2000}
                value={kmLimit}
                onChange={(e) => setKmLimit(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shoe-start-date">Date de debut</Label>
              <Input id="shoe-start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="shoe-notes">Notes</Label>
              <Input
                id="shoe-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Usage route, sorties longues..."
              />
            </div>
          </div>
          <Button onClick={handleCreateShoe} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ajout...
              </>
            ) : (
              "Ajouter"
            )}
          </Button>
        </AppCard>
      </ScrollReveal>

      <ScrollReveal>
        <div className="space-y-3">
          {loading ? (
            <AppCard className="text-sm text-muted-foreground">Chargement des chaussures...</AppCard>
          ) : shoeCards.length === 0 ? (
            <AppCard className="text-sm text-muted-foreground">Aucune chaussure active pour l'instant.</AppCard>
          ) : (
            shoeCards.map((shoe) => {
              const limit = shoe.km_limit ?? 600;
              const pct = Math.min(100, (shoe.kmUsed / limit) * 100);
              const nearingLimit = shoe.kmUsed > limit * 0.9;
              return (
                <div key={shoe.id} className="space-y-3 rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{shoe.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {shoe.brand || "Sans marque"} · depuis le {formatDate(shoe.start_date)}
                      </p>
                    </div>
                    {nearingLimit ? (
                      <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-600">
                        A remplacer bientot
                      </span>
                    ) : null}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{Math.round(shoe.kmUsed)} km</span>
                      <span>{limit} km max</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: nearingLimit ? "#f97316" : "hsl(var(--accent))",
                        }}
                      />
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleRetire(shoe.id)}
                    disabled={retiringId === shoe.id}
                  >
                    {retiringId === shoe.id ? "Retrait..." : "Retirer"}
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </ScrollReveal>
    </PageContainer>
  );
};

export default ShoesPage;
