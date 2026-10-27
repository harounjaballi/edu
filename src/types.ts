export type UserRole = 'super_admin' | 'teacher' | 'student';

export interface PlatformSettings {
  id: number;
  platformName: string;
  institutionName: string;
  academicYear: string;
  jitsiDomain: string;
  allowStudentDownloadsDefault: boolean;
  maintenanceMode: boolean;
  supportEmail: string;
}

export interface TeacherRecord {
  id: number;
  profileId: number;
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  status: 'active' | 'suspended';
  specialty: string;
  department: string;
  qualification: string;
  bio: string;
  officeHours: string;
  lastLoginAt: string;
  studentCount: number;
  courseCount: number;
}

export interface StudentRecord {
  id: number;
  profileId: number;
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  status: 'active' | 'suspended';
  studentCode: string;
  primaryTeacherId: number | null;
  teacherName: string;
  gradeLevel: string;
  groupName: string;
  subjectFocus: string;
  accessPin: string;
  parentEmail: string;
  parentPhone: string;
  pedagogicalNotes: string;
  completionRate: number;
  lastLoginAt: string;
}

export interface ClassRecord {
  id: number;
  name: string;
  code: string;
  level: string;
  groupName: string;
  academicYear: string;
  description: string;
  teacherId: number | null;
}

export interface SubjectRecord {
  id: number;
  name: string;
  code: string;
  category: string;
  description: string;
}

export interface CourseRecord {
  id: number;
  title: string;
  chapter: string;
  description: string;
  content: string;
  videoUrl: string;
  externalLink: string;
  classId: number;
  className: string;
  classCode: string;
  subjectId: number;
  subjectName: string;
  teacherId: number;
  teacherName: string;
  status: string;
  publishedDate: string;
}

export interface DocumentRecord {
  id: number;
  title: string;
  description: string;
  fileType: 'PDF' | 'WORD' | 'PPT' | 'VIDEO' | 'IMAGE' | 'LINK';
  fileUrl: string;
  fileSize: string;
  chapter: string;
  courseId: number | null;
  classId: number;
  className: string;
  classCode: string;
  subjectId: number;
  subjectName: string;
  teacherId: number;
  teacherName: string;
  allowDownload: boolean;
  allowedGroup: string;
  allowedStudentIds: string;
  viewsCount: number;
  publishedDate: string;
}

export interface ConversationRecord {
  id: number;
  title: string;
  type: 'private' | 'announcement';
  teacherId: number;
  studentId: number | null;
  classId: number | null;
  lastMessagePreview: string;
  lastMessageAt: string;
}

export interface MessageRecord {
  id: number;
  conversationId: number;
  senderUid: string;
  senderName: string;
  senderRole: string;
  recipientUid: string;
  content: string;
  isRead: boolean;
  isAnnouncement: boolean;
  createdAt: string;
}

export interface SessionParticipantRecord {
  id: number;
  sessionId: number;
  studentId: number;
  studentName: string;
  studentCode: string;
  attendanceStatus: 'present' | 'absent' | 'late' | 'invited';
  joinedAt: string;
  durationMinutes: number;
  participationNote: string;
}

export interface LiveSessionRecord {
  id: number;
  title: string;
  description: string;
  subjectId: number;
  subjectName: string;
  classId: number;
  className: string;
  classCode: string;
  teacherId: number;
  teacherName: string;
  roomName: string;
  meetingUrl: string;
  scheduledDate: string;
  scheduledTime: string;
  durationMinutes: number;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  allowedGroup: string;
  participants: SessionParticipantRecord[];
}

export interface NotificationRecord {
  id: number;
  recipientUid: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface StudentActivityRecord {
  id: number;
  studentId: number;
  studentName: string;
  studentCode: string;
  activityType: string;
  resourceTitle: string;
  details: string;
  progressDelta: number;
  createdAt: string;
}

export interface ActivityLogRecord {
  id: number;
  actorUid: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  createdAt: string;
}

export interface BootstrapData {
  settings: PlatformSettings;
  currentTeacher?: TeacherRecord;
  currentStudent?: StudentRecord;
  teachers: TeacherRecord[];
  students: StudentRecord[];
  classes: ClassRecord[];
  subjects: SubjectRecord[];
  courses: CourseRecord[];
  documents: DocumentRecord[];
  conversations: ConversationRecord[];
  messages: MessageRecord[];
  liveSessions: LiveSessionRecord[];
  notifications: NotificationRecord[];
  studentActivities: StudentActivityRecord[];
  activityLogs: ActivityLogRecord[];
}
