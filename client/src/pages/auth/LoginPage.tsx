import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(email, password);
    if (!success) {
      setError('Identifiants incorrects. Utilisez les comptes de démo indiqués dans le README.');
      return;
    }
    navigate('/app');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Se connecter</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</p>}
        <div>
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2"
            required
          />
        </div>
        <button type="submit" className="w-full px-4 py-3 bg-primary text-white rounded-md font-semibold">
          Connexion
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
