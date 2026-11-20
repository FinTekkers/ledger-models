// A mixed import whose type name has no inline `type`: the check must reject
// it (the fix is `import { makeShape, Shape }`).
import { makeShape, Shape } from './shape';

export function unitShape(): Shape {
  return makeShape(1);
}
