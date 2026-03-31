import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { listTransactions } from '../services/transactionService';
import { calculateSummary, groupByCategory, groupByMonth } from '../utils/finance';

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!currentUser?.uid) {
        return;
      }

      setLoading(true);
      const data = await listTransactions(currentUser.uid);
      setTransactions(data);
      setLoading(false);
    }

    load();
  }, [currentUser?.uid]);

  const summary = useMemo(() => calculateSummary(transactions), [transactions]);
  const byCategory = useMemo(() => groupByCategory(transactions), [transactions]);
  const byMonth = useMemo(() => groupByMonth(transactions), [transactions]);

  if (loading) {
    return <p>Carregando dashboard...</p>;
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <h2>Dashboard Financeiro</h2>
        <p>Visão geral dos seus resultados e comportamento de gastos.</p>
      </div>

      <div className="cards-grid">
        <article className="card metric income">
          <h3>Entradas</h3>
          <p>R$ {summary.income.toFixed(2)}</p>
        </article>
        <article className="card metric expense">
          <h3>Saídas</h3>
          <p>R$ {summary.expense.toFixed(2)}</p>
        </article>
        <article className="card metric balance">
          <h3>Saldo</h3>
          <p>R$ {summary.balance.toFixed(2)}</p>
        </article>
      </div>

      <div className="charts-grid">
        <article className="chart-card">
          <h3>Comparação mensal (Entrada x Saída)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="entrada" fill="#3f51b5" />
              <Bar dataKey="saida" fill="#d32f2f" />
            </BarChart>
          </ResponsiveContainer>
        </article>

        <article className="chart-card">
          <h3>Gastos por categoria</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={byCategory} dataKey="value" nameKey="name" outerRadius={100} fill="#1976d2" />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </article>
      </div>
    </section>
  );
}
