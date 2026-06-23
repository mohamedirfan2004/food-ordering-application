export const isItemAvailableNow = (item) => {
  if (!item) return false;

  if (item.isAvailable === false) return false;

  if (!item.availabilityType || item.availabilityType === 'always') return true;

  const start = item.scheduleStart;
  const end = item.scheduleEnd;
  if (!start || !end) return false;

  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  if ([sh, sm, eh, em].some(v => Number.isNaN(v))) return false;

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;

  if (startMinutes <= endMinutes) {
    return nowMinutes >= startMinutes && nowMinutes < endMinutes;
  }
  return nowMinutes >= startMinutes || nowMinutes < endMinutes;
};
