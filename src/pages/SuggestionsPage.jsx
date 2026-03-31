import { saveAs } from 'file-saver';
import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { useAuth } from '../contexts/AuthContext';
import { listTransactions } from '../services/transactionService';
import { buildSuggestions, calculateSummary, groupByCategory } from '../utils/finance';

export default function SuggestionsPage() {
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      if (!currentUser?.uid) {
        return;
      }

      const data = await listTransactions(currentUser.uid);
      setTransactions(data);
    }

    load();
  }, [currentUser?.uid]);

  const summary = useMemo(() => calculateSummary(transactions), [transactions]);
  const categories = useMemo(() => groupByCategory(transactions), [transactions]);
  const suggestions = useMemo(() => buildSuggestions(summary, categories), [summary, categories]);
  const entries = useMemo(() => transactions.filter((tx) => tx.type === 'entrada'), [transactions]);
  const exits = useMemo(() => transactions.filter((tx) => tx.type === 'saida'), [transactions]);

  function buildApiCandidates() {
    const envBaseUrl = import.meta.env.VITE_API_BASE_URL;

    if (envBaseUrl) {
      return [`${envBaseUrl}/api/export-excel`];
    }

    return ['/api/export-excel', 'http://localhost:4000/api/export-excel'];
  }

  function exportExcelClientSide() {
    const workbook = XLSX.utils.book_new();

    const resumoData = [
      { campo: 'Usuário', valor: currentUser?.email || 'sem-email' },
      { campo: 'Entradas', valor: Number(summary?.income || 0) },
      { campo: 'Saídas', valor: Number(summary?.expense || 0) },
      { campo: 'Saldo', valor: Number(summary?.balance || 0) },
    ];

    const mapTransactionToRow = (tx) => ({
      Data: tx.date,
      Mês: tx.month,
      Categoria: tx.category,
      Local: tx.place,
      Descrição: tx.description,
      Valor: Number(tx.amount || 0),
    });

    const entradasData = entries.map(mapTransactionToRow);
    const saidasData = exits.map(mapTransactionToRow);

    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(resumoData), 'Resumo');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(entradasData), 'Entradas');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(saidasData), 'Saidas');

    XLSX.writeFile(workbook, 'relatorio-financeiro.xlsx');
  }

  async function exportExcel() {
    setLoading(true);
    setError('');

    const payload = {
      userEmail: currentUser?.email,
      summary,
      entries,
      exits,
    };

    try {
      let response;

      for (const url of buildApiCandidates()) {
        try {
          response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          if (response.ok) {
            break;
          }
        } catch {
          response = undefined;
        }
      }

      if (!response?.ok) {
        throw new Error();
      }

      const blob = await response.blob();
      saveAs(blob, 'relatorio-financeiro.xlsx');
    } catch {
      try {
        exportExcelClientSide();
      } catch {
        setError('Não foi possível exportar o Excel no momento.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <h2>Sugestões e plano de economia</h2>
        <p>Dicas práticas para reduzir gastos e aumentar sua reserva mensal.</p>
      </div>

      <ul className="suggestion-list">
        {suggestions.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      {error && <p className="error">{error}</p>}

      <article className="card">
        <h3>Plano sugerido para guardar dinheiro</h3>
        <p>Objetivo: guardar pelo menos 20% da sua renda mensal.</p>
        <p>
          Valor recomendado atual: <strong>R$ {Math.max(summary.income * 0.2, 100).toFixed(2)}</strong>
        </p>
        <p>Separar esse valor no início do mês ajuda a manter disciplina financeira.</p>
      </article>

      <button type="button" className="success" onClick={exportExcel} disabled={loading}>
        {loading ? 'Gerando Excel...' : 'Exportar relatório em Excel'}
      </button>
    </section>
  );
}
