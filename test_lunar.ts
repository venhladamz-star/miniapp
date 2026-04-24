const d = new Date(2024, 1, 10); // Feb 10, 2024 (Lunar New Year)
console.log(new Intl.DateTimeFormat('en-US-u-ca-chinese', { month: 'numeric', day: 'numeric' }).format(d));
console.log(new Intl.DateTimeFormat('vi-VN-u-ca-chinese', { month: 'numeric', day: 'numeric' }).format(d));

const d2 = new Date(2024, 7, 18); // Aug 18, 2024 (Lunar Jul 15)
console.log(new Intl.DateTimeFormat('vi-VN-u-ca-chinese', { month: 'numeric', day: 'numeric' }).format(d2));
