import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import * as dotenv from 'dotenv';
import { db } from './src/db/index.ts';
import {
  platformSettings,
  profiles,
  teachers,
  students,
  classes,
  subjects,
  enrollments,
  courses,
  documents,
  conversations,
  messages,
  liveSessions,
  sessionParticipants,
  notifications,
  studentActivity,
} from './src/db/schema.ts';
import { eq, and } from 'drizzle-orm';
import { getFullBootstrapState, logAction, ensureSeeded } from './src/db/repository.ts';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));

// Helper to resolve current actor metadata from request headers
function getActor(req: AuthRequest) {
  const role = ((req.headers['x-eduspace-role'] as string) ||
    req.activeRole ||
    'super_admin') as 'super_admin' | 'teacher' | 'student';
  const uid =
    (req.headers['x-eduspace-uid'] as string) ||
    req.user?.uid ||
    (role === 'super_admin'
      ? 'admin-haroun'
      : role === 'teacher'
      ? 'teacher-laurent'
      : 'student-claire');
  const name =
    (req.headers['x-eduspace-name'] as string) ||
    req.user?.name ||
    (role === 'super_admin'
      ? 'Dr. Haroun Jaballi'
      : role === 'teacher'
      ? 'Marc Laurent'
      : 'Claire Dubois');
  return { uid, role, name };
}

// 1. Credential login endpoint (Email or Student Code + PIN)
app.post('/api/auth/credentials-login', async (req, res) => {
  try {
    await ensureSeeded();
    const { identifier, secret } = req.body;
    if (!identifier) {
      return res.status(400).json({ error: 'Identifiant requis.' });
    }

    const cleanId = String(identifier).trim().toLowerCase();
    const allProfiles = await db.select().from(profiles);
    const allStudents = await db.select().from(students);

    // Check by student code first
    const matchedStudent = allStudents.find(
      (s) => s.studentCode.toLowerCase() === cleanId
    );
    let matchedProfile = matchedStudent
      ? allProfiles.find((p) => p.id === matchedStudent.profileId)
      : allProfiles.find((p) => p.email.toLowerCase() === cleanId);

    if (!matchedProfile) {
      return res.status(401).json({
        error: 'Aucun compte trouvé avec cet email ou code élève.',
      });
    }

    if (matchedProfile.status === 'suspended') {
      return res.status(403).json({
        error: 'Ce compte a été suspendu par l’administration ou votre professeur.',
      });
    }

    if (matchedProfile.role === 'student') {
      const st = allStudents.find((s) => s.profileId === matchedProfile!.id);
      if (st && secret && st.accessPin.toLowerCase() !== String(secret).trim().toLowerCase()) {
        return res.status(401).json({
          error: 'Code PIN élève incorrect.',
        });
      }
    }

    await db
      .update(profiles)
      .set({ lastLoginAt: new Date(), updatedAt: new Date() })
      .where(eq(profiles.id, matchedProfile.id));

    await logAction({
      actorUid: matchedProfile.uid,
      actorName: matchedProfile.fullName,
      actorRole: matchedProfile.role,
      action: 'CONNEXION_UTILISATEUR',
      entityType: 'profiles',
      entityId: String(matchedProfile.id),
      details: `Connexion réussie (${matchedProfile.email})`,
    });

    res.json({
      uid: matchedProfile.uid,
      email: matchedProfile.email,
      fullName: matchedProfile.fullName,
      role: matchedProfile.role,
      status: matchedProfile.status,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Erreur de connexion.' });
  }
});

// 2. Bootstrap state
app.get('/api/bootstrap', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = getActor(req);
    const data = await getFullBootstrapState(actor.uid, actor.role);
    res.json(data);
  } catch (error: any) {
    console.error('Bootstrap error:', error);
    res.status(500).json({
      error: error.message || 'Impossible de charger les données de la plateforme.',
    });
  }
});

