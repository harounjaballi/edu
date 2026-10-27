import React, { useState } from 'react';
import { Shield, UserCheck, GraduationCap, KeyRound, X, LogIn } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { UserRole } from '../types.ts';

interface AuthSwitchModalProps {
  currentRole: UserRole;
  currentUid: string;
  onSelectIdentity: (identity: {
    uid: string;
    role: UserRole;
    name: string;
    email: string;
  }) => void;
  onClose: () => void;
}

export const AuthSwitchModal: React.FC<AuthSwitchModalProps> = ({
  currentRole,
  currentUid,
  onSelectIdentity,
  onClose,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [secret, setSecret] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const presetAccounts: Array<{
    uid: string;
    role: UserRole;
    name: string;
    email: string;
    subtitle: string;
    credentialsHint: string;
  }> = [
    {
      uid: 'admin-haroun',
      role: 'super_admin',
      name: 'Dr. Haroun Jaballi',
      email: 'harounjaballi@gmail.com',
      subtitle: 'Super Administrateur — Supervision globale de l’établissement',
      credentialsHint: 'Accès intégral : Professeurs, Élèves, Classes, RLS & Paramètres',
    },
    {
      uid: 'teacher-laurent',
      role: 'teacher',
      name: 'Marc Laurent',
      email: 'm.laurent@eduspace.fr',
      subtitle: 'Professeur Agrégé — Mathématiques Spécialité & Expertes',
      credentialsHint: 'Classes : TG-SCI-A & TG-SCI-B · 4 élèves rattachés',
    },
    {
      uid: 'teacher-moreau',
      role: 'teacher',
      name: 'Sophie Moreau',
      email: 's.moreau@eduspace.fr',
      subtitle: 'Professeure — Physique-Chimie & Laboratoire',
      credentialsHint: 'Classe : 1G-LAB · Élève rattaché : Yanis Khelifi',
    },
    {
      uid: 'student-claire',
      role: 'student',
      name: 'Claire Dubois',
      email: 'claire.dubois@eleve.eduspace.fr',
      subtitle: 'Élève — Terminale Générale Série Scientifique A (Groupe A)',
      credentialsHint: 'Code élève : ELV-2026-001 · Code PIN : EDU-8492',
    },
    {
      uid: 'student-emma',
      role: 'student',
      name: 'Emma Bernard',
      email: 'emma.bernard@eleve.eduspace.fr',
      subtitle: 'Élève — Terminale Générale Série Scientifique B (Groupe B)',
      credentialsHint: 'Code élève : ELV-2026-003 · Code PIN : EDU-7541',
    },
  ];

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/credentials-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, secret }),
      });
      const data = await response.json();
      if (!response.ok) {
        setLoginError(data.error || 'Identifiants invalides.');
      } else {
        onSelectIdentity({
          uid: data.uid,
          role: data.role as UserRole,
          name: data.fullName,
          email: data.email,
        });
        onClose();
      }
    } catch {
      setLoginError('Erreur réseau lors de la vérification des identifiants.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoginError('');
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      if (result.user) {
        onSelectIdentity({
          uid: 'admin-haroun',
          role: 'super_admin',
          name: result.user.displayName || 'Dr. Haroun Jaballi',
          email: result.user.email || 'harounjaballi@gmail.com',
        });
        onClose();
      }
    } catch (err: any) {
      setLoginError(
        err?.message || 'Connexion Google annulée ou bloquée par le navigateur.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h3 className="font-display text-base font-semibold text-slate-900">
              Authentification & Changement d’Espace Utilisateur
            </h3>
            <p className="text-xs text-slate-500">
              Connectez-vous avec un code élève / email ou basculez entre les 3 rôles pour tester les permissions RLS.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 divide-y divide-slate-200 md:grid-cols-2 md:divide-x md:divide-y-0">
          {/* Left: Credential Login & Google Auth */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
              <KeyRound className="h-4 w-4 text-blue-600" />
              <span>Connexion par Identifiants (Email ou Code Élève)</span>
            </div>

            <form onSubmit={handleCredentialsSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Email ou Code Élève
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: ELV-2026-001 ou m.laurent@eduspace.fr"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Code PIN d’accès (pour les élèves)
                </label>
                <input
                  type="text"
                  placeholder="ex: EDU-8492"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono text-slate-900 focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              {loginError && (
                <p className="rounded-lg bg-red-50 p-2.5 text-xs text-red-700">
                  {loginError}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>{isLoading ? 'Vérification...' : 'Se connecter au compte'}</span>
              </button>
            </form>

            <div className="pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <span>Connexion SSO Google (Super Admin / Établissement)</span>
              </button>
            </div>
          </div>

          {/* Right: Quick Role Switcher for Testing */}
          <div className="p-6 space-y-3 bg-slate-50/50">
            <div className="text-xs font-semibold text-slate-900">
              Accès rapide aux 3 espaces (Comptes PostgreSQL actifs)
            </div>
            <div className="space-y-2">
              {presetAccounts.map((acc) => {
                const isSelected =
                  acc.uid === currentUid && acc.role === currentRole;
                return (
                  <button
                    key={acc.uid}
                    type="button"
                    onClick={() => {
                      onSelectIdentity({
                        uid: acc.uid,
                        role: acc.role,
                        name: acc.name,
                        email: acc.email,
                      });
                      onClose();
                    }}
                    className={`w-full text-left rounded-lg border p-2.5 transition-colors ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-900">
                        {acc.name}
                      </span>
                      <span className="text-xs font-medium text-blue-700">
                        {acc.role === 'super_admin'
                          ? 'Super Admin'
                          : acc.role === 'teacher'
                          ? 'Professeur'
                          : 'Élève'}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-600 truncate">
                      {acc.subtitle}
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-slate-500">
                      {acc.credentialsHint}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
