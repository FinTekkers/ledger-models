// A plain import of a name used only as a type: the check must reject it.
import { Shape } from './shape';

export function area(s: Shape): number {
  return s.area();
}
