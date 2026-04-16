const toLocal = (date) =>
  date
    ? new Date(date).toLocaleString('en-CA', {
        timeZone: 'America/Vancouver',
        hour12: false,
      })
    : null;

module.exports = {
  toLocal,
};