// 3. Update Platform Settings (Super Admin only)
app.put('/api/settings', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = getActor(req);
    if (actor.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Accès refusé : seul le Super Administrateur peut modifier les paramètres généraux.',
      });
    }

    const {
      platformName,
      institutionName,
      academicYear,
      jitsiDomain,
      allowStudentDownloadsDefault,
      maintenanceMode,
      supportEmail,
    } = req.body;

    const existing = await db.select().from(platformSettings).limit(1);
    if (existing.length > 0) {
      await db
        .update(platformSettings)
        .set({
          platformName: platformName || 'EduSpace',
          institutionName: institutionName || 'Institut Académique Supérieur',
          academicYear: academicYear || '2026-2027',
          jitsiDomain: jitsiDomain || 'meet.jit.si',
          allowStudentDownloadsDefault: Boolean(allowStudentDownloadsDefault),
          maintenanceMode: Boolean(maintenanceMode),
          supportEmail: supportEmail || 'support@eduspace.fr',
          updatedAt: new Date(),
        })
        .where(eq(platformSettings.id, existing[0].id));
    }

    await logAction({
      actorUid: actor.uid,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'MODIFICATION_PARAMETRES',
      entityType: 'platform_settings',
      entityId: '1',
      details: `Mise à jour des paramètres : nom="${platformName}", établissement="${institutionName}".`,
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Erreur lors de la sauvegarde des paramètres.' });
  }
});

// 4. Teachers CRUD (Super Admin only)
app.post('/api/teachers', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = getActor(req);
    if (actor.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Seul le Super Administrateur peut créer un compte professeur.',
      });
    }

    const { fullName, email, phone, specialty, department, qualification, officeHours, bio } =
      req.body;
    if (!fullName || !email) {
      return res.status(400).json({ error: 'Le nom complet et l’email sont obligatoires.' });
    }

    const uid = `teacher-${Date.now()}`;
    const [newProfile] = await db
      .insert(profiles)
      .values({
        uid,
        email: String(email).trim().toLowerCase(),
        fullName: String(fullName).trim(),
        role: 'teacher',
        status: 'active',
        phone: phone || '',
      })
      .returning();

    const [newTeacher] = await db
      .insert(teachers)
      .values({
        profileId: newProfile.id,
        uid,
        specialty: specialty || 'Enseignement Général',
        department: department || 'Département Académique',
        qualification: qualification || 'Certifié / Agrégé',
        officeHours: officeHours || 'Lun-Ven 14h00 - 17h00',
        bio: bio || '',
      })
      .returning();

    await logAction({
      actorUid: actor.uid,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'CREATION_PROFESSEUR',
      entityType: 'teachers',
      entityId: String(newTeacher.id),
      details: `Ajout du professeur ${fullName} (${email}) — Spécialité : ${specialty}`,
    });

    res.json({ teacher: newTeacher });
  } catch (error: any) {
    console.error('Create teacher error:', error);
    res.status(500).json({ error: 'Impossible de créer ce compte professeur (vérifiez l’email).' });
  }
});

app.put('/api/teachers/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = getActor(req);
    if (actor.role !== 'super_admin') {
      return res.status(403).json({ error: 'Action réservée au Super Administrateur.' });
    }

    const teacherId = Number(req.params.id);
    const { fullName, email, phone, status, specialty, department, qualification, officeHours } =
      req.body;

    const [existingTeacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.id, teacherId));
    if (!existingTeacher) {
      return res.status(404).json({ error: 'Professeur introuvable.' });
    }

    await db
      .update(profiles)
      .set({
        fullName,
        email,
        phone: phone || '',
        status: status || 'active',
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, existingTeacher.profileId));

    await db
      .update(teachers)
      .set({
        specialty,
        department,
        qualification,
        officeHours,
        updatedAt: new Date(),
      })
      .where(eq(teachers.id, teacherId));

    await logAction({
      actorUid: actor.uid,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'MODIFICATION_PROFESSEUR',
      entityType: 'teachers',
      entityId: String(teacherId),
      details: `Mise à jour du professeur ${fullName} (statut : ${status || 'active'})`,
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Update teacher error:', error);
    res.status(500).json({ error: 'Erreur lors de la modification du professeur.' });
  }
});

