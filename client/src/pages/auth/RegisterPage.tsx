import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const RegisterPage = () => {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirm: '' });
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }
    register({ email: form.email, firstName: form.firstName, lastName: form.lastName });
    navigate('/app');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Créer un compte</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">Prénom</label>
            <input
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Nom</label>
            <input
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Mot de passe</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Confirmation</label>
          <input
            type="password"
            name="confirm"
            value={form.confirm}
            onChange={handleChange}
            className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2"
            required
          />
        </div>
        <button type="submit" className="w-full px-4 py-3 bg-primary text-white rounded-md font-semibold">
          Créer mon compte
        </button>
      </form>
    </div>
  );
};

export default RegisterPage;
