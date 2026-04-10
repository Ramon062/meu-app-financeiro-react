import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function getFirebaseAuthErrorMessage(firebaseError) {
  const errorCode = firebaseError?.code;

  switch (errorCode) {
    case 'auth/invalid-api-key':
      return 'Configuração Firebase inválida no ambiente. Verifique as variáveis VITE_FIREBASE_* no Vercel.';
    case 'auth/configuration-not-found':
      return 'Configuração de autenticação não encontrada no Firebase. Verifique o provider Google.';
    case 'auth/operation-not-allowed':
      return 'Login com Google desativado no Firebase Authentication.';
    case 'auth/unauthorized-domain':
      return 'Domínio não autorizado no Firebase Auth. Adicione seu domínio do Vercel em Authentication > Settings > Authorized domains.';
    case 'auth/popup-blocked':
      return 'Popup bloqueado pelo navegador. Libere popups e tente novamente.';
    case 'auth/popup-closed-by-user':
      return 'Janela de login fechada antes da conclusão.';
    default:
      return 'Falha no login com Google.';
  }
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      setError('Não foi possível entrar. Verifique email e senha.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError('');
    setLoading(true);

    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (firebaseError) {
      setError(getFirebaseAuthErrorMessage(firebaseError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <h2>Bem-vindo de volta</h2>
        <p>Entre com email e senha para acessar seu painel financeiro.</p>
        {error && <p className="error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Digite seu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Digite sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <button type="button" className="secondary" onClick={handleGoogleLogin} disabled={loading}>
          Entrar com Google
        </button>

        <p>
          Não tem conta? <Link to="/cadastro">Criar agora</Link>
        </p>
      </div>
    </section>
  );
}