app.delete('/api/teachers/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = getActor(req);
    if (actor.role !== 'super_admin') {
      return res.status(403).json({ error: 'Action réservée au Super Administrateur.' });
    }

    const teacherId = Number(req.params.id);
    const [existingTeacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.id, teacherId));
    if (!existingTeacher) {
      return res.status(404).json({ error: 'Professeur introuvable.' });
    }

    await db.delete(profiles).where(eq(profiles.id, existingTeacher.profileId));

    await logAction({
      actorUid: actor.uid,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'SUPPRESSION_PROFESSEUR',
      entityType: 'teachers',
      entityId: String(teacherId),
      details: `Suppression définitive du compte professeur #${teacherId}`,
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete teacher error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du professeur.' });
  }
});

// 5. Students CRUD (Super Admin & Teacher)
app.post('/api/students', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = getActor(req);
    if (actor.role === 'student') {
      return res.status(403).json({ error: 'Action non autorisée pour un élève.' });
    }

    const {
      fullName,
      email,
      phone,
      gradeLevel,
      groupName,
      subjectFocus,
      primaryTeacherId,
      parentEmail,
      parentPhone,
      pedagogicalNotes,
    } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({ error: 'Le nom et l’email de l’élève sont requis.' });
    }

    let resolvedTeacherId = primaryTeacherId ? Number(primaryTeacherId) : null;
    if (actor.role === 'teacher' && !resolvedTeacherId) {
      const [t] = await db.select().from(teachers).where(eq(teachers.uid, actor.uid));
      if (t) resolvedTeacherId = t.id;
    }

    const uid = `student-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const randomNum = Math.floor(100 + Math.random() * 900);
    const studentCode = `ELV-2026-${randomNum}`;
    const accessPin = `EDU-${Math.floor(1000 + Math.random() * 9000)}`;

    const [newProfile] = await db
      .insert(profiles)
      .values({
        uid,
        email: String(email).trim().toLowerCase(),
        fullName: String(fullName).trim(),
        role: 'student',
        status: 'active',
        phone: phone || '',
      })
      .returning();

    const [newStudent] = await db
      .insert(students)
      .values({
        profileId: newProfile.id,
        uid,
        studentCode,
        primaryTeacherId: resolvedTeacherId,
        gradeLevel: gradeLevel || 'Terminale',
        groupName: groupName || 'Groupe A',
        subjectFocus: subjectFocus || 'Mathématiques Spécialité',
        accessPin,
        parentEmail: parentEmail || '',
        parentPhone: parentPhone || '',
        pedagogicalNotes: pedagogicalNotes || '',
        completionRate: 0,
      })
      .returning();

    await logAction({
      actorUid: actor.uid,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'INSCRIPTION_ELEVE',
      entityType: 'students',
      entityId: String(newStudent.id),
      details: `Création du compte élève ${fullName} (Code: ${studentCode}, Groupe: ${groupName})`,
    });

    res.json({ student: newStudent, studentCode, accessPin });
  } catch (error: any) {
    console.error('Create student error:', error);
    res.status(500).json({ error: 'Impossible d’ajouter cet élève (vérifiez que l’email est unique).' });
  }
});

// CSV / Excel Batch Import Students
app.post('/api/students/import-csv', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = getActor(req);
    if (actor.role === 'student') {
      return res.status(403).json({ error: 'Action non autorisée.' });
    }

    const { rows, primaryTeacherId } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'Aucune ligne valide trouvée dans le fichier importé.' });
    }

    let resolvedTeacherId = primaryTeacherId ? Number(primaryTeacherId) : null;
    if (!resolvedTeacherId) {
      const [t] = await db.select().from(teachers).where(eq(teachers.uid, actor.uid));
      if (t) resolvedTeacherId = t.id;
    }

    const createdCount = [];
    for (const row of rows) {
      const fullName = String(row.fullName || row.nom || '').trim();
      const email = String(row.email || '').trim().toLowerCase();
      if (!fullName || !email) continue;

      const uid = `student-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const studentCode = `ELV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const accessPin = `EDU-${Math.floor(1000 + Math.random() * 9000)}`;

      try {
        const [newProfile] = await db
          .insert(profiles)
          .values({
            uid,
            email,
            fullName,
            role: 'student',
            status: 'active',
            phone: row.phone || '',
          })
          .returning();

        const [newStudent] = await db
          .insert(students)
          .values({
            profileId: newProfile.id,
            uid,
            studentCode,
            primaryTeacherId: resolvedTeacherId,
            gradeLevel: row.gradeLevel || row.niveau || 'Terminale',
            groupName: row.groupName || row.groupe || 'Groupe A',
            subjectFocus: row.subjectFocus || row.matiere || 'Tronc Commun',
            accessPin,
            parentEmail: row.parentEmail || '',
            completionRate: 0,
          })
          .returning();

        createdCount.push(newStudent);
      } catch {
        // Skip duplicate emails gracefully
      }
    }

    await logAction({
      actorUid: actor.uid,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'IMPORT_CSV_ELEVES',
      entityType: 'students',
      entityId: String(createdCount.length),
      details: `Importation CSV de ${createdCount.length} élèves.`,
    });

    res.json({ imported: createdCount.length });
  } catch (error: any) {
    console.error('Import CSV error:', error);
    res.status(500).json({ error: 'Erreur lors de l’importation CSV.' });
  }
});

app.put('/api/students/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = getActor(req);
    if (actor.role === 'student') {
      return res.status(403).json({ error: 'Action non autorisée.' });
    }

    const studentId = Number(req.params.id);
    const {
      fullName,
      email,
      phone,
      status,
      gradeLevel,
      groupName,
      subjectFocus,
      pedagogicalNotes,
      completionRate,
    } = req.body;

    const [existing] = await db.select().from(students).where(eq(students.id, studentId));
    if (!existing) {
      return res.status(404).json({ error: 'Élève introuvable.' });
    }

    await db
      .update(profiles)
      .set({
        fullName,
        email,
        phone: phone || '',
        status: status || 'active',
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, existing.profileId));

    await db
      .update(students)
      .set({
        gradeLevel,
        groupName,
        subjectFocus,
        pedagogicalNotes: pedagogicalNotes ?? existing.pedagogicalNotes,
        completionRate:
          completionRate !== undefined ? Number(completionRate) : existing.completionRate,
        updatedAt: new Date(),
      })
      .where(eq(students.id, studentId));

    await logAction({
      actorUid: actor.uid,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'MODIFICATION_ELEVE',
      entityType: 'students',
      entityId: String(studentId),
      details: `Mise à jour du dossier élève ${fullName} (statut : ${status || 'active'})`,
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Update student error:', error);
    res.status(500).json({ error: 'Erreur lors de la modification de l’élève.' });
  }
});

app.post('/api/students/:id/reset-access', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = getActor(req);
    if (actor.role === 'student') {
      return res.status(403).json({ error: 'Action non autorisée.' });
    }

    const studentId = Number(req.params.id);
    const newPin = `EDU-${Math.floor(1000 + Math.random() * 9000)}`;

    const [updated] = await db
      .update(students)
      .set({ accessPin: newPin, updatedAt: new Date() })
      .where(eq(students.id, studentId))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Élève introuvable.' });
    }

    await logAction({
      actorUid: actor.uid,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'REINITIALISATION_ACCES_ELEVE',
      entityType: 'students',
      entityId: String(studentId),
      details: `Réinitialisation sécurisée du code d’accès pour l’élève ${updated.studentCode}`,
    });

    res.json({ accessPin: newPin, studentCode: updated.studentCode });
  } catch (error: any) {
    console.error('Reset student access error:', error);
    res.status(500).json({ error: 'Impossible de réinitialiser les identifiants.' });
  }
});

app.delete('/api/students/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = getActor(req);
    if (actor.role === 'student') {
      return res.status(403).json({ error: 'Action non autorisée.' });
    }

    const studentId = Number(req.params.id);
    const [existing] = await db.select().from(students).where(eq(students.id, studentId));
    if (!existing) {
      return res.status(404).json({ error: 'Élève introuvable.' });
    }

    await db.delete(profiles).where(eq(profiles.id, existing.profileId));

    await logAction({
      actorUid: actor.uid,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'SUPPRESSION_ELEVE',
      entityType: 'students',
      entityId: String(studentId),
      details: `Suppression du dossier élève ${existing.studentCode}`,
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete student error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de l’élève.' });
  }
});

// 6. Courses CRUD
app.post('/api/courses', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = getActor(req);
    if (actor.role === 'student') {
      return res.status(403).json({ error: 'Action réservée aux enseignants.' });
    }

    const { title, chapter, description, content, videoUrl, externalLink, classId, subjectId, teacherId } =
      req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Le titre et la description du cours sont obligatoires.' });
    }

    let resolvedTeacherId = teacherId ? Number(teacherId) : null;
    if (!resolvedTeacherId) {
      const [t] = await db.select().from(teachers).where(eq(teachers.uid, actor.uid));
      const allT = await db.select().from(teachers).limit(1);
      resolvedTeacherId = t?.id || allT[0]?.id || 1;
    }

    const [created] = await db
      .insert(courses)
      .values({
        title,
        chapter: chapter || 'Chapitre 1',
        description,
        content: content || '',
        videoUrl: videoUrl || '',
        externalLink: externalLink || '',
        classId: Number(classId) || 1,
        subjectId: Number(subjectId) || 1,
        teacherId: resolvedTeacherId,
        status: 'published',
        publishedDate: new Date().toISOString().slice(0, 10),
      })
      .returning();

    await logAction({
      actorUid: actor.uid,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'CREATION_COURS',
      entityType: 'courses',
      entityId: String(created.id),
      details: `Publication du cours « ${title} » (${chapter})`,
    });

    res.json({ course: created });
  } catch (error: any) {
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Erreur lors de la création du cours.' });
  }
});

app.put('/api/courses/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = getActor(req);
    if (actor.role === 'student') {
      return res.status(403).json({ error: 'Action non autorisée.' });
    }

    const courseId = Number(req.params.id);
    const { title, chapter, description, content, videoUrl, externalLink, classId, subjectId } =
      req.body;

    await db
      .update(courses)
      .set({
        title,
        chapter,
        description,
        content: content || '',
        videoUrl: videoUrl || '',
        externalLink: externalLink || '',
        classId: Number(classId),
        subjectId: Number(subjectId),
        updatedAt: new Date(),
      })
      .where(eq(courses.id, courseId));

    res.json({ success: true });
  } catch (error: any) {
    console.error('Update course error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du cours.' });
  }
});

app.delete('/api/courses/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = getActor(req);
    if (actor.role === 'student') {
      return res.status(403).json({ error: 'Action non autorisée.' });
    }

    const courseId = Number(req.params.id);
    await db.delete(courses).where(eq(courses.id, courseId));

    await logAction({
      actorUid: actor.uid,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'SUPPRESSION_COURS',
      entityType: 'courses',
      entityId: String(courseId),
      details: `Suppression du cours #${courseId}`,
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du cours.' });
  }
});

