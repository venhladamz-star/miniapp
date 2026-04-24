const getDayInfo = (date: Date) => {
    let lunarStr = "-";
    let pureLunar = "-";
    try {
      const formatted = new Intl.DateTimeFormat('vi-VN-u-ca-chinese', {
          day: 'numeric', month: 'numeric'
      }).format(date);
      const numbers = formatted.match(/\d+/g);
      if (numbers && numbers.length >= 2) {
          pureLunar = `${numbers[0]}/${numbers[1]}`;
          if (numbers[0] === '1') {
              lunarStr = `${numbers[0]}/${numbers[1]}`;
          } else {
              lunarStr = numbers[0];
          }
      } else if (numbers && numbers.length === 1) {
          lunarStr = numbers[0];
          pureLunar = lunarStr;
      } else {
          lunarStr = formatted;
      }
    } catch {
      lunarStr = "-";
    }
    return { lunarStr, pureLunar };
}

console.log(getDayInfo(new Date(2024, 1, 10))); // mùng 1 tháng 1
console.log(getDayInfo(new Date(2024, 1, 11))); // mùng 2 tháng 1
