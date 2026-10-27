import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  FileText,
  MessageSquare,
  Video,
  Activity,
  Settings,
  ShieldAlert,
  Search,
  Bell,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit3,
  Trash2,
  KeyRound,
  Upload,
  Download,
  Eye,
  Send,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
  RefreshCw,
  LogOut,
  UserCheck,
  Lock,
  Sparkles,
  FolderOpen,
} from 'lucide-react';
import {
  BootstrapData,
  UserRole,
  TeacherRecord,
  StudentRecord,
  CourseRecord,
  DocumentRecord,
  LiveSessionRecord,
} from './types.ts';
import { JitsiRoomModal } from './components/JitsiRoomModal.tsx';
import { SqlAndDeployGuide } from './components/SqlAndDeployGuide.tsx';
import { AuthSwitchModal } from './components/AuthSwitchModal.tsx';

export default function App() {
  // Active Identity State
  const [identity, setIdentity] = useState<{
    uid: string;
    role: UserRole;
    name: string;
    email: string;
  }>({
    uid: 'admin-haroun',
    role: 'super_admin',
    name: 'Dr. Haroun Jaballi',
    email: 'harounjaballi@gmail.com',
  });

  // Navigation & Layout State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // Server Data State
  const [data, setData] = useState<BootstrapData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters & Pagination
  const [studentFilterGroup, setStudentFilterGroup] = useState<string>('ALL');
  const [studentFilterStatus, setStudentFilterStatus] = useState<string>('ALL');
  const [studentPage, setStudentPage] = useState<number>(1);
  const [docFilterType, setDocFilterType] = useState<string>('ALL');
  const [teacherFilterStatus, setTeacherFilterStatus] = useState<string>('ALL');

  // Modals State
  const [activeJitsiSession, setActiveJitsiSession] =
    useState<LiveSessionRecord | null>(null);
  const [viewingDocument, setViewingDocument] =
    useState<DocumentRecord | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    type: 'teacher' | 'student' | 'course' | 'document' | 'session';
    id: number;
    label: string;
  } | null>(null);

  // Teacher Modal Form
  const [showTeacherModal, setShowTeacherModal] = useState<boolean>(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherRecord | null>(
    null
  );
  const [teacherForm, setTeacherForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    specialty: 'Mathématiques & Algorithmique',
    department: 'Sciences Exactes',
    qualification: 'Agrégé / Certifié',
    officeHours: 'Lun-Jeu 15h00 - 17h30',
    status: 'active',
  });

  // Student Modal Form
  const [showStudentModal, setShowStudentModal] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(
    null
  );
  const [studentForm, setStudentForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    gradeLevel: 'Terminale',
    groupName: 'Groupe A',
    subjectFocus: 'Mathématiques Spécialité',
    primaryTeacherId: 1,
    parentEmail: '',
    pedagogicalNotes: '',
    status: 'active',
  });

  // CSV Import Modal
  const [showCsvModal, setShowCsvModal] = useState<boolean>(false);
  const [csvText, setCsvText] = useState<string>(
    'Inès Moreau;ines.moreau@eleve.eduspace.fr;Terminale;Groupe A;Mathématiques Spécialité\nThomas Girard;thomas.girard@eleve.eduspace.fr;Terminale;Groupe B;Mathématiques Expertes'
  );

  // Course Modal Form
  const [showCourseModal, setShowCourseModal] = useState<boolean>(false);
  const [editingCourse, setEditingCourse] = useState<CourseRecord | null>(null);
  const [courseForm, setCourseForm] = useState({
    title: '',
    chapter: 'Chapitre 1',
    description: '',
    content: '',
    videoUrl: '',
    externalLink: '',
    classId: 1,
    subjectId: 1,
  });

  // Document Modal Form
  const [showDocumentModal, setShowDocumentModal] = useState<boolean>(false);
  const [documentForm, setDocumentForm] = useState({
    title: '',
    description: '',
    fileType: 'PDF',
    fileUrl: '',
    fileSize: '2.4 Mo',
    chapter: 'Chapitre 1',
    classId: 1,
    subjectId: 1,
    allowDownload: true,
    allowedGroup: 'Tous',
  });

  // Live Session Modal Form
  const [showSessionModal, setShowSessionModal] = useState<boolean>(false);
  const [sessionForm, setSessionForm] = useState({
    title: '',
    description: '',
    subjectId: 1,
    classId: 1,
    scheduledDate: '2026-10-29',
    scheduledTime: '17:00',
    durationMinutes: 60,
    allowedGroup: 'Tous',
  });

  // Pedagogical Observation Modal
  const [observingStudent, setObservingStudent] =
    useState<StudentRecord | null>(null);
  const [obsForm, setObsForm] = useState({
    pedagogicalNotes: '',
    completionRate: 80,
    activityNote: '',
  });

  // Messaging State
  const [selectedConvId, setSelectedConvId] = useState<number | null>(null);
  const [newMessageText, setNewMessageText] = useState<string>('');
  const [showNewConvModal, setShowNewConvModal] = useState<boolean>(false);
  const [newConvForm, setNewConvForm] = useState({
    title: '',
    studentId: 1,
    isAnnouncement: false,
    content: '',
  });

  // Settings Form State
  const [settingsForm, setSettingsForm] = useState({
    platformName: 'EduSpace',
    institutionName: 'Lycée & Campus Supérieur Descartes',
    academicYear: '2026-2027',
    jitsiDomain: 'meet.jit.si',
    allowStudentDownloadsDefault: true,
    maintenanceMode: false,
    supportEmail: 'direction@eduspace-campus.fr',
  });

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const apiFetch = async (url: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer demo-session-token',
      'x-eduspace-uid': identity.uid,
      'x-eduspace-role': identity.role,
      'x-eduspace-name': identity.name,
      'x-eduspace-email': identity.email,
      ...((options.headers as Record<string, string>) || {}),
    };
    const res = await fetch(url, { ...options, headers });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'Une erreur est survenue.');
    }
    return json;
  };

  const loadBootstrap = async () => {
    setIsLoading(true);
    setErrorBanner(null);
    try {
      const result: BootstrapData = await apiFetch('/api/bootstrap');
      setData(result);
      if (result.settings) {
        setSettingsForm({
          platformName: result.settings.platformName,
          institutionName: result.settings.institutionName,
          academicYear: result.settings.academicYear,
          jitsiDomain: result.settings.jitsiDomain,
          allowStudentDownloadsDefault:
            result.settings.allowStudentDownloadsDefault,
          maintenanceMode: result.settings.maintenanceMode,
          supportEmail: result.settings.supportEmail,
        });
      }
      if (
        result.conversations.length > 0 &&
        (!selectedConvId ||
          !result.conversations.some((c) => c.id === selectedConvId))
      ) {
        setSelectedConvId(result.conversations[0].id);
      }
    } catch (err: any) {
      setErrorBanner(
        err.message || 'Impossible de contacter le serveur PostgreSQL.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBootstrap();
  }, [identity.uid, identity.role]);

  // Role-specific Navigation Items
  const navItems = useMemo(() => {
    if (identity.role === 'super_admin') {
      return [
        { id: 'dashboard', label: 'Vue d’ensemble', icon: LayoutDashboard },
        { id: 'teachers', label: 'Professeurs', icon: UserCheck },
        { id: 'students', label: 'Tous les Élèves', icon: GraduationCap },
        { id: 'courses', label: 'Cours & Documents', icon: BookOpen },
        { id: 'live', label: 'Visioconférences', icon: Video },
        { id: 'logs', label: 'Journaux & SQL RLS', icon: ShieldAlert },
        { id: 'settings', label: 'Paramètres', icon: Settings },
      ];
    }
    if (identity.role === 'teacher') {
      return [
        { id: 'dashboard', label: 'Mon Espace', icon: LayoutDashboard },
        { id: 'students', label: 'Mes Élèves', icon: GraduationCap },
        { id: 'courses', label: 'Cours & Documents', icon: BookOpen },
        { id: 'messages', label: 'Messagerie', icon: MessageSquare },
        { id: 'live', label: 'Visioconférence Jitsi', icon: Video },
        { id: 'pedagogy', label: 'Suivi Pédagogique', icon: Activity },
      ];
    }
    return [
      { id: 'dashboard', label: 'Mon Tableau de bord', icon: LayoutDashboard },
      { id: 'courses', label: 'Mes Cours', icon: BookOpen },
      { id: 'documents', label: 'Mes Documents', icon: FileText },
      { id: 'live', label: 'Séances en Direct', icon: Video },
      { id: 'messages', label: 'Messagerie', icon: MessageSquare },
      { id: 'pedagogy', label: 'Ma Progression & Profil', icon: Activity },
    ];
  }, [identity.role]);

  // Switch role helper in header
  const switchRoleQuick = (role: UserRole) => {
    if (role === 'super_admin') {
      setIdentity({
        uid: 'admin-haroun',
        role: 'super_admin',
        name: 'Dr. Haroun Jaballi',
        email: 'harounjaballi@gmail.com',
      });
    } else if (role === 'teacher') {
      setIdentity({
        uid: 'teacher-laurent',
        role: 'teacher',
        name: 'Marc Laurent',
        email: 'm.laurent@eduspace.fr',
      });
    } else {
      setIdentity({
        uid: 'student-claire',
        role: 'student',
        name: 'Claire Dubois',
        email: 'claire.dubois@eleve.eduspace.fr',
      });
    }
    setActiveTab('dashboard');
  };

  // Filtered Lists
  const filteredTeachers = useMemo(() => {
    if (!data) return [];
    return data.teachers.filter((t) => {
      const matchesSearch =
        !globalSearch ||
        t.fullName.toLowerCase().includes(globalSearch.toLowerCase()) ||
        t.specialty.toLowerCase().includes(globalSearch.toLowerCase()) ||
        t.email.toLowerCase().includes(globalSearch.toLowerCase());
      const matchesStatus =
        teacherFilterStatus === 'ALL' || t.status === teacherFilterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [data, globalSearch, teacherFilterStatus]);

  const filteredStudents = useMemo(() => {
    if (!data) return [];
    return data.students.filter((s) => {
      const matchesSearch =
        !globalSearch ||
        s.fullName.toLowerCase().includes(globalSearch.toLowerCase()) ||
        s.studentCode.toLowerCase().includes(globalSearch.toLowerCase()) ||
        s.email.toLowerCase().includes(globalSearch.toLowerCase()) ||
        s.subjectFocus.toLowerCase().includes(globalSearch.toLowerCase());
      const matchesGroup =
        studentFilterGroup === 'ALL' || s.groupName === studentFilterGroup;
      const matchesStatus =
        studentFilterStatus === 'ALL' || s.status === studentFilterStatus;
      return matchesSearch && matchesGroup && matchesStatus;
    });
  }, [data, globalSearch, studentFilterGroup, studentFilterStatus]);

  const paginatedStudents = useMemo(() => {
    const pageSize = 6;
    const start = (studentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, studentPage]);

  const filteredDocuments = useMemo(() => {
    if (!data) return [];
    return data.documents.filter((d) => {
      const matchesSearch =
        !globalSearch ||
        d.title.toLowerCase().includes(globalSearch.toLowerCase()) ||
        d.chapter.toLowerCase().includes(globalSearch.toLowerCase()) ||
        d.subjectName.toLowerCase().includes(globalSearch.toLowerCase());
      const matchesType =
        docFilterType === 'ALL' || d.fileType === docFilterType;
      return matchesSearch && matchesType;
    });
  }, [data, globalSearch, docFilterType]);

  // Handlers for CRUD operations
  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTeacher) {
        await apiFetch(`/api/teachers/${editingTeacher.id}`, {
          method: 'PUT',
          body: JSON.stringify(teacherForm),
        });
        triggerToast(`Compte professeur ${teacherForm.fullName} mis à jour.`);
      } else {
        await apiFetch('/api/teachers', {
          method: 'POST',
          body: JSON.stringify(teacherForm),
        });
        triggerToast(`Compte professeur ${teacherForm.fullName} créé.`);
      }
      setShowTeacherModal(false);
      setEditingTeacher(null);
      loadBootstrap();
    } catch (err: any) {
      setErrorBanner(err.message);
    }
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await apiFetch(`/api/students/${editingStudent.id}`, {
          method: 'PUT',
          body: JSON.stringify(studentForm),
        });
        triggerToast(`Dossier élève ${studentForm.fullName} modifié.`);
      } else {
        const res = await apiFetch('/api/students', {
          method: 'POST',
          body: JSON.stringify(studentForm),
        });
        triggerToast(
          `Élève créé — Code : ${res.studentCode} · PIN : ${res.accessPin}`
        );
      }
      setShowStudentModal(false);
      setEditingStudent(null);
      loadBootstrap();
    } catch (err: any) {
      setErrorBanner(err.message);
    }
  };

  const handleResetStudentAccess = async (student: StudentRecord) => {
    try {
      const res = await apiFetch(`/api/students/${student.id}/reset-access`, {
        method: 'POST',
      });
      triggerToast(
        `Nouveau PIN généré pour ${student.fullName} : ${res.accessPin}`
      );
      loadBootstrap();
    } catch (err: any) {
      setErrorBanner(err.message);
    }
  };

  const handleImportCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const lines = csvText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      const rows = lines.map((line) => {
        const parts = line.split(/[;,]/).map((p) => p.trim());
        return {
          fullName: parts[0] || '',
          email: parts[1] || '',
          gradeLevel: parts[2] || 'Terminale',
          groupName: parts[3] || 'Groupe A',
          subjectFocus: parts[4] || 'Mathématiques Spécialité',
        };
      });
      const res = await apiFetch('/api/students/import-csv', {
        method: 'POST',
        body: JSON.stringify({ rows }),
      });
      setShowCsvModal(false);
      triggerToast(`${res.imported} élève(s) importé(s) dans PostgreSQL.`);
      loadBootstrap();
    } catch (err: any) {
      setErrorBanner(err.message);
    }
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        await apiFetch(`/api/courses/${editingCourse.id}`, {
          method: 'PUT',
          body: JSON.stringify(courseForm),
        });
        triggerToast(`Cours « ${courseForm.title} » mis à jour.`);
      } else {
        await apiFetch('/api/courses', {
          method: 'POST',
          body: JSON.stringify(courseForm),
        });
        triggerToast(`Cours « ${courseForm.title} » publié.`);
      }
      setShowCourseModal(false);
      setEditingCourse(null);
      loadBootstrap();
    } catch (err: any) {
      setErrorBanner(err.message);
    }
  };

  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/documents', {
        method: 'POST',
        body: JSON.stringify(documentForm),
      });
      setShowDocumentModal(false);
      triggerToast(`Document « ${documentForm.title} » publié.`);
      loadBootstrap();
    } catch (err: any) {
      setErrorBanner(err.message);
    }
  };

  const handleInteractDocument = async (
    doc: DocumentRecord,
    actionType: 'view' | 'download'
  ) => {
    try {
      await apiFetch(`/api/documents/${doc.id}/interact`, {
        method: 'POST',
        body: JSON.stringify({ actionType }),
      });
      if (actionType === 'view') {
        setViewingDocument(doc);
      } else {
        // Trigger clean pedagogical file download
        const blob = new Blob(
          [
            `DOCUMENT PÉDAGOGIQUE OFFICIEL — ${
              data?.settings.platformName || 'EduSpace'
            }\n\nTitre : ${doc.title}\nChapitre : ${doc.chapter}\nMatière : ${
              doc.subjectName
            }\nClasse : ${doc.className}\nEnseignant : ${
              doc.teacherName
            }\nDate de publication : ${doc.publishedDate}\n\nDescription :\n${
              doc.description
            }\n\nURL Ressource : ${doc.fileUrl}`,
          ],
          { type: 'text/plain;charset=utf-8' }
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${doc.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        triggerToast(`Téléchargement de « ${doc.title} » enregistré.`);
      }
      loadBootstrap();
    } catch (err: any) {
      setErrorBanner(err.message);
    }
  };

  const handleCreateLiveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/live-sessions', {
        method: 'POST',
        body: JSON.stringify(sessionForm),
      });
      setShowSessionModal(false);
      triggerToast(`Séance Jitsi Meet « ${sessionForm.title} » programmée.`);
      loadBootstrap();
    } catch (err: any) {
      setErrorBanner(err.message);
    }
  };

  const handleJoinJitsiSession = async (session: LiveSessionRecord) => {
    try {
      await apiFetch(`/api/live-sessions/${session.id}/join`, {
        method: 'POST',
      });
      setActiveJitsiSession(session);
      loadBootstrap();
    } catch (err: any) {
      setErrorBanner(err.message);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !selectedConvId) return;
    try {
      await apiFetch('/api/messages', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: selectedConvId,
          content: newMessageText,
          isAnnouncement: false,
        }),
      });
      setNewMessageText('');
      loadBootstrap();
    } catch (err: any) {
      setErrorBanner(err.message);
    }
  };

  const handleCreateNewConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/messages', {
        method: 'POST',
        body: JSON.stringify({
          title: newConvForm.title,
          studentId: newConvForm.isAnnouncement
            ? null
            : Number(newConvForm.studentId),
          isAnnouncement: newConvForm.isAnnouncement,
          content: newConvForm.content,
        }),
      });
      setShowNewConvModal(false);
      setSelectedConvId(res.conversationId);
      triggerToast(
        newConvForm.isAnnouncement
          ? 'Annonce de classe envoyée et notifiée.'
          : 'Nouvelle conversation créée.'
      );
      loadBootstrap();
    } catch (err: any) {
      setErrorBanner(err.message);
    }
  };

  const handleSaveObservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!observingStudent) return;
    try {
      await apiFetch(`/api/students/${observingStudent.id}/observation`, {
        method: 'POST',
        body: JSON.stringify(obsForm),
      });
      setObservingStudent(null);
      triggerToast(
        `Observation pédagogique enregistrée pour ${observingStudent.fullName}.`
      );
      loadBootstrap();
    } catch (err: any) {
      setErrorBanner(err.message);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(settingsForm),
      });
      triggerToast(
        `Paramètres de la plateforme (${settingsForm.platformName}) enregistrés.`
      );
      loadBootstrap();
    } catch (err: any) {
      setErrorBanner(err.message);
    }
  };

  const executeConfirmedDelete = async () => {
    if (!confirmDelete) return;
    try {
      const endpointMap = {
        teacher: `/api/teachers/${confirmDelete.id}`,
        student: `/api/students/${confirmDelete.id}`,
        course: `/api/courses/${confirmDelete.id}`,
        document: `/api/documents/${confirmDelete.id}`,
        session: `/api/live-sessions/${confirmDelete.id}`,
      };
      await apiFetch(endpointMap[confirmDelete.type], { method: 'DELETE' });
      triggerToast(`Élément « ${confirmDelete.label} » supprimé.`);
      setConfirmDelete(null);
      loadBootstrap();
    } catch (err: any) {
      setErrorBanner(err.message);
    }
  };

  const unreadNotificationsCount = useMemo(() => {
    if (!data) return 0;
    return data.notifications.filter((n) => !n.isRead).length;
  }, [data]);

  const brandName = data?.settings?.platformName || 'EduSpace';

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Retractable Left Sidebar */}
      <aside
        className={`flex flex-col border-r border-slate-200 bg-white transition-all duration-150 shrink-0 ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 font-display text-sm font-bold text-white">
              {brandName.slice(0, 2).toUpperCase()}
            </div>
            {!isSidebarCollapsed && (
              <div className="min-w-0">
                <span className="block font-display text-base font-bold tracking-tight text-slate-900 truncate">
                  {brandName}
                </span>
                <span className="block text-[11px] text-slate-500 truncate">
                  {identity.role === 'super_admin'
                    ? 'Administration Centrale'
                    : identity.role === 'teacher'
                    ? 'Espace Enseignant'
                    : 'Portail Élève'}
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            title={
              isSidebarCollapsed
                ? 'Déplier la barre latérale'
                : 'Réduire la barre latérale'
            }
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!isSidebarCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Bottom Current Profile & Quick Role Switcher */}
        <div className="border-t border-slate-200 p-3">
          <button
            type="button"
            onClick={() => setShowAuthModal(true)}
            className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-left hover:bg-slate-100 transition-colors"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 font-display text-xs font-bold text-blue-700">
              {identity.name.slice(0, 2).toUpperCase()}
            </div>
            {!isSidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-900 truncate">
                  {identity.name}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  Changer de compte / Rôle
                </p>
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Bar Contract */}
        <header className="flex h-16 items-center justify-between gap-6 border-b border-slate-200 bg-white px-6">
          {/* Left: Contextual Breadcrumb & Search */}
          <div className="flex items-center gap-6 min-w-0 flex-1">
            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 whitespace-nowrap shrink-0">
              <span className="font-semibold text-slate-900">{brandName}</span>
              <span aria-hidden="true">/</span>
              <span>
                {identity.role === 'super_admin'
                  ? 'Espace Super Administrateur'
                  : identity.role === 'teacher'
                  ? 'Espace Professeur Privé'
                  : 'Espace Personnel Élève'}
              </span>
            </div>

            <div className="relative max-w-md flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Rechercher un élève, un cours, un document, un code..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>

          {/* Right: Segmented Role Switcher + Notifications + Auth Button */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Segmented Role Selector for testing the 3 distinct spaces */}
            <div className="hidden sm:flex items-center gap-1 rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => switchRoleQuick('super_admin')}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  identity.role === 'super_admin'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => switchRoleQuick('teacher')}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  identity.role === 'teacher'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Professeur
              </button>
              <button
                type="button"
                onClick={() => switchRoleQuick('student')}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  identity.role === 'student'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Élève
              </button>
            </div>

            {/* Notifications Dropdown Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications((prev) => !prev)}
                className="relative rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                title="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 font-mono text-[10px] font-bold text-white">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {showNotifications && data && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-lg z-40">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <span className="font-display text-xs font-semibold text-slate-900">
                      Notifications ({data.notifications.length})
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        await apiFetch('/api/notifications/read-all', {
                          method: 'PUT',
                        });
                        loadBootstrap();
                      }}
                      className="text-xs font-medium text-blue-600 hover:underline"
                    >
                      Tout marquer lu
                    </button>
                  </div>
                  <div className="mt-2 max-h-64 overflow-y-auto divide-y divide-slate-100">
                    {data.notifications.length > 0 ? (
                      data.notifications.map((n) => (
                        <div key={n.id} className="py-2.5">
                          <p className="text-xs font-semibold text-slate-900">
                            {n.title}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-600">
                            {n.message}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="py-6 text-center text-xs text-slate-500">
                        Aucune notification.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              Connexion / Profil
            </button>
          </div>
        </header>

        {/* Feedback Banners */}
        {toastMessage && (
          <div className="border-b border-emerald-200 bg-emerald-50 px-6 py-2.5 text-xs font-medium text-emerald-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-emerald-700 hover:underline"
            >
              Fermer
            </button>
          </div>
        )}

        {errorBanner && (
          <div className="border-b border-red-200 bg-red-50 px-6 py-2.5 text-xs font-medium text-red-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
              <span>{errorBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorBanner(null)}
              className="text-red-700 hover:underline"
            >
              Fermer
            </button>
          </div>
        )}

        {/* Main Viewport Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {isLoading || !data ? (
            <div className="space-y-4">
              <div className="h-24 rounded-xl border border-slate-200 bg-white p-6 animate-pulse" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="h-28 rounded-xl border border-slate-200 bg-white p-5 animate-pulse"
                  />
                ))}
              </div>
              <div className="h-80 rounded-xl border border-slate-200 bg-white p-6 animate-pulse" />
            </div>
          ) : (
            <>
              {/* =========================================================
                  TAB 1 : DASHBOARD (ADAPTED TO EACH ROLE)
                 ========================================================= */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Role Header Banner */}
                  <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-blue-700 font-medium">
                        <span>{data.settings.institutionName}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          Année {data.settings.academicYear}
                        </span>
                      </div>
                      <h1 className="mt-1 font-display text-2xl font-bold text-slate-900">
                        {identity.role === 'super_admin' &&
                          `Supervision Générale — ${brandName}`}
                        {identity.role === 'teacher' &&
                          `Bonjour, ${
                            data.currentTeacher?.fullName || identity.name
                          }`}
                        {identity.role === 'student' &&
                          `Tableau de bord de ${
                            data.currentStudent?.fullName || identity.name
                          }`}
                      </h1>
                      <p className="mt-1 text-sm text-slate-600">
                        {identity.role === 'super_admin' &&
                          'Gérez les comptes professeurs, supervisez l’ensemble des élèves, les classes, les séances Jitsi Meet et les règles de sécurité.'}
                        {identity.role === 'teacher' &&
                          `Spécialité : ${
                            data.currentTeacher?.specialty ||
                            'Mathématiques & Sciences'
                          } · Permanence : ${
                            data.currentTeacher?.officeHours ||
                            'Lun-Ven 14h-17h'
                          }`}
                        {identity.role === 'student' &&
                          `Code Élève : ${
                            data.currentStudent?.studentCode || 'ELV-2026-001'
                          } · Niveau : ${
                            data.currentStudent?.gradeLevel || 'Terminale'
                          } (${data.currentStudent?.groupName || 'Groupe A'}) · Professeur référent : ${
                            data.currentStudent?.teacherName || 'Marc Laurent'
                          }`}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                      {identity.role === 'super_admin' && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTeacher(null);
                            setShowTeacherModal(true);
                          }}
                          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Ajouter un professeur</span>
                        </button>
                      )}
                      {identity.role !== 'student' && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingStudent(null);
                            setShowStudentModal(true);
                          }}
                          className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
                        >
                          <Plus className="h-4 w-4 text-blue-600" />
                          <span>Inscrire un élève</span>
                        </button>
                      )}
                      {identity.role === 'student' &&
                        data.liveSessions.length > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              handleJoinJitsiSession(data.liveSessions[0])
                            }
                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
                          >
                            <Video className="h-4 w-4" />
                            <span>Rejoindre la visioconférence en direct</span>
                          </button>
                        )}
                    </div>
                  </div>

                  {/* 4 KPI Stat Cards */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-slate-200 bg-white p-5">
                      <span className="text-xs font-medium text-slate-500">
                        {identity.role === 'super_admin'
                          ? 'Professeurs Enregistrés'
                          : identity.role === 'teacher'
                          ? 'Mes Élèves Rattachés'
                          : 'Progression Globale'}
                      </span>
                      <div className="mt-2 flex items-baseline justify-between">
                        <span className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                          {identity.role === 'super_admin'
                            ? data.teachers.length
                            : identity.role === 'teacher'
                            ? data.students.length
                            : `${data.currentStudent?.completionRate || 92}%`}
                        </span>
                        <span className="text-xs text-slate-500">
                          {identity.role === 'super_admin'
                            ? `${
                                data.teachers.filter(
                                  (t) => t.status === 'active'
                                ).length
                              } actifs`
                            : identity.role === 'teacher'
                            ? `${
                                data.students.filter(
                                  (s) => s.status === 'active'
                                ).length
                              } actifs`
                            : 'Suivi validé'}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-5">
                      <span className="text-xs font-medium text-slate-500">
                        {identity.role === 'super_admin'
                          ? 'Élèves Inscrits'
                          : 'Cours Publiés'}
                      </span>
                      <div className="mt-2 flex items-baseline justify-between">
                        <span className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                          {identity.role === 'super_admin'
                            ? data.students.length
                            : data.courses.length}
                        </span>
                        <span className="text-xs text-slate-500">
                          {identity.role === 'super_admin'
                            ? `${data.classes.length} classes`
                            : `${data.subjects.length} matières`}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-5">
                      <span className="text-xs font-medium text-slate-500">
                        Documents & Ressources
                      </span>
                      <div className="mt-2 flex items-baseline justify-between">
                        <span className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                          {data.documents.length}
                        </span>
                        <span className="font-mono text-xs text-slate-500 tabular-nums">
                          {data.documents.reduce(
                            (acc, d) => acc + d.viewsCount,
                            0
                          )}{' '}
                          consultations
                        </span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-5">
                      <span className="text-xs font-medium text-slate-500">
                        Séances Visioconférence Jitsi
                      </span>
                      <div className="mt-2 flex items-baseline justify-between">
                        <span className="font-mono text-2xl font-bold text-blue-600 tabular-nums">
                          {data.liveSessions.length}
                        </span>
                        <span className="text-xs text-slate-500">
                          {
                            data.liveSessions.filter(
                              (s) => s.status === 'live'
                            ).length
                          }{' '}
                          en direct
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Two-Column Overview Split */}
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-stretch">
                    {/* Left 7 cols: Upcoming Live Sessions & Recent Courses */}
                    <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                          <div>
                            <h2 className="font-display text-base font-semibold text-slate-900">
                              Séances de Visioconférence Jitsi Meet
                            </h2>
                            <p className="text-xs text-slate-500">
                              Accès direct à la salle virtuelle intégrée et émargement automatique
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveTab('live')}
                            className="text-xs font-semibold text-blue-600 hover:underline whitespace-nowrap shrink-0"
                          >
                            Voir toutes les séances
                          </button>
                        </div>

                        <div className="mt-4 divide-y divide-slate-100">
                          {data.liveSessions.slice(0, 3).map((session) => (
                            <div
                              key={session.id}
                              className="py-3.5 first:pt-0 last:pb-0 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                  <span className="font-semibold text-blue-700">
                                    {session.status === 'live'
                                      ? 'En direct actuellement'
                                      : session.status === 'scheduled'
                                      ? 'Programmée'
                                      : 'Terminée'}
                                  </span>
                                  <span aria-hidden="true">·</span>
                                  <span>{session.subjectName}</span>
                                  <span aria-hidden="true">·</span>
                                  <span className="font-mono tabular-nums">
                                    {session.scheduledDate} à{' '}
                                    {session.scheduledTime}
                                  </span>
                                </div>
                                <h3 className="mt-1 font-display text-sm font-semibold text-slate-900 truncate">
                                  {session.title}
                                </h3>
                                <p className="mt-0.5 text-xs text-slate-500">
                                  Classe : {session.className} · Enseignant :{' '}
                                  {session.teacherName} · Groupe :{' '}
                                  {session.allowedGroup}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleJoinJitsiSession(session)}
                                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
                              >
                                <Video className="h-3.5 w-3.5" />
                                <span>Rejoindre sur Jitsi</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>
                          Serveur Jitsi configuré :{' '}
                          <strong className="font-mono text-slate-700">
                            {data.settings.jitsiDomain}
                          </strong>
                        </span>
                        {identity.role !== 'student' && (
                          <button
                            type="button"
                            onClick={() => setShowSessionModal(true)}
                            className="font-semibold text-blue-600 hover:underline"
                          >
                            + Programmer une séance
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Right 5 cols: Role-specific Activity / Stats by Teacher or Student Progress */}
                    <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                          <div>
                            <h2 className="font-display text-base font-semibold text-slate-900">
                              {identity.role === 'super_admin'
                                ? 'Statistiques par Professeur & Classe'
                                : 'Activités Pédagogiques Récentes'}
                            </h2>
                            <p className="text-xs text-slate-500">
                              {identity.role === 'super_admin'
                                ? 'Répartition des effectifs et des ressources publiées'
                                : 'Suivi des consultations, téléchargements et présences'}
                            </p>
                          </div>
                        </div>

                        {identity.role === 'super_admin' ? (
                          <div className="mt-4 divide-y divide-slate-100">
                            {data.teachers.map((t) => (
                              <div
                                key={t.id}
                                className="py-3 first:pt-0 last:pb-0 flex items-center justify-between"
                              >
                                <div>
                                  <p className="text-xs font-semibold text-slate-900">
                                    {t.fullName}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {t.specialty} · {t.department}
                                  </p>
                                </div>
                                <div className="text-right font-mono text-xs text-slate-700 tabular-nums">
                                  <div>{t.studentCount} élèves</div>
                                  <div className="text-slate-400">
                                    {t.courseCount} cours
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="mt-4 divide-y divide-slate-100">
                            {data.studentActivities.slice(0, 5).map((act) => (
                              <div
                                key={act.id}
                                className="py-2.5 first:pt-0 last:pb-0"
                              >
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-semibold text-slate-900">
                                    {act.studentName}
                                  </span>
                                  <span className="font-mono text-emerald-700 tabular-nums">
                                    +{act.progressDelta}%
                                  </span>
                                </div>
                                <p className="mt-0.5 text-xs text-slate-700">
                                  {act.resourceTitle}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  {act.details}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>Base PostgreSQL synchronisée</span>
                        <button
                          type="button"
                          onClick={loadBootstrap}
                          className="flex items-center gap-1 font-medium text-blue-600 hover:underline"
                        >
                          <RefreshCw className="h-3 w-3" />
                          <span>Actualiser</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================================
                  TAB 2 : SUPER ADMIN — GESTION DES PROFESSEURS
                 ========================================================= */}
              {activeTab === 'teachers' && identity.role === 'super_admin' && (
                <div className="space-y-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="font-display text-xl font-bold text-slate-900">
                        Gestion des Comptes Professeurs
                      </h2>
                      <p className="text-sm text-slate-600">
                        Ajoutez, modifiez, suspendez ou supprimez les comptes enseignants de la plateforme.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 rounded-lg bg-slate-200/70 p-1">
                        {(['ALL', 'active', 'suspended'] as const).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setTeacherFilterStatus(st)}
                            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                              teacherFilterStatus === st
                                ? 'bg-white text-slate-900 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {st === 'ALL'
                              ? 'Tous'
                              : st === 'active'
                              ? 'Actifs'
                              : 'Suspendus'}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTeacher(null);
                          setTeacherForm({
                            fullName: '',
                            email: '',
                            phone: '',
                            specialty: 'Mathématiques & Algorithmique',
                            department: 'Sciences Exactes',
                            qualification: 'Agrégé / Certifié',
                            officeHours: 'Lun-Jeu 15h00 - 17h30',
                            status: 'active',
                          });
                          setShowTeacherModal(true);
                        }}
                        className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Nouveau Professeur</span>
                      </button>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500">
                            <th className="py-3 px-4">Professeur</th>
                            <th className="py-3 px-4">Spécialité & Département</th>
                            <th className="py-3 px-4">Permanence</th>
                            <th className="py-3 px-4 text-right">Effectif</th>
                            <th className="py-3 px-4">Statut</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-xs">
                          {filteredTeachers.map((t) => (
                            <tr
                              key={t.id}
                              className="hover:bg-slate-50/80 transition-colors"
                            >
                              <td className="py-3.5 px-4">
                                <div className="font-semibold text-slate-900">
                                  {t.fullName}
                                </div>
                                <div className="text-slate-500">{t.email}</div>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="font-medium text-slate-800">
                                  {t.specialty}
                                </div>
                                <div className="text-slate-500">
                                  {t.department} · {t.qualification}
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-slate-600">
                                {t.officeHours}
                              </td>
                              <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-700">
                                {t.studentCount} élèves · {t.courseCount} cours
                              </td>
                              <td className="py-3.5 px-4">
                                {t.status === 'active' ? (
                                  <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    <span>Actif</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 font-medium text-amber-700">
                                    <XCircle className="h-3.5 w-3.5" />
                                    <span>Suspendu</span>
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <div className="inline-flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingTeacher(t);
                                      setTeacherForm({
                                        fullName: t.fullName,
                                        email: t.email,
                                        phone: t.phone,
                                        specialty: t.specialty,
                                        department: t.department,
                                        qualification: t.qualification,
                                        officeHours: t.officeHours,
                                        status: t.status,
                                      });
                                      setShowTeacherModal(true);
                                    }}
                                    className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                                  >
                                    Modifier
                                  </button>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const nextStatus =
                                        t.status === 'active'
                                          ? 'suspended'
                                          : 'active';
                                      await apiFetch(`/api/teachers/${t.id}`, {
                                        method: 'PUT',
                                        body: JSON.stringify({
                                          ...t,
                                          status: nextStatus,
                                        }),
                                      });
                                      triggerToast(
                                        `Compte de ${t.fullName} ${
                                          nextStatus === 'active'
                                            ? 'réactivé'
                                            : 'suspendu'
                                        }.`
                                      );
                                      loadBootstrap();
                                    }}
                                    className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                                  >
                                    {t.status === 'active'
                                      ? 'Suspendre'
                                      : 'Réactiver'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setConfirmDelete({
                                        type: 'teacher',
                                        id: t.id,
                                        label: t.fullName,
                                      })
                                    }
                                    className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                                  >
                                    Supprimer
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================================
                  TAB 3 : GESTION DES ÉLÈVES (SUPER ADMIN & PROFESSEUR)
                 ========================================================= */}
              {activeTab === 'students' && identity.role !== 'student' && (
                <div className="space-y-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h2 className="font-display text-xl font-bold text-slate-900">
                        {identity.role === 'super_admin'
                          ? 'Annuaire Global des Élèves'
                          : 'Gestion de Mes Élèves'}
                      </h2>
                      <p className="text-sm text-slate-600">
                        Attribution sécurisée d’identifiants (Code Élève + PIN), organisation par classe/groupe, import CSV et réinitialisation d’accès.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Group filter */}
                      <div className="flex items-center gap-1 rounded-lg bg-slate-200/70 p-1">
                        {(['ALL', 'Groupe A', 'Groupe B'] as const).map(
                          (grp) => (
                            <button
                              key={grp}
                              type="button"
                              onClick={() => {
                                setStudentFilterGroup(grp);
                                setStudentPage(1);
                              }}
                              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                                studentFilterGroup === grp
                                  ? 'bg-white text-slate-900 shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              {grp === 'ALL' ? 'Tous les groupes' : grp}
                            </button>
                          )
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowCsvModal(true)}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
                      >
                        <Upload className="h-3.5 w-3.5 text-blue-600" />
                        <span>Importer CSV / Excel</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingStudent(null);
                          setStudentForm({
                            fullName: '',
                            email: '',
                            phone: '',
                            gradeLevel: 'Terminale',
                            groupName: 'Groupe A',
                            subjectFocus: 'Mathématiques Spécialité',
                            primaryTeacherId:
                              data.currentTeacher?.id ||
                              data.teachers[0]?.id ||
                              1,
                            parentEmail: '',
                            pedagogicalNotes: '',
                            status: 'active',
                          });
                          setShowStudentModal(true);
                        }}
                        className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Ajouter un élève</span>
                      </button>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500">
                            <th className="py-3 px-4">Élève & Contact</th>
                            <th className="py-3 px-4">
                              Identifiants de Connexion
                            </th>
                            <th className="py-3 px-4">
                              Niveau · Groupe · Matière
                            </th>
                            <th className="py-3 px-4 text-right">
                              Progression
                            </th>
                            <th className="py-3 px-4">Statut</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-xs">
                          {paginatedStudents.length > 0 ? (
                            paginatedStudents.map((s) => (
                              <tr
                                key={s.id}
                                className="hover:bg-slate-50/80 transition-colors"
                              >
                                <td className="py-3.5 px-4">
                                  <div className="font-semibold text-slate-900">
                                    {s.fullName}
                                  </div>
                                  <div className="text-slate-500">
                                    {s.email} · Prof. {s.teacherName}
                                  </div>
                                </td>
                                <td className="py-3.5 px-4 font-mono tabular-nums">
                                  <div className="font-semibold text-slate-900">
                                    {s.studentCode}
                                  </div>
                                  <div className="text-slate-500">
                                    PIN : {s.accessPin}
                                  </div>
                                </td>
                                <td className="py-3.5 px-4">
                                  <div className="font-medium text-slate-800">
                                    {s.gradeLevel} · {s.groupName}
                                  </div>
                                  <div className="text-slate-500">
                                    {s.subjectFocus}
                                  </div>
                                </td>
                                <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                                  <span className="font-semibold text-slate-900">
                                    {s.completionRate}%
                                  </span>
                                </td>
                                <td className="py-3.5 px-4">
                                  {s.status === 'active' ? (
                                    <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                      <span>Actif</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 font-medium text-amber-700">
                                      <XCircle className="h-3.5 w-3.5" />
                                      <span>Suspendu</span>
                                    </span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  <div className="inline-flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleResetStudentAccess(s)
                                      }
                                      title="Réinitialiser le code PIN d’accès"
                                      className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 whitespace-nowrap shrink-0"
                                    >
                                      Réinitialiser PIN
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingStudent(s);
                                        setStudentForm({
                                          fullName: s.fullName,
                                          email: s.email,
                                          phone: s.phone,
                                          gradeLevel: s.gradeLevel,
                                          groupName: s.groupName,
                                          subjectFocus: s.subjectFocus,
                                          primaryTeacherId:
                                            s.primaryTeacherId || 1,
                                          parentEmail: s.parentEmail,
                                          pedagogicalNotes: s.pedagogicalNotes,
                                          status: s.status,
                                        });
                                        setShowStudentModal(true);
                                      }}
                                      className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                                    >
                                      Modifier
                                    </button>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        const nextStatus =
                                          s.status === 'active'
                                            ? 'suspended'
                                            : 'active';
                                        await apiFetch(
                                          `/api/students/${s.id}`,
                                          {
                                            method: 'PUT',
                                            body: JSON.stringify({
                                              ...s,
                                              status: nextStatus,
                                            }),
                                          }
                                        );
                                        triggerToast(
                                          `Accès de ${s.fullName} ${
                                            nextStatus === 'active'
                                              ? 'réactivé'
                                              : 'suspendu'
                                          }.`
                                        );
                                        loadBootstrap();
                                      }}
                                      className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                                    >
                                      {s.status === 'active'
                                        ? 'Suspendre'
                                        : 'Réactiver'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setConfirmDelete({
                                          type: 'student',
                                          id: s.id,
                                          label: s.fullName,
                                        })
                                      }
                                      className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                                    >
                                      Supprimer
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan={6}
                                className="py-8 text-center text-xs text-slate-500"
                              >
                                Aucun élève ne correspond aux critères sélectionnés.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Bar */}
                    <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-600">
                      <span className="font-mono tabular-nums">
                        Total : {filteredStudents.length} élève(s)
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={studentPage <= 1}
                          onClick={() =>
                            setStudentPage((p) => Math.max(1, p - 1))
                          }
                          className="rounded border border-slate-300 bg-white px-2.5 py-1 disabled:opacity-40"
                        >
                          Précédent
                        </button>
                        <span className="font-mono tabular-nums">
                          Page {studentPage}
                        </span>
                        <button
                          type="button"
                          disabled={studentPage * 6 >= filteredStudents.length}
                          onClick={() => setStudentPage((p) => p + 1)}
                          className="rounded border border-slate-300 bg-white px-2.5 py-1 disabled:opacity-40"
                        >
                          Suivant
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================================
                  TAB 4 : COURS & DOCUMENTS (TOUS LES RÔLES)
                 ========================================================= */}
              {(activeTab === 'courses' || activeTab === 'documents') && (
                <div className="space-y-8">
                  {/* Section A: Courses */}
                  {activeTab === 'courses' && (
                    <div className="space-y-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h2 className="font-display text-xl font-bold text-slate-900">
                            {identity.role === 'student'
                              ? 'Mes Cours & Modules Pédagogiques'
                              : 'Gestion des Cours & Chapitres'}
                          </h2>
                          <p className="text-sm text-slate-600">
                            Organisation structurée par matière, classe, chapitre et ressources multimédias.
                          </p>
                        </div>
                        {identity.role !== 'student' && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCourse(null);
                                setCourseForm({
                                  title: '',
                                  chapter: 'Chapitre 1',
                                  description: '',
                                  content: '',
                                  videoUrl: '',
                                  externalLink: '',
                                  classId: data.classes[0]?.id || 1,
                                  subjectId: data.subjects[0]?.id || 1,
                                });
                                setShowCourseModal(true);
                              }}
                              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
                            >
                              <Plus className="h-4 w-4" />
                              <span>Créer un cours</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowDocumentModal(true)}
                              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
                            >
                              <Plus className="h-4 w-4 text-blue-600" />
                              <span>Publier un document</span>
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {data.courses.map((course) => (
                          <div
                            key={course.id}
                            className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6"
                          >
                            <div>
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span className="font-semibold text-blue-700">
                                  {course.subjectName}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span>{course.chapter}</span>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono tabular-nums">
                                  {course.publishedDate}
                                </span>
                              </div>
                              <h3 className="mt-1.5 font-display text-base font-bold text-slate-900">
                                {course.title}
                              </h3>
                              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                                {course.description}
                              </p>
                              {course.content && (
                                <p className="mt-2 text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                  {course.content}
                                </p>
                              )}
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                              <span className="text-slate-500">
                                Classe : {course.classCode} · Prof.{' '}
                                {course.teacherName}
                              </span>
                              <div className="flex items-center gap-2">
                                {course.externalLink && (
                                  <a
                                    href={course.externalLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 font-medium text-blue-600 hover:underline"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    <span>Ressource externe</span>
                                  </a>
                                )}
                                {identity.role !== 'student' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingCourse(course);
                                        setCourseForm({
                                          title: course.title,
                                          chapter: course.chapter,
                                          description: course.description,
                                          content: course.content,
                                          videoUrl: course.videoUrl,
                                          externalLink: course.externalLink,
                                          classId: course.classId,
                                          subjectId: course.subjectId,
                                        });
                                        setShowCourseModal(true);
                                      }}
                                      className="rounded border border-slate-200 px-2.5 py-1 text-slate-700 hover:bg-slate-100"
                                    >
                                      Modifier
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setConfirmDelete({
                                          type: 'course',
                                          id: course.id,
                                          label: course.title,
                                        })
                                      }
                                      className="rounded border border-red-200 px-2.5 py-1 text-red-600 hover:bg-red-50"
                                    >
                                      Supprimer
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section B: Documents & Resources */}
                  <div className="space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="font-display text-lg font-bold text-slate-900">
                          Bibliothèque de Documents & Supports Pédagogiques
                        </h2>
                        <p className="text-xs text-slate-500">
                          Contrôle granulaire des droits : téléchargement autorisé ou consultation seule par groupe d’élèves.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 rounded-lg bg-slate-200/70 p-1">
                          {(['ALL', 'PDF', 'WORD', 'PPT'] as const).map(
                            (tp) => (
                              <button
                                key={tp}
                                type="button"
                                onClick={() => setDocFilterType(tp)}
                                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                                  docFilterType === tp
                                    ? 'bg-white text-slate-900 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                {tp === 'ALL' ? 'Tous formats' : tp}
                              </button>
                            )
                          )}
                        </div>
                        {identity.role !== 'student' && (
                          <button
                            type="button"
                            onClick={() => setShowDocumentModal(true)}
                            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Ajouter un document</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500">
                              <th className="py-3 px-4">Document & Chapitre</th>
                              <th className="py-3 px-4">Matière & Classe</th>
                              <th className="py-3 px-4">Format & Taille</th>
                              <th className="py-3 px-4">
                                Autorisations d’accès
                              </th>
                              <th className="py-3 px-4 text-right">Vues</th>
                              <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 text-xs">
                            {filteredDocuments.map((doc) => (
                              <tr
                                key={doc.id}
                                className="hover:bg-slate-50/80 transition-colors"
                              >
                                <td className="py-3.5 px-4">
                                  <div className="font-semibold text-slate-900">
                                    {doc.title}
                                  </div>
                                  <div className="text-slate-500">
                                    {doc.chapter} · Publié le{' '}
                                    <span className="font-mono tabular-nums">
                                      {doc.publishedDate}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4">
                                  <div className="font-medium text-slate-800">
                                    {doc.subjectName}
                                  </div>
                                  <div className="text-slate-500">
                                    {doc.className}
                                  </div>
                                </td>
                                <td className="py-3.5 px-4 font-mono tabular-nums text-slate-700">
                                  {doc.fileType} · {doc.fileSize}
                                </td>
                                <td className="py-3.5 px-4">
                                  <div className="font-medium text-slate-800">
                                    Cible : {doc.allowedGroup}
                                  </div>
                                  <div className="text-slate-500">
                                    {doc.allowDownload
                                      ? 'Téléchargement autorisé'
                                      : 'Consultation seule (Protégé)'}
                                  </div>
                                </td>
                                <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-700">
                                  {doc.viewsCount}
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  <div className="inline-flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleInteractDocument(doc, 'view')
                                      }
                                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                                    >
                                      <Eye className="h-3.5 w-3.5 text-blue-600" />
                                      <span>Consulter</span>
                                    </button>

                                    {doc.allowDownload ? (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleInteractDocument(
                                            doc,
                                            'download'
                                          )
                                        }
                                        className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700"
                                      >
                                        <Download className="h-3.5 w-3.5" />
                                        <span>Télécharger</span>
                                      </button>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs text-slate-400">
                                        <Lock className="h-3.5 w-3.5" />
                                        <span>Lecture seule</span>
                                      </span>
                                    )}

                                    {identity.role !== 'student' && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setConfirmDelete({
                                            type: 'document',
                                            id: doc.id,
                                            label: doc.title,
                                          })
                                        }
                                        className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                                      >
                                        Supprimer
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================================
                  TAB 5 : VISIOCONFÉRENCES JITSI MEET
                 ========================================================= */}
              {activeTab === 'live' && (
                <div className="space-y-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="font-display text-xl font-bold text-slate-900">
                        Séances de Visioconférence en Direct (Jitsi Meet)
                      </h2>
                      <p className="text-sm text-slate-600">
                        Rejoignez les salles de cours interactives intégrées avec suivi automatique des présences.
                      </p>
                    </div>
                    {identity.role !== 'student' && (
                      <button
                        type="button"
                        onClick={() => setShowSessionModal(true)}
                        className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Créer une séance en direct</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {data.liveSessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6"
                      >
                        <div>
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>
                              {session.subjectName} · {session.classCode}
                            </span>
                            <span className="font-mono tabular-nums">
                              {session.scheduledDate} à {session.scheduledTime}{' '}
                              ({session.durationMinutes} min)
                            </span>
                          </div>
                          <h3 className="mt-2 font-display text-base font-bold text-slate-900">
                            {session.title}
                          </h3>
                          <p className="mt-1 text-xs text-slate-600">
                            {session.description}
                          </p>
                          <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 font-mono">
                            Salle Jitsi : {session.roomName} · Participants
                            émargés : {session.participants?.length || 0}
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                          <span className="text-xs text-slate-500">
                            Prof. {session.teacherName} · Accès :{' '}
                            {session.allowedGroup}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleJoinJitsiSession(session)}
                              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
                            >
                              <Video className="h-3.5 w-3.5" />
                              <span>Ouvrir la Visioconférence</span>
                            </button>
                            {identity.role !== 'student' && (
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirmDelete({
                                    type: 'session',
                                    id: session.id,
                                    label: session.title,
                                  })
                                }
                                className="rounded-lg border border-red-200 px-2.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                              >
                                Supprimer
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* =========================================================
                  TAB 6 : MESSAGERIE & ANNONCES
                 ========================================================= */}
              {activeTab === 'messages' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-display text-xl font-bold text-slate-900">
                        Messagerie Pédagogique & Annonces de Classe
                      </h2>
                      <p className="text-sm text-slate-600">
                        Échanges privés sécurisés entre professeurs et élèves et diffusion d’annonces.
                      </p>
                    </div>
                    {identity.role !== 'student' && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewConvForm({
                            title: '',
                            studentId: data.students[0]?.id || 1,
                            isAnnouncement: false,
                            content: '',
                          });
                          setShowNewConvModal(true);
                        }}
                        className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Nouveau message / Annonce</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 overflow-hidden rounded-xl border border-slate-200 bg-white lg:grid-cols-12 h-[540px]">
                    {/* Left 4 cols: Conversations list */}
                    <div className="lg:col-span-4 border-r border-slate-200 flex flex-col overflow-y-auto divide-y divide-slate-100">
                      {data.conversations.map((conv) => {
                        const isSelected = conv.id === selectedConvId;
                        return (
                          <button
                            key={conv.id}
                            type="button"
                            onClick={() => setSelectedConvId(conv.id)}
                            className={`w-full p-4 text-left transition-colors ${
                              isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-slate-900 truncate">
                                {conv.title}
                              </span>
                              <span className="text-[11px] text-blue-700 font-medium shrink-0">
                                {conv.type === 'announcement'
                                  ? 'Annonce'
                                  : 'Privé'}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                              {conv.lastMessagePreview}
                            </p>
                          </button>
                        );
                      })}
                    </div>

                    {/* Right 8 cols: Active Thread */}
                    <div className="lg:col-span-8 flex flex-col justify-between bg-slate-50/40">
                      <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {data.messages
                          .filter((m) => m.conversationId === selectedConvId)
                          .map((msg) => {
                            const isMine = msg.senderRole === identity.role;
                            return (
                              <div
                                key={msg.id}
                                className={`flex flex-col ${
                                  isMine ? 'items-end' : 'items-start'
                                }`}
                              >
                                <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-1">
                                  <span className="font-semibold text-slate-700">
                                    {msg.senderName}
                                  </span>
                                  <span aria-hidden="true">·</span>
                                  <span>
                                    {msg.senderRole === 'teacher'
                                      ? 'Professeur'
                                      : 'Élève'}
                                  </span>
                                </div>
                                <div
                                  className={`max-w-lg rounded-xl px-4 py-2.5 text-xs leading-relaxed ${
                                    isMine
                                      ? 'bg-blue-600 text-white'
                                      : 'border border-slate-200 bg-white text-slate-800'
                                  }`}
                                >
                                  {msg.content}
                                </div>
                              </div>
                            );
                          })}
                      </div>

                      <form
                        onSubmit={handleSendMessage}
                        className="border-t border-slate-200 bg-white p-4 flex items-center gap-3"
                      >
                        <input
                          type="text"
                          value={newMessageText}
                          onChange={(e) => setNewMessageText(e.target.value)}
                          placeholder="Écrire une réponse dans cette conversation..."
                          className="flex-1 rounded-lg border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-hidden"
                        />
                        <button
                          type="submit"
                          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
                        >
                          <Send className="h-3.5 w-3.5" />
                          <span>Envoyer</span>
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================================
                  TAB 7 : SUIVI PÉDAGOGIQUE (PROFESSEUR & ÉLÈVE)
                 ========================================================= */}
              {activeTab === 'pedagogy' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-display text-xl font-bold text-slate-900">
                      {identity.role === 'student'
                        ? 'Mon Suivi Pédagogique & Historique d’Activité'
                        : 'Suivi Pédagogique Individuel & Repérage des Élèves Inactifs'}
                    </h2>
                    <p className="text-sm text-slate-600">
                      Suivi des connexions, documents consultés, participation aux séances en direct et observations pédagogiques.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {data.students.map((st) => (
                      <div
                        key={st.id}
                        className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-display text-base font-bold text-slate-900">
                                {st.fullName}
                              </h3>
                              <p className="text-xs text-slate-500 font-mono tabular-nums">
                                {st.studentCode} · {st.gradeLevel} (
                                {st.groupName})
                              </p>
                            </div>
                            <div className="text-right font-mono tabular-nums">
                              <span className="text-lg font-bold text-blue-600">
                                {st.completionRate}%
                              </span>
                              <span className="block text-[11px] text-slate-500">
                                Progression
                              </span>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full bg-blue-600 transition-all"
                              style={{ width: `${st.completionRate}%` }}
                            />
                          </div>

                          <div className="mt-4 rounded-lg bg-slate-50 p-3.5 border border-slate-100">
                            <span className="text-[11px] font-semibold text-slate-700">
                              Observations pédagogiques du professeur :
                            </span>
                            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                              {st.pedagogicalNotes ||
                                'Aucune observation particulière enregistrée.'}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-slate-500">
                            Statut :{' '}
                            {st.status === 'active'
                              ? 'Actif et régulier'
                              : 'Inactif / Suspendu'}
                          </span>
                          {identity.role !== 'student' && (
                            <button
                              type="button"
                              onClick={() => {
                                setObservingStudent(st);
                                setObsForm({
                                  pedagogicalNotes: st.pedagogicalNotes,
                                  completionRate: st.completionRate,
                                  activityNote: '',
                                });
                              }}
                              className="font-semibold text-blue-600 hover:underline"
                            >
                              Mettre à jour l’observation
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* =========================================================
                  TAB 8 : JOURNAUX D'ACTIVITÉ & ARCHITECTURE SQL RLS
                 ========================================================= */}
              {activeTab === 'logs' && (
                <div className="space-y-6">
                  <div className="rounded-xl border border-slate-200 bg-white p-6">
                    <h2 className="font-display text-lg font-bold text-slate-900">
                      Journal d’Audit des Actions Sensibles (Table PostgreSQL : activity_logs)
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Traçabilité complète des créations de comptes, réinitialisations de PIN, suspensions et modifications système.
                    </p>

                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500">
                            <th className="py-2.5 px-4">Acteur & Rôle</th>
                            <th className="py-2.5 px-4">Action</th>
                            <th className="py-2.5 px-4">Détails</th>
                            <th className="py-2.5 px-4 text-right">Horodatage</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-xs">
                          {data.activityLogs.map((log) => (
                            <tr key={log.id}>
                              <td className="py-2.5 px-4 font-medium text-slate-900">
                                {log.actorName}{' '}
                                <span className="text-slate-500 font-normal">
                                  ({log.actorRole})
                                </span>
                              </td>
                              <td className="py-2.5 px-4 font-mono text-[11px] text-blue-700">
                                {log.action}
                              </td>
                              <td className="py-2.5 px-4 text-slate-600">
                                {log.details}
                              </td>
                              <td className="py-2.5 px-4 text-right font-mono text-[11px] text-slate-500 tabular-nums">
                                {new Date(log.createdAt).toLocaleString('fr-FR')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <SqlAndDeployGuide />
                </div>
              )}

              {/* =========================================================
                  TAB 9 : PARAMÈTRES GÉNÉRAUX DE LA PLATEFORME (SUPER ADMIN)
                 ========================================================= */}
              {activeTab === 'settings' && identity.role === 'super_admin' && (
                <div className="max-w-3xl space-y-6">
                  <div className="rounded-xl border border-slate-200 bg-white p-6">
                    <h2 className="font-display text-lg font-bold text-slate-900">
                      Paramètres Généraux de la Plateforme
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Le nom du projet (par défaut « EduSpace »), l’établissement et le serveur Jitsi Meet sont modifiables en temps réel et persistés dans PostgreSQL.
                    </p>

                    <form onSubmit={handleSaveSettings} className="mt-6 space-y-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700">
                            Nom de la plateforme (modifiable)
                          </label>
                          <input
                            type="text"
                            required
                            value={settingsForm.platformName}
                            onChange={(e) =>
                              setSettingsForm({
                                ...settingsForm,
                                platformName: e.target.value,
                              })
                            }
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700">
                            Nom de l’établissement ou organisme
                          </label>
                          <input
                            type="text"
                            required
                            value={settingsForm.institutionName}
                            onChange={(e) =>
                              setSettingsForm({
                                ...settingsForm,
                                institutionName: e.target.value,
                              })
                            }
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700">
                            Année académique
                          </label>
                          <input
                            type="text"
                            value={settingsForm.academicYear}
                            onChange={(e) =>
                              setSettingsForm({
                                ...settingsForm,
                                academicYear: e.target.value,
                              })
                            }
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono text-slate-900 focus:border-blue-600 focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700">
                            Domaine Visioconférence Jitsi Meet
                          </label>
                          <input
                            type="text"
                            value={settingsForm.jitsiDomain}
                            onChange={(e) =>
                              setSettingsForm({
                                ...settingsForm,
                                jitsiDomain: e.target.value,
                              })
                            }
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono text-slate-900 focus:border-blue-600 focus:outline-hidden"
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          className="rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
                        >
                          Enregistrer les paramètres dans PostgreSQL
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* =========================================================
          MODALS : JITSI, DOCUMENT VIEWER, AUTH, CRUD & CONFIRM DELETE
         ========================================================= */}
      {activeJitsiSession && (
        <JitsiRoomModal
          session={activeJitsiSession}
          jitsiDomain={data?.settings?.jitsiDomain || 'meet.jit.si'}
          userDisplayName={identity.name}
          userEmail={identity.email}
          userRole={identity.role}
          onClose={() => setActiveJitsiSession(null)}
        />
      )}

      {showAuthModal && (
        <AuthSwitchModal
          currentRole={identity.role}
          currentUid={identity.uid}
          onSelectIdentity={(nextId) => {
            setIdentity(nextId);
            setActiveTab('dashboard');
          }}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {/* Document Viewer Modal */}
      {viewingDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-display text-base font-bold text-slate-900">
                  {viewingDocument.title}
                </h3>
                <p className="text-xs text-slate-500">
                  {viewingDocument.subjectName} · {viewingDocument.chapter} ·{' '}
                  {viewingDocument.fileType} ({viewingDocument.fileSize})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingDocument(null)}
                className="text-xs font-medium text-slate-500 hover:text-slate-900"
              >
                Fermer
              </button>
            </div>
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-5 text-xs text-slate-700 space-y-2 leading-relaxed">
              <p className="font-semibold text-slate-900">
                Aperçu sécurisé du support pédagogique :
              </p>
              <p>{viewingDocument.description}</p>
              <p className="font-mono text-[11px] text-slate-500 pt-2">
                Enseignant : {viewingDocument.teacherName} · Groupe autorisé :{' '}
                {viewingDocument.allowedGroup}
              </p>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              {viewingDocument.allowDownload && (
                <button
                  type="button"
                  onClick={() =>
                    handleInteractDocument(viewingDocument, 'download')
                  }
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Télécharger une copie
                </button>
              )}
              <button
                type="button"
                onClick={() => setViewingDocument(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700"
              >
                Fermer l’aperçu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Deletion Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="font-display text-base font-bold text-slate-900">
              Confirmer la suppression définitive
            </h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Êtes-vous certain de vouloir supprimer «{' '}
              <strong className="text-slate-900">{confirmDelete.label}</strong>{' '}
              » de la base de données PostgreSQL ? Cette opération est irréversible.
            </p>
            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={executeConfirmedDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
              >
                Confirmer la suppression
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Teacher Modal */}
      {showTeacherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="font-display text-base font-bold text-slate-900">
              {editingTeacher
                ? 'Modifier le compte professeur'
                : 'Ajouter un compte professeur'}
            </h3>
            <form onSubmit={handleSaveTeacher} className="mt-4 space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    required
                    value={teacherForm.fullName}
                    onChange={(e) =>
                      setTeacherForm({
                        ...teacherForm,
                        fullName: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Email professionnel
                  </label>
                  <input
                    type="email"
                    required
                    value={teacherForm.email}
                    onChange={(e) =>
                      setTeacherForm({ ...teacherForm, email: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Spécialité enseignée
                  </label>
                  <input
                    type="text"
                    required
                    value={teacherForm.specialty}
                    onChange={(e) =>
                      setTeacherForm({
                        ...teacherForm,
                        specialty: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Département
                  </label>
                  <input
                    type="text"
                    value={teacherForm.department}
                    onChange={(e) =>
                      setTeacherForm({
                        ...teacherForm,
                        department: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTeacherModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Student Modal */}
      {showStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="font-display text-base font-bold text-slate-900">
              {editingStudent
                ? 'Modifier le dossier élève'
                : 'Inscrire un nouvel élève (génération automatique du PIN)'}
            </h3>
            <form onSubmit={handleSaveStudent} className="mt-4 space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Nom complet de l’élève
                  </label>
                  <input
                    type="text"
                    required
                    value={studentForm.fullName}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        fullName: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Email de l’élève
                  </label>
                  <input
                    type="email"
                    required
                    value={studentForm.email}
                    onChange={(e) =>
                      setStudentForm({ ...studentForm, email: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Niveau / Classe
                  </label>
                  <select
                    value={studentForm.gradeLevel}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        gradeLevel: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  >
                    <option value="Terminale">Terminale</option>
                    <option value="Première">Première</option>
                    <option value="Seconde">Seconde</option>
                    <option value="Supérieur (Bac+1)">Supérieur (Bac+1)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Groupe
                  </label>
                  <select
                    value={studentForm.groupName}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        groupName: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  >
                    <option value="Groupe A">Groupe A</option>
                    <option value="Groupe B">Groupe B</option>
                    <option value="Promotion 2026">Promotion 2026</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Matière principale suivie
                </label>
                <input
                  type="text"
                  value={studentForm.subjectFocus}
                  onChange={(e) =>
                    setStudentForm({
                      ...studentForm,
                      subjectFocus: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                />
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowStudentModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Enregistrer l’élève
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="font-display text-base font-bold text-slate-900">
              Importer une liste d’élèves (CSV / Excel)
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Format par ligne : Nom Complet ; Email ; Niveau ; Groupe ; Matière
            </p>
            <form onSubmit={handleImportCsv} className="mt-3 space-y-3">
              <textarea
                rows={5}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-3 font-mono text-xs"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCsvModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Lancer l’importation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Course Modal */}
      {showCourseModal && data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="font-display text-base font-bold text-slate-900">
              {editingCourse ? 'Modifier le cours' : 'Publier un nouveau cours'}
            </h3>
            <form onSubmit={handleSaveCourse} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Titre du cours
                </label>
                <input
                  type="text"
                  required
                  value={courseForm.title}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, title: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Chapitre
                  </label>
                  <input
                    type="text"
                    required
                    value={courseForm.chapter}
                    onChange={(e) =>
                      setCourseForm({ ...courseForm, chapter: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Classe cible
                  </label>
                  <select
                    value={courseForm.classId}
                    onChange={(e) =>
                      setCourseForm({
                        ...courseForm,
                        classId: Number(e.target.value),
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  >
                    {data.classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Résumé pédagogique
                </label>
                <textarea
                  rows={3}
                  required
                  value={courseForm.description}
                  onChange={(e) =>
                    setCourseForm({
                      ...courseForm,
                      description: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Enregistrer le cours
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Modal */}
      {showDocumentModal && data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="font-display text-base font-bold text-slate-900">
              Publier un document ou support pédagogique
            </h3>
            <form onSubmit={handleSaveDocument} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Titre du document
                </label>
                <input
                  type="text"
                  required
                  value={documentForm.title}
                  onChange={(e) =>
                    setDocumentForm({ ...documentForm, title: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Format
                  </label>
                  <select
                    value={documentForm.fileType}
                    onChange={(e) =>
                      setDocumentForm({
                        ...documentForm,
                        fileType: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  >
                    <option value="PDF">PDF</option>
                    <option value="WORD">Document Word</option>
                    <option value="PPT">Présentation PowerPoint</option>
                    <option value="VIDEO">Vidéo pédagogique</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Groupe d’élèves autorisé
                  </label>
                  <select
                    value={documentForm.allowedGroup}
                    onChange={(e) =>
                      setDocumentForm({
                        ...documentForm,
                        allowedGroup: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  >
                    <option value="Tous">Tous les élèves de la classe</option>
                    <option value="Groupe A">Groupe A uniquement</option>
                    <option value="Groupe B">Groupe B uniquement</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={documentForm.allowDownload}
                    onChange={(e) =>
                      setDocumentForm({
                        ...documentForm,
                        allowDownload: e.target.checked,
                      })
                    }
                  />
                  <span>
                    Autoriser le téléchargement (si décoché : consultation en ligne uniquement)
                  </span>
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDocumentModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Publier le document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Live Session Modal */}
      {showSessionModal && data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="font-display text-base font-bold text-slate-900">
              Programmer une séance en direct Jitsi Meet
            </h3>
            <form onSubmit={handleCreateLiveSession} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Titre de la visioconférence
                </label>
                <input
                  type="text"
                  required
                  value={sessionForm.title}
                  onChange={(e) =>
                    setSessionForm({ ...sessionForm, title: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={sessionForm.scheduledDate}
                    onChange={(e) =>
                      setSessionForm({
                        ...sessionForm,
                        scheduledDate: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Heure
                  </label>
                  <input
                    type="time"
                    required
                    value={sessionForm.scheduledTime}
                    onChange={(e) =>
                      setSessionForm({
                        ...sessionForm,
                        scheduledTime: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Durée (min)
                  </label>
                  <input
                    type="number"
                    value={sessionForm.durationMinutes}
                    onChange={(e) =>
                      setSessionForm({
                        ...sessionForm,
                        durationMinutes: Number(e.target.value),
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSessionModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Créer la salle Jitsi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Conversation / Class Announcement Modal */}
      {showNewConvModal && data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="font-display text-base font-bold text-slate-900">
              Nouveau Message Privé ou Annonce de Classe
            </h3>
            <form
              onSubmit={handleCreateNewConversation}
              className="mt-4 space-y-3"
            >
              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={newConvForm.isAnnouncement}
                    onChange={(e) =>
                      setNewConvForm({
                        ...newConvForm,
                        isAnnouncement: e.target.checked,
                      })
                    }
                  />
                  <span>
                    Diffuser comme annonce officielle à toute la classe
                  </span>
                </label>
              </div>
              {!newConvForm.isAnnouncement && (
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Élève destinataire
                  </label>
                  <select
                    value={newConvForm.studentId}
                    onChange={(e) =>
                      setNewConvForm({
                        ...newConvForm,
                        studentId: Number(e.target.value),
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  >
                    {data.students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.studentCode})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Objet de la discussion / annonce
                </label>
                <input
                  type="text"
                  required
                  value={newConvForm.title}
                  onChange={(e) =>
                    setNewConvForm({ ...newConvForm, title: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Message
                </label>
                <textarea
                  rows={3}
                  required
                  value={newConvForm.content}
                  onChange={(e) =>
                    setNewConvForm({ ...newConvForm, content: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewConvModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Envoyer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pedagogical Observation Modal */}
      {observingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="font-display text-base font-bold text-slate-900">
              Suivi pédagogique — {observingStudent.fullName}
            </h3>
            <form onSubmit={handleSaveObservation} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Taux de progression validé (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={obsForm.completionRate}
                  onChange={(e) =>
                    setObsForm({
                      ...obsForm,
                      completionRate: Number(e.target.value),
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Observations pédagogiques générales
                </label>
                <textarea
                  rows={3}
                  value={obsForm.pedagogicalNotes}
                  onChange={(e) =>
                    setObsForm({
                      ...obsForm,
                      pedagogicalNotes: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setObservingStudent(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
