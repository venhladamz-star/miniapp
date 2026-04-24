import { Solar, Lunar } from 'lunar-javascript';

const d = new Date();
const solar = Solar.fromDate(d);
const lunar = Lunar.fromSolar(solar);

console.log(lunar.getDay()); // 7
console.log(lunar.getMonth()); // 3
console.log(lunar.getYear()); // 2026
console.log(lunar.toString());
