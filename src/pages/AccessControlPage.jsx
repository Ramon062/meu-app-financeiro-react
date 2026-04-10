import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { useAuth } from '../contexts/AuthContext';
import {
  addAccessControl,
  listAccessControls,
  removeAccessControl,
} from '../services/accessControlService';

const BASE_COLUMNS = [
  { key: 'department', label: 'Departamento' },
  { key: 'platform', label: 'Plataforma' },
  { key: 'accessType', label: 'Tipo de acesso' },
  { key: 'site', label: 'Site' },
  { key: 'login', label: 'Login' },
  { key: 'password', label: 'Senha' },
  { key: 'marketplace', label: 'Marketplace' },
  { key: 'google', label: 'Google (Analytics, Tag Manager, Search Console, UTM, etc)' },
  { key: 'brand', label: 'Marca' },
  { key: 'owner', label: 'Responsável' },
  { key: 'notes', label: 'Observação' },
];

const DEFAULT_FORM = BASE_COLUMNS.reduce((acc, column) => {
  acc[column.key] = '';
  return acc;
}, {});

function normalizeColumnKey(value) {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  return normalized || `coluna_${Date.now()}`;
}

function getLocalStorageKey(userId) {
  return `access-columns-${userId}`;
}

export default function AccessControlPage() {
  const { currentUser } = useAuth();
  const [records, setRecords] = useState([]);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [dynamicColumns, setDynamicColumns] = useState([]);
  const [dynamicValues, setDynamicValues] = useState({});
  const [newColumnName, setNewColumnName] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const allColumns = useMemo(() => [...BASE_COLUMNS, ...dynamicColumns], [dynamicColumns]);

  useEffect(() => {
    async function loadRecords() {
      if (!currentUser?.uid) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        const data = await listAccessControls(currentUser.uid);
        setRecords(data);
      } catch (firebaseError) {
        if (firebaseError?.code === 'permission-denied') {
          setError('Sem permissão para acessar estes dados. Verifique as regras do Firestore.');
        } else {
          setError('Não foi possível carregar os acessos agora.');
        }
      } finally {
        setLoading(false);
      }
    }

    loadRecords();
  }, [currentUser?.uid]);

  useEffect(() => {
    if (!currentUser?.uid) {
      return;
    }

    const rawData = localStorage.getItem(getLocalStorageKey(currentUser.uid));

    if (!rawData) {
      setDynamicColumns([]);
      return;
    }

    try {
      const parsed = JSON.parse(rawData);
      if (Array.isArray(parsed)) {
        setDynamicColumns(parsed);
      }
    } catch {
      setDynamicColumns([]);
    }
  }, [currentUser?.uid]);

  useEffect(() => {
    if (!currentUser?.uid) {
      return;
    }

    localStorage.setItem(getLocalStorageKey(currentUser.uid), JSON.stringify(dynamicColumns));
  }, [currentUser?.uid, dynamicColumns]);

  function onBaseFieldChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function onDynamicFieldChange(event) {
    const { name, value } = event.target;
    setDynamicValues((prev) => ({ ...prev, [name]: value }));
  }

  function onAddColumn() {
    const trimmed = newColumnName.trim();
    if (!trimmed) {
      return;
    }

    const generatedKey = normalizeColumnKey(trimmed);
    const keyAlreadyExists = allColumns.some((column) => column.key === generatedKey);

    if (keyAlreadyExists) {
      setError('Essa coluna já existe. Escolha outro nome.');
      return;
    }

    setError('');
    setDynamicColumns((prev) => [...prev, { key: generatedKey, label: trimmed }]);
    setDynamicValues((prev) => ({ ...prev, [generatedKey]: '' }));
    setNewColumnName('');
  }

  async function onSubmit(event) {
    event.preventDefault();

    if (!currentUser?.uid) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      await addAccessControl(currentUser.uid, {
        ...formData,
        dynamicValues,
      });

      const data = await listAccessControls(currentUser.uid);
      setRecords(data);
      setFormData(DEFAULT_FORM);
      setDynamicValues({});
    } catch (firebaseError) {
      if (firebaseError?.code === 'permission-denied') {
        setError('Sem permissão para salvar. Verifique as regras do Firestore.');
      } else {
        setError('Não foi possível salvar o acesso agora.');
      }
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(recordId) {
    if (!currentUser?.uid) {
      return;
    }

    setError('');

    try {
      await removeAccessControl(currentUser.uid, recordId);
      const data = await listAccessControls(currentUser.uid);
      setRecords(data);
    } catch (firebaseError) {
      if (firebaseError?.code === 'permission-denied') {
        setError('Sem permissão para excluir. Verifique as regras do Firestore.');
      } else {
        setError('Não foi possível excluir o acesso agora.');
      }
    }
  }

  function exportExcel() {
    const rows = records.map((record) => {
      const baseData = BASE_COLUMNS.reduce((acc, column) => {
        acc[column.label] = record[column.key] || '';
        return acc;
      }, {});

      const extraData = dynamicColumns.reduce((acc, column) => {
        acc[column.label] = record.dynamicValues?.[column.key] || '';
        return acc;
      }, {});

      return {
        ...baseData,
        ...extraData,
      };
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Controle de acessos');
    XLSX.writeFile(workbook, 'controle-acessos-logins.xlsx');
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <h2>Controle de acessos e logins</h2>
        <p>Cadastre e gerencie todos os acessos por departamento, plataforma e responsável.</p>
      </div>

      <div className="card access-columns-actions">
        <input
          type="text"
          placeholder="Nome da nova coluna"
          value={newColumnName}
          onChange={(event) => setNewColumnName(event.target.value)}
        />
        <button type="button" className="secondary" onClick={onAddColumn}>
          Adicionar coluna
        </button>
        <button type="button" className="success" onClick={exportExcel}>
          Exportar em Excel
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      <form className="access-form" onSubmit={onSubmit}>
        {BASE_COLUMNS.map((column) => (
          <input
            key={column.key}
            type="text"
            name={column.key}
            placeholder={column.label}
            value={formData[column.key]}
            onChange={onBaseFieldChange}
            required={column.key !== 'notes'}
          />
        ))}

        {dynamicColumns.map((column) => (
          <input
            key={column.key}
            type="text"
            name={column.key}
            placeholder={column.label}
            value={dynamicValues[column.key] || ''}
            onChange={onDynamicFieldChange}
          />
        ))}

        <button type="submit" disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar acesso'}
        </button>
      </form>

      {loading ? (
        <p>Carregando acessos...</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {BASE_COLUMNS.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
                {dynamicColumns.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  {BASE_COLUMNS.map((column) => (
                    <td key={`${record.id}-${column.key}`}>{record[column.key] || '-'}</td>
                  ))}
                  {dynamicColumns.map((column) => (
                    <td key={`${record.id}-${column.key}`}>{record.dynamicValues?.[column.key] || '-'}</td>
                  ))}
                  <td>
                    <button type="button" className="danger" onClick={() => onDelete(record.id)}>
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
