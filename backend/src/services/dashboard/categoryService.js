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