let message: string = 'Hello, World!';
console.log(message);

import { Person } from './gen/msg-readme_pb'

// Use it directly
const personInstance = new Person({ name: "Alice", years: 30 });

console.log(personInstance);