// 7. Documents CRUD
app.post('/api/documents', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = getActor(req);
    if (actor.role === 'student') {
      return res.status(403).json({ error: 'Action réservée aux enseignants.' });
    }

    const {
      title,
      description,
      fileType,
      fileUrl,
      fileSize,
      chapter,
      classId,
      subjectId,
      allowDownload,
      allowedGroup,
      allowedStudentIds,
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Le titre du document est obligatoire.' });
    }

    const [t] = await db.select().from(teachers).where(eq(teachers.uid, actor.uid));
    const allT = await db.select().from(teachers).limit(1);
    const resolvedTeacherId = t?.id || allT[0]?.id || 1;

    const [created] = await db
      .insert(documents)
      .values({
        title,
        description: description || '',
        fileType: fileType || 'PDF',
        fileUrl:
          fileUrl ||
          `https://eduspace-storage.internal/docs/${encodeURIComponent(title.toLowerCase())}.pdf`,
        fileSize: fileSize || '1.8 Mo',
        chapter: chapter || 'Chapitre 1',
        classId: Number(classId) || 1,
        subjectId: Number(subjectId) || 1,
        teacherId: resolvedTeacherId,
        allowDownload: allowDownload !== undefined ? Boolean(allowDownload) : true,
        allowedGroup: allowedGroup || 'Tous',
        allowedStudentIds: allowedStudentIds || '',
        viewsCount: 0,
        publishedDate: new Date().toISOString().slice(0, 10),
      })
      .returning();

    await logAction({
      actorUid: actor.uid,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'PUBLICATION_DOCUMENT',
      entityType: 'documents',
      entityId: String(created.id),
      details: `Publication du document « ${title} » (${fileType}, Téléchargement : ${
        allowDownload ? 'Autorisé' : 'Consultation seule'
      })`,
    });

    res.json({ document: created });
  } catch (error: any) {
    console.error('Create document error:', error);
    res.status(500).json({ error: 'Erreur lors de la publication du document.' });
  }
});

