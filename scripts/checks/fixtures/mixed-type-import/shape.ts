export interface Shape {
  side: number;
}

export function makeShape(side: number): Shape {
  return { side };
}
