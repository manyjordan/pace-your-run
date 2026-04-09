// Backward compatibility — prefer importing from semiPlans or marathonPlans directly
export { semiPlans } from "./semiPlans";
export { marathonPlans } from "./marathonPlans";

import { semiPlans } from "./semiPlans";
import { marathonPlans } from "./marathonPlans";
import type { TrainingPlan } from "./types";

export const racePlans: TrainingPlan[] = [...semiPlans, ...marathonPlans];