app.put('/api/documents/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = getActor(req);
    if (actor.role === 'student') {
      return res.status(403).json({ error: 'Action non autorisée.' });
    }

    const docId = Number(req.params.id);
    const { title, description, fileType, chapter, allowDownload, allowedGroup } = req.body;

    await db
      .update(documents)
      .set({
        title,
        description,
        fileType,
        chapter,
        allowDownload: Boolean(allowDownload),
        allowedGroup: allowedGroup || 'Tous',
        updatedAt: new Date(),
      })
      .where(eq(documents.id, docId));

    res.json({ success: true });
  } catch (error: any) {
    console.error('Update document error:', error);
    res.status(500).json({ error: 'Erreur lors de la modification du document.' });
  }
});

app.delete('/api/documents/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = getActor(req);
    if (actor.role === 'student') {
      return res.status(403).json({ error: 'Action non autorisée.' });
    }

    const docId = Number(req.params.id);
    await db.delete(documents).where(eq(documents.id, docId));

    await logAction({
      actorUid: actor.uid,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'SUPPRESSION_DOCUMENT',
      entityType: 'documents',
      entityId: String(docId),
      details: `Suppression du document #${docId}`,
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du document.' });
  }
});

app.post('/api/documents/:id/interact', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = getActor(req);
    const docId = Number(req.params.id);
    const { actionType } = req.body; // 'view' | 'download'

    const [doc] = await db.select().from(documents).where(eq(documents.id, docId));
    if (!doc) {
      return res.status(404).json({ error: 'Document introuvable.' });
    }

    if (actionType === 'download' && !doc.allowDownload && actor.role === 'student') {
      return res.status(403).json({
        error: 'Téléchargement interdit : ce document est configuré en consultation seule.',
      });
    }

    await db
      .update(documents)
      .set({ viewsCount: doc.viewsCount + 1 })
      .where(eq(documents.id, docId));

    if (actor.role === 'student') {
      const [st] = await db.select().from(students).where(eq(students.uid, actor.uid));
      if (st) {
        await db.insert(studentActivity).values({
          studentId: st.id,
          activityType: actionType === 'download' ? 'document_download' : 'document_view',
          resourceTitle: doc.title,
          details:
            actionType === 'download'
              ? `Téléchargement (${doc.fileType} • ${doc.fileSize})`
              : `Consultation en ligne (${doc.fileType})`,
          progressDelta: 5,
        });
      }
    }

    res.json({ success: true, viewsCount: doc.viewsCount + 1 });
  } catch (error: any) {
    console.error('Interact document error:', error);
    res.status(500).json({ error: 'Erreur lors de l’ouverture du document.' });
  }
});

