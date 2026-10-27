-- =============================================================================
-- PROJET : EDUSPACE — PLATEFORME D'ENSEIGNEMENT EN LIGNE
-- Script SQL Complet PostgreSQL / Supabase (Schéma Relationnel + Index + RLS)
-- =============================================================================

-- 0. Paramètres généraux de la plateforme
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id SERIAL PRIMARY KEY,
  platform_name TEXT NOT NULL DEFAULT 'EduSpace',
  institution_name TEXT NOT NULL DEFAULT 'Institut Académique Supérieur',
  academic_year TEXT NOT NULL DEFAULT '2026-2027',
  jitsi_domain TEXT NOT NULL DEFAULT 'meet.jit.si',
  allow_student_downloads_default BOOLEAN NOT NULL DEFAULT true,
  maintenance_mode BOOLEAN NOT NULL DEFAULT false,
  support_email TEXT NOT NULL DEFAULT 'support@eduspace.fr',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1. Table profiles (Profils utilisateurs et rôles : super_admin, teacher, student)
CREATE TABLE IF NOT EXISTS public.profiles (
  id SERIAL PRIMARY KEY,
  uid TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('super_admin', 'teacher', 'student')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  phone TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  last_login_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Table teachers (Informations des professeurs)
CREATE TABLE IF NOT EXISTS public.teachers (
  id SERIAL PRIMARY KEY,
  profile_id INTEGER NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  uid TEXT NOT NULL UNIQUE,
  specialty TEXT NOT NULL DEFAULT 'Mathématiques & Sciences',
  department TEXT NOT NULL DEFAULT 'Enseignement Général',
  qualification TEXT DEFAULT 'Agrégé / Certifié',
  bio TEXT DEFAULT '',
  office_hours TEXT DEFAULT 'Lun-Ven 14h00 - 17h00',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Table students (Informations des élèves et rattachement aux professeurs)
CREATE TABLE IF NOT EXISTS public.students (
  id SERIAL PRIMARY KEY,
  profile_id INTEGER NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  uid TEXT NOT NULL UNIQUE,
  student_code TEXT NOT NULL UNIQUE,
  primary_teacher_id INTEGER REFERENCES public.teachers(id) ON DELETE SET NULL,
  grade_level TEXT NOT NULL DEFAULT 'Terminale',
  group_name TEXT NOT NULL DEFAULT 'Groupe A',
  subject_focus TEXT DEFAULT 'Tronc Commun',
  access_pin TEXT NOT NULL DEFAULT 'EDU-2026',
  parent_email TEXT DEFAULT '',
  parent_phone TEXT DEFAULT '',
  pedagogical_notes TEXT DEFAULT '',
  completion_rate INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Table classes (Classes et groupes)
CREATE TABLE IF NOT EXISTS public.classes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  level TEXT NOT NULL,
  group_name TEXT NOT NULL DEFAULT 'Groupe Principal',
  academic_year TEXT NOT NULL DEFAULT '2026-2027',
  description TEXT DEFAULT '',
  teacher_id INTEGER REFERENCES public.teachers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Table subjects (Matières)
CREATE TABLE IF NOT EXISTS public.subjects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'Sciences',
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Table teacher_classes (Affectations des professeurs aux classes)
CREATE TABLE IF NOT EXISTS public.teacher_classes (
  id SERIAL PRIMARY KEY,
  teacher_id INTEGER NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  class_id INTEGER NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Table enrollments (Inscriptions des élèves aux classes)
CREATE TABLE IF NOT EXISTS public.enrollments (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id INTEGER NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id INTEGER REFERENCES public.subjects(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active',
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Table courses (Cours)
CREATE TABLE IF NOT EXISTS public.courses (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  chapter TEXT NOT NULL DEFAULT 'Chapitre 1',
  description TEXT NOT NULL,
  content TEXT DEFAULT '',
  video_url TEXT DEFAULT '',
  external_link TEXT DEFAULT '',
  class_id INTEGER NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id INTEGER NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'published',
  published_date TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Table documents (Fichiers et ressources pédagogiques)
CREATE TABLE IF NOT EXISTS public.documents (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  file_type TEXT NOT NULL DEFAULT 'PDF',
  file_url TEXT NOT NULL,
  file_size TEXT NOT NULL DEFAULT '1.2 Mo',
  chapter TEXT NOT NULL DEFAULT 'Chapitre 1',
  course_id INTEGER REFERENCES public.courses(id) ON DELETE SET NULL,
  class_id INTEGER NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id INTEGER NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  allow_download BOOLEAN NOT NULL DEFAULT true,
  allowed_group TEXT NOT NULL DEFAULT 'Tous',
  allowed_student_ids TEXT DEFAULT '',
  views_count INTEGER NOT NULL DEFAULT 0,
  published_date TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Table conversations (Conversations de messagerie)
CREATE TABLE IF NOT EXISTS public.conversations (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'private',
  teacher_id INTEGER NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES public.students(id) ON DELETE CASCADE,
  class_id INTEGER REFERENCES public.classes(id) ON DELETE CASCADE,
  last_message_preview TEXT DEFAULT '',
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Table messages (Messages envoyés et reçus)
CREATE TABLE IF NOT EXISTS public.messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_uid TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  recipient_uid TEXT DEFAULT '',
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_announcement BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Table live_sessions (Séances de visioconférence Jitsi Meet)
CREATE TABLE IF NOT EXISTS public.live_sessions (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  subject_id INTEGER NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id INTEGER NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id INTEGER NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  room_name TEXT NOT NULL,
  meeting_url TEXT NOT NULL,
  scheduled_date TEXT NOT NULL,
  scheduled_time TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'scheduled',
  allowed_group TEXT NOT NULL DEFAULT 'Tous',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Table session_participants (Participants et présence)
CREATE TABLE IF NOT EXISTS public.session_participants (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  attendance_status TEXT NOT NULL DEFAULT 'present',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_minutes INTEGER NOT NULL DEFAULT 45,
  participation_note TEXT DEFAULT ''
);

-- 14. Table notifications (Notifications des utilisateurs)
CREATE TABLE IF NOT EXISTS public.notifications (
  id SERIAL PRIMARY KEY,
  recipient_uid TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'system',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Table student_activity (Historique d'activité pédagogique)
CREATE TABLE IF NOT EXISTS public.student_activity (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  resource_title TEXT NOT NULL,
  details TEXT DEFAULT '',
  progress_delta INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. Table activity_logs (Journal des actions sensibles)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id SERIAL PRIMARY KEY,
  actor_uid TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT DEFAULT '',
  details TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEX DE PERFORMANCE
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_students_teacher ON public.students(primary_teacher_id);
CREATE INDEX IF NOT EXISTS idx_courses_teacher ON public.courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_courses_class ON public.courses(class_id);
CREATE INDEX IF NOT EXISTS idx_documents_teacher ON public.documents(teacher_id);
CREATE INDEX IF NOT EXISTS idx_documents_class ON public.documents(class_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_teacher ON public.live_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_uid);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON public.activity_logs(created_at DESC);

-- =============================================================================
-- POLITIQUES ROW LEVEL SECURITY (RLS) POUR SUPABASE / POSTGRESQL
-- =============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Fonction utilitaire sécurisée pour récupérer le rôle de l'utilisateur courant
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE uid = auth.uid()::text LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 1. Politiques sur profiles (Interdiction absolue de s'auto-promouvoir super_admin)
CREATE POLICY "Super Admin accès total aux profils" ON public.profiles
  FOR ALL USING (public.get_current_user_role() = 'super_admin');

CREATE POLICY "Utilisateurs lisent leur propre profil" ON public.profiles
  FOR SELECT USING (uid = auth.uid()::text);

-- 2. Politiques d'isolation Professeur sur students
CREATE POLICY "Professeur accède uniquement à ses élèves rattachés" ON public.students
  FOR ALL USING (
    public.get_current_user_role() = 'super_admin'
    OR primary_teacher_id IN (SELECT id FROM public.teachers WHERE uid = auth.uid()::text)
    OR uid = auth.uid()::text
  );

-- 3. Politiques sur documents (Élève ne consulte que les documents autorisés de sa classe/groupe)
CREATE POLICY "Accès strict aux documents pédagogiques" ON public.documents
  FOR SELECT USING (
    public.get_current_user_role() = 'super_admin'
    OR teacher_id IN (SELECT id FROM public.teachers WHERE uid = auth.uid()::text)
    OR class_id IN (
      SELECT e.class_id FROM public.enrollments e
      JOIN public.students s ON s.id = e.student_id
      WHERE s.uid = auth.uid()::text
    )
  );
