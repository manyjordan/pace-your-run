import { fr } from "date-fns/locale";

/** Calendrier avec menus déroulants mois/année — plage typique date de naissance. */
export function birthDateDayPickerProps(selectedDate: Date | undefined) {
  const now = new Date();
  return {
    locale: fr,
    captionLayout: "dropdown" as const,
    fromYear: 1920,
    toYear: now.getFullYear(),
    defaultMonth: selectedDate ?? new Date(1990, 0, 1),
  };
}

/** Objectifs / courses : dates plutôt dans le futur proche. */
export function futureEventDayPickerProps(selectedDate: Date | undefined) {
  const y = new Date().getFullYear();
  return {
    locale: fr,
    captionLayout: "dropdown" as const,
    fromYear: y,
    toYear: y + 5,
    defaultMonth: selectedDate ?? new Date(),
  };
}
