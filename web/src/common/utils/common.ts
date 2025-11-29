const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const capitalizeFirstLetter = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const formatDate = (date: Date, locale: string) => {
  const month = capitalizeFirstLetter(
    new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(0, date.getMonth())),
  );

  return `${date.getDate()} ${month}, ${date.getFullYear()}`;
};

export default {
  capitalizeFirstLetter,
  formatDate,
  sleep,
};
