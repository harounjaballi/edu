import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
} from 'drizzle-orm/pg-core';

// 0. Platform Settings
export const platformSettings = pgTable('platform_settings', {
  id: serial('id').primaryKey(),
  platformName: text('platform_name').notNull().default('EduSpace'),
  institutionName: text('institution_name').notNull().default('Institut Académique Supérieur'),
  academicYear: text('academic_year').notNull().default('2026-2027'),
  jitsiDomain: text('jitsi_domain').notNull().default('meet.jit.si'),
  allowStudentDownloadsDefault: boolean('allow_student_downloads_default').notNull().default(true),
  maintenanceMode: boolean('maintenance_mode').notNull().default(false),
  supportEmail: text('support_email').notNull().default('support@eduspace.fr'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 1. profiles : profils utilisateurs et rôles (super_admin, teacher, student)
export const profiles = pgTable('profiles', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull().unique(),
  fullName: text('full_name').notNull(),
  role: text('role').notNull().default('student'), // 'super_admin' | 'teacher' | 'student'
  status: text('status').notNull().default('active'), // 'active' | 'suspended'
  phone: text('phone').default(''),
  avatarUrl: text('avatar_url').default(''),
  lastLoginAt: timestamp('last_login_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 2. teachers : informations des professeurs
export const teachers = pgTable('teachers', {
  id: serial('id').primaryKey(),
  profileId: integer('profile_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  uid: text('uid').notNull().unique(),
  specialty: text('specialty').notNull().default('Mathématiques & Sciences'),
  department: text('department').notNull().default('Enseignement Général'),
  qualification: text('qualification').default('Agrégé / Certifié'),
  bio: text('bio').default(''),
  officeHours: text('office_hours').default('Lun-Ven 14h00 - 17h00'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 3. students : informations des élèves et rattachement aux professeurs
export const students = pgTable('students', {
  id: serial('id').primaryKey(),
  profileId: integer('profile_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  uid: text('uid').notNull().unique(),
  studentCode: text('student_code').notNull().unique(),
  primaryTeacherId: integer('primary_teacher_id').references(() => teachers.id, {
    onDelete: 'set null',
  }),
  gradeLevel: text('grade_level').notNull().default('Terminale'),
  groupName: text('group_name').notNull().default('Groupe A'),
  subjectFocus: text('subject_focus').default('Tronc Commun'),
  accessPin: text('access_pin').notNull().default('EDU-2026'),
  parentEmail: text('parent_email').default(''),
  parentPhone: text('parent_phone').default(''),
  pedagogicalNotes: text('pedagogical_notes').default(''),
  completionRate: integer('completion_rate').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 4. classes : classes et groupes
export const classes = pgTable('classes', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  level: text('level').notNull(),
  groupName: text('group_name').notNull().default('Groupe Principal'),
  academicYear: text('academic_year').notNull().default('2026-2027'),
  description: text('description').default(''),
  teacherId: integer('teacher_id').references(() => teachers.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 5. subjects : matières
export const subjects = pgTable('subjects', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  category: text('category').notNull().default('Sciences'),
  description: text('description').default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 6. teacher_classes : affectations des professeurs aux classes
export const teacherClasses = pgTable('teacher_classes', {
  id: serial('id').primaryKey(),
  teacherId: integer('teacher_id')
    .references(() => teachers.id, { onDelete: 'cascade' })
    .notNull(),
  classId: integer('class_id')
    .references(() => classes.id, { onDelete: 'cascade' })
    .notNull(),
  subjectId: integer('subject_id')
    .references(() => subjects.id, { onDelete: 'cascade' })
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 7. enrollments : inscriptions des élèves aux classes
export const enrollments = pgTable('enrollments', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id')
    .references(() => students.id, { onDelete: 'cascade' })
    .notNull(),
  classId: integer('class_id')
    .references(() => classes.id, { onDelete: 'cascade' })
    .notNull(),
  subjectId: integer('subject_id').references(() => subjects.id, { onDelete: 'set null' }),
  status: text('status').notNull().default('active'),
  enrolledAt: timestamp('enrolled_at').defaultNow().notNull(),
});

// 8. courses : cours
export const courses = pgTable('courses', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  chapter: text('chapter').notNull().default('Chapitre 1'),
  description: text('description').notNull(),
  content: text('content').default(''),
  videoUrl: text('video_url').default(''),
  externalLink: text('external_link').default(''),
  classId: integer('class_id')
    .references(() => classes.id, { onDelete: 'cascade' })
    .notNull(),
  subjectId: integer('subject_id')
    .references(() => subjects.id, { onDelete: 'cascade' })
    .notNull(),
  teacherId: integer('teacher_id')
    .references(() => teachers.id, { onDelete: 'cascade' })
    .notNull(),
  status: text('status').notNull().default('published'), // 'published' | 'draft'
  publishedDate: text('published_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 9. documents : fichiers et ressources pédagogiques
export const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').default(''),
  fileType: text('file_type').notNull().default('PDF'), // 'PDF' | 'WORD' | 'PPT' | 'VIDEO' | 'IMAGE' | 'LINK'
  fileUrl: text('file_url').notNull(),
  fileSize: text('file_size').notNull().default('1.2 Mo'),
  chapter: text('chapter').notNull().default('Chapitre 1'),
  courseId: integer('course_id').references(() => courses.id, { onDelete: 'set null' }),
  classId: integer('class_id')
    .references(() => classes.id, { onDelete: 'cascade' })
    .notNull(),
  subjectId: integer('subject_id')
    .references(() => subjects.id, { onDelete: 'cascade' })
    .notNull(),
  teacherId: integer('teacher_id')
    .references(() => teachers.id, { onDelete: 'cascade' })
    .notNull(),
  allowDownload: boolean('allow_download').notNull().default(true),
  allowedGroup: text('allowed_group').notNull().default('Tous'), // 'Tous' | 'Groupe A' | 'Groupe B' | specific
  allowedStudentIds: text('allowed_student_ids').default(''), // comma-separated student IDs if restricted
  viewsCount: integer('views_count').notNull().default(0),
  publishedDate: text('published_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 10. conversations : conversations de messagerie
export const conversations = pgTable('conversations', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  type: text('type').notNull().default('private'), // 'private' | 'announcement'
  teacherId: integer('teacher_id')
    .references(() => teachers.id, { onDelete: 'cascade' })
    .notNull(),
  studentId: integer('student_id').references(() => students.id, { onDelete: 'cascade' }),
  classId: integer('class_id').references(() => classes.id, { onDelete: 'cascade' }),
  lastMessagePreview: text('last_message_preview').default(''),
  lastMessageAt: timestamp('last_message_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 11. messages : messages envoyés et reçus
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  conversationId: integer('conversation_id')
    .references(() => conversations.id, { onDelete: 'cascade' })
    .notNull(),
  senderUid: text('sender_uid').notNull(),
  senderName: text('sender_name').notNull(),
  senderRole: text('sender_role').notNull(),
  recipientUid: text('recipient_uid').default(''),
  content: text('content').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  isAnnouncement: boolean('is_announcement').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 12. live_sessions : séances de visioconférence Jitsi Meet
export const liveSessions = pgTable('live_sessions', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').default(''),
  subjectId: integer('subject_id')
    .references(() => subjects.id, { onDelete: 'cascade' })
    .notNull(),
  classId: integer('class_id')
    .references(() => classes.id, { onDelete: 'cascade' })
    .notNull(),
  teacherId: integer('teacher_id')
    .references(() => teachers.id, { onDelete: 'cascade' })
    .notNull(),
  roomName: text('room_name').notNull(),
  meetingUrl: text('meeting_url').notNull(),
  scheduledDate: text('scheduled_date').notNull(), // YYYY-MM-DD
  scheduledTime: text('scheduled_time').notNull(), // HH:mm
  durationMinutes: integer('duration_minutes').notNull().default(60),
  status: text('status').notNull().default('scheduled'), // 'scheduled' | 'live' | 'completed' | 'cancelled'
  allowedGroup: text('allowed_group').notNull().default('Tous'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 13. session_participants : participants et présence
export const sessionParticipants = pgTable('session_participants', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id')
    .references(() => liveSessions.id, { onDelete: 'cascade' })
    .notNull(),
  studentId: integer('student_id')
    .references(() => students.id, { onDelete: 'cascade' })
    .notNull(),
  attendanceStatus: text('attendance_status').notNull().default('present'), // 'present' | 'absent' | 'late' | 'invited'
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  durationMinutes: integer('duration_minutes').notNull().default(45),
  participationNote: text('participation_note').default(''),
});

// 14. notifications : notifications des utilisateurs
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  recipientUid: text('recipient_uid').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull().default('system'), // 'message' | 'document' | 'live_session' | 'announcement' | 'system'
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 15. student_activity : historique d'activité pédagogique
export const studentActivity = pgTable('student_activity', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id')
    .references(() => students.id, { onDelete: 'cascade' })
    .notNull(),
  activityType: text('activity_type').notNull(), // 'document_view' | 'document_download' | 'course_view' | 'live_join' | 'observation' | 'login'
  resourceTitle: text('resource_title').notNull(),
  details: text('details').default(''),
  progressDelta: integer('progress_delta').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 16. activity_logs : journal des actions sensibles
export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  actorUid: text('actor_uid').notNull(),
  actorName: text('actor_name').notNull(),
  actorRole: text('actor_role').notNull(),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').default(''),
  details: text('details').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