// 8. Messaging & Announcements
app.post('/api/messages', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = getActor(req);
    const { conversationId, studentId, classId, title, content, isAnnouncement } = req.body;

    if (!content || !String(content).trim()) {
      return res.status(400).json({ error: 'Le contenu du message ne peut pas être vide.' });
    }

    let targetConvId = conversationId ? Number(conversationId) : null;

    if (!targetConvId) {
      const [t] = await db.select().from(teachers).where(eq(teachers.uid, actor.uid));
      const allT = await db.select().from(teachers).limit(1);
      const resolvedTeacherId = t?.id || allT[0]?.id || 1;

      const [newConv] = await db
        .insert(conversations)
        .values({
          title: title || (isAnnouncement ? 'Annonce de classe' : 'Conversation privée'),
          type: isAnnouncement ? 'announcement' : 'private',
          teacherId: resolvedTeacherId,
          studentId: studentId ? Number(studentId) : null,
          classId: classId ? Number(classId) : 1,
          lastMessagePreview: String(content).slice(0, 120),
          lastMessageAt: new Date(),
        })
        .returning();
      targetConvId = newConv.id;
    } else {
      await db
        .update(conversations)
        .set({
          lastMessagePreview: String(content).slice(0, 120),
          lastMessageAt: new Date(),
        })
        .where(eq(conversations.id, targetConvId));
    }

    const [createdMsg] = await db
      .insert(messages)
      .values({
        conversationId: targetConvId,
        senderUid: actor.uid,
        senderName: actor.name,
        senderRole: actor.role,
        recipientUid: '',
        content: String(content).trim(),
        isRead: false,
        isAnnouncement: Boolean(isAnnouncement),
      })
      .returning();

    // Create notification for recipient
    const [conv] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, targetConvId));

    if (conv) {
      if (actor.role === 'teacher' && conv.studentId) {
        const [st] = await db.select().from(students).where(eq(students.id, conv.studentId));
        if (st) {
          await db.insert(notifications).values({
            recipientUid: st.uid,
            title: isAnnouncement ? `Annonce : ${conv.title}` : `Message de ${actor.name}`,
            message: String(content).slice(0, 100),
            type: isAnnouncement ? 'announcement' : 'message',
            isRead: false,
          });
        }
      } else if (actor.role === 'student') {
        const [t] = await db.select().from(teachers).where(eq(teachers.id, conv.teacherId));
        if (t) {
          await db.insert(notifications).values({
            recipientUid: t.uid,
            title: `Nouveau message de ${actor.name}`,
            message: String(content).slice(0, 100),
            type: 'message',
            isRead: false,
          });
        }
      }
    }

    res.json({ message: createdMsg, conversationId: targetConvId });
  } catch (error: any) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Impossible d’envoyer le message.' });
  }
});

