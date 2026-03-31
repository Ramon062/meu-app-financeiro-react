import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { addTransaction, listTransactions, removeTransaction } from '../services/transactionService';

const categories = [
  'bebida',
  'combustivel',
  'comida',
  'ifood',
  'imprevistos',
  'transferencias realizadas',
  'pix enviados',
  'pix recebidos',
  'Salario',
  'freelance',
  'investimentos',
  'outros',
];

const initialForm = {
  date: '',
  month: '',
  type: 'saida',
  amount: '',
  place: '',
  description: '',
  category: categories[0],
};

export default function ExpensesPage() {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState(initialForm);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  async function loadTransactions() {
    if (!currentUser?.uid) {
      return;
    }

    const data = await listTransactions(currentUser.uid);
    setTransactions(data);
  }

  useEffect(() => {
    loadTransactions();
  }, [currentUser?.uid]);

  function onChange(event) {
    const { name, value } = event.target;

    if (name === 'date') {
      setFormData((prev) => ({ ...prev, date: value, month: value.slice(0, 7) }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function onSubmit(event) {
    event.preventDefault();

    if (!currentUser?.uid) {
      return;
    }

    setLoading(true);
    await addTransaction(currentUser.uid, formData);
    setFormData(initialForm);
    await loadTransactions();
    setLoading(false);
  }

  async function onDelete(transactionId) {
    if (!currentUser?.uid) {
      return;
    }

    await removeTransaction(currentUser.uid, transactionId);
    await loadTransactions();
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <h2>Lançar gasto / entrada</h2>
        <p>Registre seus movimentos financeiros e acompanhe tudo em tempo real.</p>
      </div>

      <form className="expense-form" onSubmit={onSubmit}>
        <input type="date" name="date" value={formData.date} onChange={onChange} required />

        <select name="type" value={formData.type} onChange={onChange}>
          <option value="entrada">Entrada</option>
          <option value="saida">Saída</option>
        </select>

        <input
          type="number"
          name="amount"
          placeholder="Valor"
          step="0.01"
          min="0"
          value={formData.amount}
          onChange={onChange}
          required
        />

        <input
          type="text"
          name="place"
          placeholder="Local"
          value={formData.place}
          onChange={onChange}
          required
        />

        <input
          type="text"
          name="description"
          placeholder="Descrição"
          value={formData.description}
          onChange={onChange}
          required
        />

        <select name="category" value={formData.category} onChange={onChange}>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar lançamento'}
        </button>
      </form>

      <h3>Meus lançamentos</h3>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Tipo</th>
              <th>Categoria</th>
              <th>Local</th>
              <th>Descrição</th>
              <th>Valor</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id}>
                <td>{tx.date}</td>
                <td>
                  <span className={`badge ${tx.type === 'entrada' ? 'badge-income' : 'badge-expense'}`}>
                    {tx.type}
                  </span>
                </td>
                <td>{tx.category}</td>
                <td>{tx.place}</td>
                <td>{tx.description}</td>
                <td>R$ {Number(tx.amount || 0).toFixed(2)}</td>
                <td>
                  <button type="button" className="danger" onClick={() => onDelete(tx.id)}>
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
