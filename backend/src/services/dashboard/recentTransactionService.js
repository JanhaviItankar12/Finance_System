export const getRecentTransactions = (records, limit = 5) => {

  const recent = [...records]   // clone to avoid mutation
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, limit);

  // chart/UI ready format
  return recent.map(r => ({
    id: r._id,
    date: new Date(r.date).toISOString().slice(0, 10),
    type: r.type,
    category: r.category,
    amount: r.amount,
    locked: r.isLocked,
    note: r.notes
  }));
};