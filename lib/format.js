// Backend stores times as 24hr strings ("13:00") since that sorts correctly
// as plain text. This only converts for display — nothing sent back to the
// API is ever in 12hr format.
export function formatTime12(time24) {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}
