function todayIST() {
  const now = new Date();
  const ist = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  return ist.toISOString().slice(0, 10);
}

function yesterdayIST() {
  const now = new Date();
  const ist = new Date(now.getTime() + (5.5 * 60 * 60 * 1000) - 86400000);
  return ist.toISOString().slice(0, 10);
}

module.exports = { todayIST, yesterdayIST };
