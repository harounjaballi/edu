import React, { useState } from 'react';
import { Copy, Check, Database, Shield, Server, Terminal } from 'lucide-react';

export const SqlAndDeployGuide: React.FC = () => {
  const [copiedBlock, setCopiedBlock] = useState<string | null>(null);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBlock(key);
    setTimeout(() => setCopiedBlock(null), 2000);
  };

  const envConfigText = `# Variables d'environnement Supabase & Déploiement Vercel (.env.local)
VITE_SUPABASE_URL="https://votre-projet-id.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
VITE_JITSI_DOMAIN="meet.jit.si"

# Variables PostgreSQL Serveur (Backend API / Drizzle ORM)
SQL_HOST="db.votre-projet-id.supabase.co"
SQL_DB_NAME="postgres"
SQL_USER="postgres"
SQL_PASSWORD="votre-mot-de-passe-securise"`;

  const rlsSqlSnippet = `-- Activation de Row Level Security (RLS) sur les 16 tables PostgreSQL
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Fonction sécurisée de vérification du rôle (interdit toute auto-promotion côté navigateur)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE uid = auth.uid()::text LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Politique 1 : Isolation stricte des élèves par professeur référent
CREATE POLICY "Professeur accède uniquement à ses propres élèves" ON public.students
  FOR ALL USING (
    public.get_current_user_role() = 'super_admin'
    OR primary_teacher_id IN (SELECT id FROM public.teachers WHERE uid = auth.uid()::text)
    OR uid = auth.uid()::text
  );

-- Politique 2 : Un élève ne peut consulter que les documents publiés pour sa classe et son groupe
CREATE POLICY "Accès élève limité aux documents autorisés" ON public.documents
  FOR SELECT USING (
    public.get_current_user_role() = 'super_admin'
    OR teacher_id IN (SELECT id FROM public.teachers WHERE uid = auth.uid()::text)
    OR (
      class_id IN (
        SELECT e.class_id FROM public.enrollments e
        JOIN public.students s ON s.id = e.student_id
        WHERE s.uid = auth.uid()::text
      )
    )
  );`;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-base font-semibold text-slate-900">
              Architecture PostgreSQL, Politiques RLS & Déploiement GitHub / Vercel
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              L’application est connectée en temps réel à PostgreSQL (16 tables relationnelles actives). Vous trouverez ci-dessous le script SQL complet avec Row Level Security (RLS) pour Supabase ainsi que la procédure de déploiement.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Database className="h-4 w-4 text-blue-600" />
              <span>16 Tables Relationnelles</span>
            </div>
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
              profiles · teachers · students · classes · subjects · teacher_classes · enrollments · courses · documents · conversations · messages · live_sessions · session_participants · notifications · student_activity · activity_logs
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Shield className="h-4 w-4 text-blue-600" />
              <span>Sécurité RLS & Permissions</span>
            </div>
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
              Clés secrètes isolées côté serveur uniquement. Vérification systématique du rôle sur chaque requête API. Aucun élève ne peut lire le profil ou les messages d’un autre élève.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Server className="h-4 w-4 text-blue-600" />
              <span>Déploiement GitHub & Vercel</span>
            </div>
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
              Script SQL prêt à exécuter dans l’éditeur SQL Supabase (`supabase_schema_and_rls.sql` inclus à la racine du dépôt) et build Vite/TypeScript vérifié.
            </p>
          </div>
        </div>
      </div>

      {/* SQL RLS Script */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-blue-600" />
            <h4 className="font-display text-sm font-semibold text-slate-900">
              Extrait des Politiques Row Level Security (RLS) — Fichier complet : /supabase_schema_and_rls.sql
            </h4>
          </div>
          <button
            type="button"
            onClick={() => handleCopy('sql', rlsSqlSnippet)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
          >
            {copiedBlock === 'sql' ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span>Copié</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copier le script RLS</span>
              </>
            )}
          </button>
        </div>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-900 p-4 font-mono text-xs text-slate-100 leading-relaxed">
          {rlsSqlSnippet}
        </pre>
      </div>

      {/* Env & Deployment */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h4 className="font-display text-sm font-semibold text-slate-900">
            Variables d’environnement & Étapes de déploiement (GitHub / Vercel)
          </h4>
          <button
            type="button"
            onClick={() => handleCopy('env', envConfigText)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
          >
            {copiedBlock === 'env' ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span>Copié</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copier .env.example</span>
              </>
            )}
          </button>
        </div>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-900 p-4 font-mono text-xs text-slate-100 leading-relaxed">
          {envConfigText}
        </pre>
      </div>
    </div>
  );
};
