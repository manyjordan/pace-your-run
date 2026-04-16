import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { logger } from "@/lib/logger";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    logger.error("Erreur 404 : tentative d'accès à une route inexistante", undefined, {
      pathname: location.pathname,
    });
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oups ! Page introuvable</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Retour a l'accueil
        </a>
      </div>
    </div>
  );
};

export default NotFound;
