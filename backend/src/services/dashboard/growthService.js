export const getGrowthData = (monthlyTrends) => {
  const lastTwo = monthlyTrends.slice(-2);

  let growth = 0;
  let multiplier = 0;

  if (lastTwo.length === 2) {
    const prev = lastTwo[0].income;
    const curr = lastTwo[1].income;

    growth = prev ? ((curr - prev) / prev) * 100 : 0;
    multiplier = prev ? (curr / prev).toFixed(2) : 0;
  }

  return {
    growth: Number(growth.toFixed(2)),
    multiplier: multiplier + "x"
  };
};