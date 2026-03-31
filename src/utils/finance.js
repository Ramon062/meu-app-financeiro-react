export function calculateSummary(transactions) {
  const totals = transactions.reduce(
    (acc, tx) => {
      if (tx.type === 'entrada') {
        acc.income += Number(tx.amount || 0);
      } else {
        acc.expense += Number(tx.amount || 0);
      }
      return acc;
    },
    { income: 0, expense: 0 }
  );

  const balance = totals.income - totals.expense;
  return { ...totals, balance };
}

export function groupByCategory(transactions) {
  const expenses = transactions.filter((tx) => tx.type === 'saida');

  return Object.entries(
    expenses.reduce((acc, tx) => {
      const category = tx.category || 'Outros';
      acc[category] = (acc[category] || 0) + Number(tx.amount || 0);
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));
}

export function groupByMonth(transactions) {
  return Object.entries(
    transactions.reduce((acc, tx) => {
      const key = tx.month || tx.date?.slice(0, 7) || 'sem-mes';
      const amount = Number(tx.amount || 0);
      const monthObj = acc[key] || { month: key, entrada: 0, saida: 0 };

      if (tx.type === 'entrada') {
        monthObj.entrada += amount;
      } else {
        monthObj.saida += amount;
      }

      acc[key] = monthObj;
      return acc;
    }, {})
  )
    .map(([, value]) => value)
    .sort((a, b) => a.month.localeCompare(b.month));
}

export function buildSuggestions(summary, categoryData) {
  const topExpense = [...categoryData].sort((a, b) => b.value - a.value)[0];
  const suggestions = [];

  if (summary.expense > summary.income) {
    suggestions.push('Seus gastos estão acima das entradas. Defina limite semanal para despesas variáveis.');
  }

  if (topExpense) {
    suggestions.push(
      `A maior categoria de gasto é ${topExpense.name}. Tente reduzir 10% nesta categoria neste mês.`
    );
  }

  const reserveTarget = Math.max(summary.income * 0.2, 100);
  suggestions.push(`Meta de reserva sugerida: R$ ${reserveTarget.toFixed(2)} por mês.`);

  return suggestions;
}