app.put('/api/notifications/read-all', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = getActor(req);
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.recipientUid, actor.uid));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour des notifications.' });
  }
});

// 9. Live Sessions (Jitsi Meet)
app.post('/api/live-sessions', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = getActor(req);
    if (actor.role === 'student') {
      return res.status(403).json({
        error: 'Seuls les professeurs et administrateurs peuvent programmer une visioconférence.',
      });
    }

    const {
      title,
      description,
      subjectId,
      classId,
      scheduledDate,
      scheduledTime,
      durationMinutes,
      allowedGroup,
      customRoomName,
    } = req.body;

    if (!title || !scheduledDate || !scheduledTime) {
      return res
        .status(400)
        .json({ error: 'Le titre, la date et l’heure de la séance sont requis.' });
    }

    const [t] = await db.select().from(teachers).where(eq(teachers.uid, actor.uid));
    const allT = await db.select().from(teachers).limit(1);
    const resolvedTeacherId = t?.id || allT[0]?.id || 1;

    const cleanSlug =
      customRoomName ||
      `EduSpace-${title
        .replace(/[^a-zA-Z0-9]/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 28)}-${Math.floor(100 + Math.random() * 900)}`;

    const [created] = await db
      .insert(liveSessions)
      .values({
        title,
        description: description || '',
        subjectId: Number(subjectId) || 1,
        classId: Number(classId) || 1,
        teacherId: resolvedTeacherId,
        roomName: cleanSlug,
        meetingUrl: `https://meet.jit.si/${cleanSlug}`,
        scheduledDate,
        scheduledTime,
        durationMinutes: Number(durationMinutes) || 60,
        status: 'scheduled',
        allowedGroup: allowedGroup || 'Tous',
      })
      .returning();

    await logAction({
      actorUid: actor.uid,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'PROGRAMMATION_VISIO',
      entityType: 'live_sessions',
      entityId: String(created.id),
      details: `Création de la visioconférence Jitsi « ${title} » (${scheduledDate} à ${scheduledTime})`,
    });

    res.json({ session: created });
  } catch (error: any) {
    console.error('Create live session error:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la visioconférence.' });
  }
});

