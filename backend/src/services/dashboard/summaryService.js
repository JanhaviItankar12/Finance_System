export const getSummaryData = (records) => {


    //split locked and unlocked
    const lockedRecords = records.filter(r => r.isLocked);
    const unlockedRecords = records.filter(r => !r.isLocked);

    //total income/expense/net balance
    const totalIncome = records
        .filter(r => r.type === "income")
        .reduce((sum, r) => sum + r.amount, 0);

    const totalLockedIncome = lockedRecords
        .filter(r => r.type === "income")
        .reduce((sum, r) => sum + r.amount, 0);

    const totalUnlockedIncome = unlockedRecords
        .filter(r => r.type === "income")
        .reduce((sum, r) => sum + r.amount, 0);

    const totalExpense = records
        .filter(r => r.type === "expense")
        .reduce((sum, r) => sum + r.amount, 0);

    const totalLockedExpense = lockedRecords
        .filter(r => r.type === "expense")
        .reduce((sum, r) => sum + r.amount, 0);


    const totalUnlockedExpense = unlockedRecords
        .filter(r => r.type === "expense")
        .reduce((sum, r) => sum + r.amount, 0);

    const netBalance = totalIncome - totalExpense;

    //income vs expense ratio
    const total = totalIncome + totalExpense;
    const incomeRatio = total ? (totalIncome / total) * 100 : 0;
    const expenseRatio = total ? (totalExpense / total) * 100 : 0;

    return {
        totalIncome,
        totalExpense,
        lokedUnlockedData: {
            totalLockedIncome,  //fixed
            totalUnlockedIncome,    //can be modifed in future 
            totalLockedExpense,
            totalUnlockedExpense,
        },
        netBalance,
        incomeExpenseRatio: {
                incomeRatio: incomeRatio.toFixed(2),
                expenseRatio: expenseRatio.toFixed(2)
            },
    }
}

export const getTrendsData = (records) => {

    const monthlyMap = {};
    const weeklyMap = {};

    records.forEach(r => {
        const date = new Date(r.date);

        // -------- MONTHLY --------
        const mKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!monthlyMap[mKey]) monthlyMap[mKey] = { income: 0, expense: 0 };

        if (r.type === "income") monthlyMap[mKey].income += r.amount;
        else monthlyMap[mKey].expense += r.amount;

        // -------- WEEKLY --------
        const year = date.getFullYear();
        const firstDay = new Date(year, 0, 1);
        const week = Math.ceil(((date - firstDay) / 86400000 + firstDay.getDay() + 1) / 7);

        const startOfWeek = new Date(firstDay.getTime() + (week - 1) * 7 * 86400000);
        const endOfWeek = new Date(startOfWeek.getTime() + 6 * 86400000);

        const wKey = `${startOfWeek.toISOString().slice(0, 10)} to ${endOfWeek.toISOString().slice(0, 10)}`;

        if (!weeklyMap[wKey]) weeklyMap[wKey] = { income: 0, expense: 0 };

        if (r.type === "income") weeklyMap[wKey].income += r.amount;
        else weeklyMap[wKey].expense += r.amount;
    });

    //  Chart-ready format
    const monthlyTrends = Object.keys(monthlyMap)
        .sort()
        .map(key => ({
            label: key,
            income: monthlyMap[key].income,
            expense: monthlyMap[key].expense
        }));

    const weeklyTrends = Object.keys(weeklyMap)
        .sort()
        .map(key => ({
            label: key,
            income: weeklyMap[key].income,
            expense: weeklyMap[key].expense
        }));

    return { monthlyTrends, weeklyTrends };
};

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

export const getCategoryData = (records) => {
  const categoryWise = {};

  records.forEach(r => {
    if (!categoryWise[r.category]) categoryWise[r.category] = 0;
    categoryWise[r.category] += r.amount;
  });

  // chart-ready
  const categoryChart = Object.keys(categoryWise).map(key => ({
    label: key,
    value: categoryWise[key]
  }));

  return { categoryWise, categoryChart };
};

export const getTopCategories = (records) => {
  const map = {};

  records.forEach(r => {
    if (!map[r.category]) map[r.category] = { income: 0, expense: 0 };

    if (r.type === "income") map[r.category].income += r.amount;
    else map[r.category].expense += r.amount;
  });

  return {
    topIncomeCategories: Object.entries(map)
      .sort((a,b)=>b[1].income-a[1].income)
      .slice(0,3)
      .map(([c,v])=>({label:c,value:v.income})),

    topExpenseCategories: Object.entries(map)
      .sort((a,b)=>b[1].expense-a[1].expense)
      .slice(0,3)
      .map(([c,v])=>({label:c,value:v.expense}))
  };
};

