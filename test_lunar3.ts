const testDates = [
    new Date(2024, 1, 10), // Feb 10, 2024
    new Date(2024, 6, 15),
    new Date()
];

testDates.forEach(d => {
    const formatted = new Intl.DateTimeFormat('vi-VN-u-ca-chinese', { day: 'numeric', month: 'numeric' }).format(d);
    console.log(`Raw: ${formatted} | matched: ${formatted.match(/\d+/g)}`);
});