app.put('/api/live-sessions/:id/status', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = getActor(req);
    if (actor.role === 'student') {
      return res.status(403).json({ error: 'Action non autorisée.' });
    }

    const sessionId = Number(req.params.id);
    const { status } = req.body;

    await db
      .update(liveSessions)
      .set({ status, updatedAt: new Date() })
      .where(eq(liveSessions.id, sessionId));

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur lors du changement de statut de la séance.' });
  }
});

app.post('/api/live-sessions/:id/join', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = getActor(req);
    const sessionId = Number(req.params.id);

    const [session] = await db
      .select()
      .from(liveSessions)
      .where(eq(liveSessions.id, sessionId));
    if (!session) {
      return res.status(404).json({ error: 'Séance introuvable.' });
    }

    if (actor.role === 'student') {
      const [st] = await db.select().from(students).where(eq(students.uid, actor.uid));
      if (st) {
        const existingPart = await db
          .select()
          .from(sessionParticipants)
          .where(
            and(
              eq(sessionParticipants.sessionId, sessionId),
              eq(sessionParticipants.studentId, st.id)
            )
          );

        if (existingPart.length === 0) {
          await db.insert(sessionParticipants).values({
            sessionId,
            studentId: st.id,
            attendanceStatus: 'present',
            durationMinutes: session.durationMinutes,
            participationNote: 'Participation en direct confirmée via Jitsi Meet.',
          });
        }

        await db.insert(studentActivity).values({
          studentId: st.id,
          activityType: 'live_join',
          resourceTitle: session.title,
          details: `Participation à la visioconférence Jitsi (${session.roomName})`,
          progressDelta: 10,
        });
      }
    }

    res.json({ success: true, roomName: session.roomName });
  } catch (error: any) {
    console.error('Join live session error:', error);
    res.status(500).json({ error: 'Impossible de rejoindre la séance.' });
  }
});

app.delete('/api/live-sessions/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = getActor(req);
    if (actor.role === 'student') {
      return res.status(403).json({ error: 'Action non autorisée.' });
    }
    const sessionId = Number(req.params.id);
    await db.delete(liveSessions).where(eq(liveSessions.id, sessionId));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur lors de la suppression de la séance.' });
  }
});

// 10. Pedagogical Observations & Classes
app.post('/api/students/:id/observation', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = getActor(req);
    if (actor.role === 'student') {
      return res.status(403).json({ error: 'Action réservée aux enseignants.' });
    }

    const studentId = Number(req.params.id);
    const { pedagogicalNotes, completionRate, activityNote } = req.body;

    await db
      .update(students)
      .set({
        pedagogicalNotes,
        completionRate: Number(completionRate) || 0,
        updatedAt: new Date(),
      })
      .where(eq(students.id, studentId));

    if (activityNote) {
      await db.insert(studentActivity).values({
        studentId,
        activityType: 'observation',
        resourceTitle: 'Observation pédagogique du professeur',
        details: activityNote,
        progressDelta: 5,
      });
    }

    await logAction({
      actorUid: actor.uid,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'OBSERVATION_PEDAGOGIQUE',
      entityType: 'students',
      entityId: String(studentId),
      details: `Mise à jour du suivi pédagogique pour l’élève #${studentId}`,
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur lors de l’enregistrement de l’observation.' });
  }
});

app.post('/api/classes', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = getActor(req);
    if (actor.role === 'student') {
      return res.status(403).json({ error: 'Action non autorisée.' });
    }

    const { name, code, level, groupName, description, teacherId } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: 'Le nom et le code de la classe sont obligatoires.' });
    }

    const [created] = await db
      .insert(classes)
      .values({
        name,
        code: String(code).toUpperCase().trim(),
        level: level || 'Terminale',
        groupName: groupName || 'Groupe A',
        academicYear: '2026-2027',
        description: description || '',
        teacherId: teacherId ? Number(teacherId) : null,
      })
      .returning();

    res.json({ classItem: created });
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur lors de la création de la classe (code déjà utilisé).' });
  }
});

async function startServer() {
  const PORT = 3000;

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EduSpace server running on http://localhost:${PORT}`);
  });
}

startServer();
