import { db } from './index.ts';
import {
  platformSettings,
  profiles,
  teachers,
  students,
  classes,
  subjects,
  teacherClasses,
  enrollments,
  courses,
  documents,
  conversations,
  messages,
  liveSessions,
  sessionParticipants,
  notifications,
  studentActivity,
  activityLogs,
} from './schema.ts';
import { eq, desc, and, inArray } from 'drizzle-orm';

let isSeeded = false;

export async function ensureSeeded() {
  if (isSeeded) return;
  try {
    const existingProfiles = await db.select().from(profiles).limit(1);
    if (existingProfiles.length > 0) {
      isSeeded = true;
      return;
    }

    // 0. Platform Settings
    await db.insert(platformSettings).values({
      platformName: 'EduSpace',
      institutionName: 'Lycée & Campus Supérieur Descartes',
      academicYear: '2026-2027',
      jitsiDomain: 'meet.jit.si',
      allowStudentDownloadsDefault: true,
      maintenanceMode: false,
      supportEmail: 'direction@eduspace-campus.fr',
    });

    // 1. Create Profiles (1 Super Admin, 3 Teachers, 6 Students)
    const insertedProfiles = await db
      .insert(profiles)
      .values([
        {
          uid: 'admin-haroun',
          email: 'harounjaballi@gmail.com',
          fullName: 'Dr. Haroun Jaballi',
          role: 'super_admin',
          status: 'active',
          phone: '+33 1 42 68 55 00',
        },
        {
          uid: 'teacher-laurent',
          email: 'm.laurent@eduspace.fr',
          fullName: 'Marc Laurent',
          role: 'teacher',
          status: 'active',
          phone: '+33 6 12 34 56 78',
        },
        {
          uid: 'teacher-moreau',
          email: 's.moreau@eduspace.fr',
          fullName: 'Sophie Moreau',
          role: 'teacher',
          status: 'active',
          phone: '+33 6 23 45 67 89',
        },
        {
          uid: 'teacher-benali',
          email: 'k.benali@eduspace.fr',
          fullName: 'Karim Benali',
          role: 'teacher',
          status: 'active',
          phone: '+33 6 98 76 54 32',
        },
        {
          uid: 'student-claire',
          email: 'claire.dubois@eleve.eduspace.fr',
          fullName: 'Claire Dubois',
          role: 'student',
          status: 'active',
          phone: '+33 6 11 22 33 44',
        },
        {
          uid: 'student-lucas',
          email: 'lucas.martin@eleve.eduspace.fr',
          fullName: 'Lucas Martin',
          role: 'student',
          status: 'active',
          phone: '+33 6 22 33 44 55',
        },
        {
          uid: 'student-emma',
          email: 'emma.bernard@eleve.eduspace.fr',
          fullName: 'Emma Bernard',
          role: 'student',
          status: 'active',
          phone: '+33 6 33 44 55 66',
        },
        {
          uid: 'student-yanis',
          email: 'yanis.khelifi@eleve.eduspace.fr',
          fullName: 'Yanis Khelifi',
          role: 'student',
          status: 'active',
          phone: '+33 6 44 55 66 77',
        },
        {
          uid: 'student-lea',
          email: 'lea.rousseau@eleve.eduspace.fr',
          fullName: 'Léa Rousseau',
          role: 'student',
          status: 'active',
          phone: '+33 6 55 66 77 88',
        },
        {
          uid: 'student-hugo',
          email: 'hugo.petit@eleve.eduspace.fr',
          fullName: 'Hugo Petit',
          role: 'student',
          status: 'suspended',
          phone: '+33 6 66 77 88 99',
        },
      ])
      .returning();

    const pMap = new Map(insertedProfiles.map((p) => [p.uid, p]));

    // 2. Insert Teachers
    const insertedTeachers = await db
      .insert(teachers)
      .values([
        {
          profileId: pMap.get('teacher-laurent')!.id,
          uid: 'teacher-laurent',
          specialty: 'Mathématiques & Algorithmique',
          department: 'Sciences Exactes',
          qualification: 'Agrégé de Mathématiques',
          bio: 'Responsable du pôle préparation scientifique et spécialité Mathématiques Expertes.',
          officeHours: 'Mardi & Jeudi • 16h30 - 18h30',
        },
        {
          profileId: pMap.get('teacher-moreau')!.id,
          uid: 'teacher-moreau',
          specialty: 'Physique-Chimie & Ingénierie',
          department: 'Sciences Expérimentales',
          qualification: 'Docteure en Physique Appliquée',
          bio: 'Enseignante référente pour les travaux pratiques numériques et la mécanique.',
          officeHours: 'Lundi & Mercredi • 15h00 - 17h00',
        },
        {
          profileId: pMap.get('teacher-benali')!.id,
          uid: 'teacher-benali',
          specialty: 'Numérique & Sciences Informatiques (NSI)',
          department: 'Informatique & Réseaux',
          qualification: 'Ingénieur & Certifié NSI',
          bio: 'Architecture logicielle, bases de données relationnelles SQL et structures de données.',
          officeHours: 'Vendredi • 14h00 - 17h00',
        },
      ])
      .returning();

    const tLaurent = insertedTeachers[0];
    const tMoreau = insertedTeachers[1];
    const tBenali = insertedTeachers[2];

    // 3. Insert Subjects
    const insertedSubjects = await db
      .insert(subjects)
      .values([
        {
          name: 'Mathématiques Spécialité',
          code: 'MATH-SPE',
          category: 'Sciences Exactes',
          description: 'Analyse, suites numériques, probabilités et géométrie dans l’espace.',
        },
        {
          name: 'Physique-Chimie',
          code: 'PHYS-CHIM',
          category: 'Sciences Expérimentales',
          description: 'Mécanique newtonienne, thermodynamique, ondes et transformations chimiques.',
        },
        {
          name: 'Numérique & Sciences Informatiques',
          code: 'INFO-NSI',
          category: 'Informatique',
          description: 'Algorithmique avancée, bases de données SQL, réseaux et programmation.',
        },
        {
          name: 'Mathématiques Expertes',
          code: 'MATH-EXP',
          category: 'Sciences Exactes',
          description: 'Nombres complexes, calcul matriciel et arithmétique modulaire.',
        },
      ])
      .returning();

    const sMath = insertedSubjects[0];
    const sPhys = insertedSubjects[1];
    const sNsi = insertedSubjects[2];
    const sMathExp = insertedSubjects[3];

    // 4. Insert Classes
    const insertedClasses = await db
      .insert(classes)
      .values([
        {
          name: 'Terminale Générale — Série Scientifique A',
          code: 'TG-SCI-A',
          level: 'Terminale',
          groupName: 'Groupe A',
          academicYear: '2026-2027',
          description: 'Classe préparatoire au Baccalauréat Scientifique (Spécialités Maths / Physique).',
          teacherId: tLaurent.id,
        },
        {
          name: 'Terminale Générale — Série Scientifique B',
          code: 'TG-SCI-B',
          level: 'Terminale',
          groupName: 'Groupe B',
          academicYear: '2026-2027',
          description: 'Classe Spécialité Mathématiques & NSI.',
          teacherId: tLaurent.id,
        },
        {
          name: 'Première Spécialité Sciences & Laboratoire',
          code: '1G-LAB',
          level: 'Première',
          groupName: 'Groupe A',
          academicYear: '2026-2027',
          description: 'Approfondissement physique expérimentale et modélisation.',
          teacherId: tMoreau.id,
        },
        {
          name: 'BTS / CPGE 1re Année — Informatique & Réseaux',
          code: 'SUP-INFO-1',
          level: 'Supérieur (Bac+1)',
          groupName: 'Promotion 2026',
          academicYear: '2026-2027',
          description: 'Développement Full Stack, SQL et systèmes distribués.',
          teacherId: tBenali.id,
        },
      ])
      .returning();

    const cTermA = insertedClasses[0];
    const cTermB = insertedClasses[1];
    const cPrem = insertedClasses[2];
    const cSup = insertedClasses[3];

    // 5. Teacher Classes
    await db.insert(teacherClasses).values([
      { teacherId: tLaurent.id, classId: cTermA.id, subjectId: sMath.id },
      { teacherId: tLaurent.id, classId: cTermB.id, subjectId: sMathExp.id },
      { teacherId: tMoreau.id, classId: cTermA.id, subjectId: sPhys.id },
      { teacherId: tMoreau.id, classId: cPrem.id, subjectId: sPhys.id },
      { teacherId: tBenali.id, classId: cTermB.id, subjectId: sNsi.id },
      { teacherId: tBenali.id, classId: cSup.id, subjectId: sNsi.id },
    ]);

    // 6. Insert Students
    const insertedStudents = await db
      .insert(students)
      .values([
        {
          profileId: pMap.get('student-claire')!.id,
          uid: 'student-claire',
          studentCode: 'ELV-2026-001',
          primaryTeacherId: tLaurent.id,
          gradeLevel: 'Terminale',
          groupName: 'Groupe A',
          subjectFocus: 'Mathématiques Spécialité',
          accessPin: 'EDU-8492',
          parentEmail: 'famille.dubois@parent.fr',
          parentPhone: '+33 6 01 02 03 04',
          pedagogicalNotes: 'Excellente maîtrise de l’analyse et participation active aux séances en direct.',
          completionRate: 92,
        },
        {
          profileId: pMap.get('student-lucas')!.id,
          uid: 'student-lucas',
          studentCode: 'ELV-2026-002',
          primaryTeacherId: tLaurent.id,
          gradeLevel: 'Terminale',
          groupName: 'Groupe A',
          subjectFocus: 'Mathématiques Spécialité',
          accessPin: 'EDU-3109',
          parentEmail: 'parents.martin@parent.fr',
          parentPhone: '+33 6 05 06 07 08',
          pedagogicalNotes: 'Progression régulière sur les suites récurrentes. Doit approfondir les exercices PDF.',
          completionRate: 78,
        },
        {
          profileId: pMap.get('student-emma')!.id,
          uid: 'student-emma',
          studentCode: 'ELV-2026-003',
          primaryTeacherId: tLaurent.id,
          gradeLevel: 'Terminale',
          groupName: 'Groupe B',
          subjectFocus: 'Mathématiques Expertes',
          accessPin: 'EDU-7541',
          parentEmail: 'mme.bernard@parent.fr',
          parentPhone: '+33 6 09 10 11 12',
          pedagogicalNotes: 'Très autonome, résultats remarquables en arithmétique et calcul matriciel.',
          completionRate: 96,
        },
        {
          profileId: pMap.get('student-yanis')!.id,
          uid: 'student-yanis',
          studentCode: 'ELV-2026-004',
          primaryTeacherId: tMoreau.id,
          gradeLevel: 'Première',
          groupName: 'Groupe A',
          subjectFocus: 'Physique-Chimie',
          accessPin: 'EDU-6204',
          parentEmail: 'khelifi.parent@parent.fr',
          parentPhone: '+33 6 13 14 15 16',
          pedagogicalNotes: 'Bon investissement en mécanique. Quelques retards de connexion à surveiller.',
          completionRate: 68,
        },
        {
          profileId: pMap.get('student-lea')!.id,
          uid: 'student-lea',
          studentCode: 'ELV-2026-005',
          primaryTeacherId: tBenali.id,
          gradeLevel: 'Supérieur (Bac+1)',
          groupName: 'Promotion 2026',
          subjectFocus: 'Numérique & Sciences Informatiques',
          accessPin: 'EDU-9083',
          parentEmail: 'rousseau.contact@parent.fr',
          parentPhone: '+33 6 17 18 19 20',
          pedagogicalNotes: 'Excellente compréhension des schémas PostgreSQL et des requêtes jointes.',
          completionRate: 88,
        },
        {
          profileId: pMap.get('student-hugo')!.id,
          uid: 'student-hugo',
          studentCode: 'ELV-2026-006',
          primaryTeacherId: tLaurent.id,
          gradeLevel: 'Terminale',
          groupName: 'Groupe B',
          subjectFocus: 'Mathématiques Spécialité',
          accessPin: 'EDU-4410',
          parentEmail: 'petit.famille@parent.fr',
          parentPhone: '+33 6 21 22 23 24',
          pedagogicalNotes: 'Compte suspendu temporairement suite à 3 semaines d’inactivité. Entretien prévu.',
          completionRate: 34,
        },
      ])
      .returning();

    const stClaire = insertedStudents[0];
    const stLucas = insertedStudents[1];
    const stEmma = insertedStudents[2];
    const stYanis = insertedStudents[3];
    const stLea = insertedStudents[4];
    const stHugo = insertedStudents[5];

    // 7. Enrollments
    await db.insert(enrollments).values([
      { studentId: stClaire.id, classId: cTermA.id, subjectId: sMath.id, status: 'active' },
      { studentId: stClaire.id, classId: cTermA.id, subjectId: sPhys.id, status: 'active' },
      { studentId: stLucas.id, classId: cTermA.id, subjectId: sMath.id, status: 'active' },
      { studentId: stEmma.id, classId: cTermB.id, subjectId: sMathExp.id, status: 'active' },
      { studentId: stYanis.id, classId: cPrem.id, subjectId: sPhys.id, status: 'active' },
      { studentId: stLea.id, classId: cSup.id, subjectId: sNsi.id, status: 'active' },
      { studentId: stHugo.id, classId: cTermB.id, subjectId: sMath.id, status: 'suspended' },
    ]);

    // 8. Courses
    const insertedCourses = await db
      .insert(courses)
      .values([
        {
          title: ' Suites Numériques, Récurrence & Convergence Monotone',
          chapter: 'Chapitre 1 — Analyse Réelle',
          description: 'Démonstration par récurrence, théorème de convergence monotone, suites adjacentes et limites.',
          content: 'Ce module couvre les fondements rigoureux du raisonnement par récurrence et l’étude asymptotique des suites définies par récurrence u_{n+1} = f(u_n).',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          externalLink: 'https://eduscol.education.fr/document/24565/download',
          classId: cTermA.id,
          subjectId: sMath.id,
          teacherId: tLaurent.id,
          status: 'published',
          publishedDate: '2026-10-12',
        },
        {
          title: 'Dérivation, Convexité & Fonctions Logarithme et Exponentielle',
          chapter: 'Chapitre 2 — Analyse Différentielle',
          description: 'Étude des fonctions convexes, points d’inflexion, inégalités de convexité et croissance comparée.',
          content: 'Analyse complète des fonctions de référence, théorème des valeurs intermédiaires et position relative des tangentes.',
          videoUrl: 'https://www.youtube.com/embed/aircAruvnKk',
          externalLink: 'https://www.bibmath.net/ressources/index.php',
          classId: cTermA.id,
          subjectId: sMath.id,
          teacherId: tLaurent.id,
          status: 'published',
          publishedDate: '2026-10-19',
        },
        {
          title: 'Arithmétique dans Z, Congruences & Théorème de Bézout',
          chapter: 'Chapitre 3 — Mathématiques Expertes',
          description: 'Divisibilité, PGCD, algorithme d’Euclide étendu, théorèmes de Bézout et de Gauss avec applications cryptographiques.',
          content: 'Application directe au chiffrement asymétrique RSA et résolution d’équations diophantiennes linéaires.',
          videoUrl: '',
          externalLink: 'https://culturemath.ens.fr/',
          classId: cTermB.id,
          subjectId: sMathExp.id,
          teacherId: tLaurent.id,
          status: 'published',
          publishedDate: '2026-10-22',
        },
        {
          title: 'Deuxième Loi de Newton & Mouvement dans un Champ Uniforme',
          chapter: 'Chapitre 1 — Mécanique Spatiale',
          description: 'Équations horaires du mouvement balistique, trajectoire parabolique et étude énergétique.',
          content: 'Mise en équation différentielle du vecteur vitesse et du vecteur position pour une particule chargée ou un projectile.',
          videoUrl: '',
          externalLink: 'https://phet.colorado.edu/fr/simulations/projectile-motion',
          classId: cPrem.id,
          subjectId: sPhys.id,
          teacherId: tMoreau.id,
          status: 'published',
          publishedDate: '2026-10-20',
        },
        {
          title: 'Modèle Relationnel PostgreSQL, Intégrité & Politiques RLS',
          chapter: 'Chapitre 2 — Bases de Données',
          description: 'Normalisation 3NF, clés étrangères, transactions ACID et sécurité Row-Level Security.',
          content: 'Conception d’un schéma relationnel complet et isolation multi-locataires par politiques de sécurité.',
          videoUrl: '',
          externalLink: 'https://www.postgresql.org/docs/current/ddl-rowsecurity.html',
          classId: cSup.id,
          subjectId: sNsi.id,
          teacherId: tBenali.id,
          status: 'published',
          publishedDate: '2026-10-24',
        },
      ])
      .returning();

    // 9. Documents
    await db.insert(documents).values([
      {
        title: 'Polycopié Complet — Suites Numériques & Récurrence (Cours + 25 Exercices)',
        description: 'Support officiel avec démonstrations détaillées et exercices gradués type Bac.',
        fileType: 'PDF',
        fileUrl: 'https://eduspace-storage.internal/docs/polycopie-suites-terminale.pdf',
        fileSize: '3.4 Mo',
        chapter: 'Chapitre 1 — Analyse Réelle',
        courseId: insertedCourses[0].id,
        classId: cTermA.id,
        subjectId: sMath.id,
        teacherId: tLaurent.id,
        allowDownload: true,
        allowedGroup: 'Tous',
        allowedStudentIds: '',
        viewsCount: 42,
        publishedDate: '2026-10-13',
      },
      {
        title: 'Sujet Devoir Surveillé n°2 — Convexité & Limites (Consultation seule)',
        description: 'Sujet d’entraînement chronométré. Téléchargement désactivé selon les consignes.',
        fileType: 'PDF',
        fileUrl: 'https://eduspace-storage.internal/docs/ds2-convexite-sujet.pdf',
        fileSize: '1.1 Mo',
        chapter: 'Chapitre 2 — Analyse Différentielle',
        courseId: insertedCourses[1].id,
        classId: cTermA.id,
        subjectId: sMath.id,
        teacherId: tLaurent.id,
        allowDownload: false,
        allowedGroup: 'Groupe A',
        allowedStudentIds: '',
        viewsCount: 29,
        publishedDate: '2026-10-21',
      },
      {
        title: 'Présentation Diaporama — Chiffrement RSA & Théorème de Bézout',
        description: 'Support de présentation projeté en classe avec exemples numériques pas à pas.',
        fileType: 'PPT',
        fileUrl: 'https://eduspace-storage.internal/docs/diaporama-rsa-bezout.pptx',
        fileSize: '5.8 Mo',
        chapter: 'Chapitre 3 — Mathématiques Expertes',
        courseId: insertedCourses[2].id,
        classId: cTermB.id,
        subjectId: sMathExp.id,
        teacherId: tLaurent.id,
        allowDownload: true,
        allowedGroup: 'Groupe B',
        allowedStudentIds: '',
        viewsCount: 19,
        publishedDate: '2026-10-23',
      },
      {
        title: 'Fiche Méthode Word — Rédaction Rigoureuse d’un Bilan des Forces',
        description: 'Modèle éditable pour les comptes-rendus de travaux pratiques de mécanique.',
        fileType: 'WORD',
        fileUrl: 'https://eduspace-storage.internal/docs/fiche-bilan-forces.docx',
        fileSize: '840 Ko',
        chapter: 'Chapitre 1 — Mécanique Spatiale',
        courseId: insertedCourses[3].id,
        classId: cPrem.id,
        subjectId: sPhys.id,
        teacherId: tMoreau.id,
        allowDownload: true,
        allowedGroup: 'Tous',
        allowedStudentIds: '',
        viewsCount: 31,
        publishedDate: '2026-10-22',
      },
      {
        title: 'TP Guidé SQL — Script d’Audit des Politiques RLS PostgreSQL',
        description: 'Exercices pratiques de création de rôles et de politiques Row Level Security.',
        fileType: 'PDF',
        fileUrl: 'https://eduspace-storage.internal/docs/tp-postgresql-rls.pdf',
        fileSize: '2.1 Mo',
        chapter: 'Chapitre 2 — Bases de Données',
        courseId: insertedCourses[4].id,
        classId: cSup.id,
        subjectId: sNsi.id,
        teacherId: tBenali.id,
        allowDownload: true,
        allowedGroup: 'Tous',
        allowedStudentIds: '',
        viewsCount: 24,
        publishedDate: '2026-10-25',
      },
    ]);

    // 10. Conversations & 11. Messages
    const insertedConvs = await db
      .insert(conversations)
      .values([
        {
          title: 'Suivi individuel — Claire Dubois (Mathématiques)',
          type: 'private',
          teacherId: tLaurent.id,
          studentId: stClaire.id,
          classId: cTermA.id,
          lastMessagePreview: 'Merci Monsieur Laurent, j’ai bien repris la question 3b par récurrence.',
        },
        {
          title: 'Suivi individuel — Lucas Martin (Mathématiques)',
          type: 'private',
          teacherId: tLaurent.id,
          studentId: stLucas.id,
          classId: cTermA.id,
          lastMessagePreview: 'N’oublie pas de consulter le corrigé méthodologique avant jeudi.',
        },
        {
          title: 'Annonce Officielle — Terminale Générale Série Scientifique A',
          type: 'announcement',
          teacherId: tLaurent.id,
          studentId: null,
          classId: cTermA.id,
          lastMessagePreview: 'La séance de visioconférence de révision avant le DS n°2 aura lieu demain à 17h30.',
        },
      ])
      .returning();

    await db.insert(messages).values([
      {
        conversationId: insertedConvs[0].id,
        senderUid: 'teacher-laurent',
        senderName: 'Marc Laurent',
        senderRole: 'teacher',
        recipientUid: 'student-claire',
        content: 'Bonjour Claire, j’ai relu ta copie sur les suites adjacentes. Excellent raisonnement, attention simplement à bien vérifier l’hypothèse de monotonie avant de conclure.',
        isRead: true,
        isAnnouncement: false,
      },
      {
        conversationId: insertedConvs[0].id,
        senderUid: 'student-claire',
        senderName: 'Claire Dubois',
        senderRole: 'student',
        recipientUid: 'teacher-laurent',
        content: 'Merci Monsieur Laurent, j’ai bien repris la question 3b par récurrence. Est-ce que l’exercice 18 du polycopié sera corrigé en visio ?',
        isRead: false,
        isAnnouncement: false,
      },
      {
        conversationId: insertedConvs[1].id,
        senderUid: 'teacher-laurent',
        senderName: 'Marc Laurent',
        senderRole: 'teacher',
        recipientUid: 'student-lucas',
        content: 'Bonjour Lucas, n’oublie pas de consulter le corrigé méthodologique avant jeudi pour consolider le théorème des gendarmes.',
        isRead: false,
        isAnnouncement: false,
      },
      {
        conversationId: insertedConvs[2].id,
        senderUid: 'teacher-laurent',
        senderName: 'Marc Laurent',
        senderRole: 'teacher',
        recipientUid: 'all-class',
        content: 'Annonce à toute la classe TG-SCI-A : La séance de visioconférence de révision avant le DS n°2 aura lieu demain à 17h30 sur Jitsi Meet.',
        isRead: true,
        isAnnouncement: true,
      },
    ]);

    // 12. Live Sessions & 13. Session Participants
    const insertedSessions = await db
      .insert(liveSessions)
      .values([
        {
          title: 'Séance Direct — Révision Intégrale Convexité & Suites (Préparation DS n°2)',
          description: 'Correction interactive des annales et session de questions-réponses en direct.',
          subjectId: sMath.id,
          classId: cTermA.id,
          teacherId: tLaurent.id,
          roomName: 'EduSpace-TG-SCI-A-Maths-Revision-2026',
          meetingUrl: 'https://meet.jit.si/EduSpace-TG-SCI-A-Maths-Revision-2026',
          scheduledDate: '2026-10-28',
          scheduledTime: '17:30',
          durationMinutes: 60,
          status: 'live',
          allowedGroup: 'Tous',
        },
        {
          title: 'Atelier Mathématiques Expertes — Algorithme d’Euclide & Cryptographie RSA',
          description: 'Travaux dirigés en visioconférence avec partage d’écran Python et démonstrations.',
          subjectId: sMathExp.id,
          classId: cTermB.id,
          teacherId: tLaurent.id,
          roomName: 'EduSpace-TG-SCI-B-MathsExpertes-RSA',
          meetingUrl: 'https://meet.jit.si/EduSpace-TG-SCI-B-MathsExpertes-RSA',
          scheduledDate: '2026-10-30',
          scheduledTime: '16:00',
          durationMinutes: 90,
          status: 'scheduled',
          allowedGroup: 'Groupe B',
        },
        {
          title: 'Bilan de Travaux Pratiques — Équations Horaires & Champ de Pesanteur',
          description: 'Synthèse méthodologique sur l’exploitation des pointages vidéo.',
          subjectId: sPhys.id,
          classId: cPrem.id,
          teacherId: tMoreau.id,
          roomName: 'EduSpace-1G-LAB-Physique-Mecanique',
          meetingUrl: 'https://meet.jit.si/EduSpace-1G-LAB-Physique-Mecanique',
          scheduledDate: '2026-10-24',
          scheduledTime: '15:00',
          durationMinutes: 60,
          status: 'completed',
          allowedGroup: 'Tous',
        },
      ])
      .returning();

    await db.insert(sessionParticipants).values([
      {
        sessionId: insertedSessions[0].id,
        studentId: stClaire.id,
        attendanceStatus: 'present',
        durationMinutes: 58,
        participationNote: 'Intervention pertinente au tableau partagé sur l’hérédité.',
      },
      {
        sessionId: insertedSessions[0].id,
        studentId: stLucas.id,
        attendanceStatus: 'present',
        durationMinutes: 52,
        participationNote: 'Présent et attentif.',
      },
      {
        sessionId: insertedSessions[2].id,
        studentId: stYanis.id,
        attendanceStatus: 'late',
        durationMinutes: 40,
        participationNote: 'Arrivé avec 15 min de retard mais bonne participation ensuite.',
      },
    ]);

    // 14. Notifications
    await db.insert(notifications).values([
      {
        recipientUid: 'teacher-laurent',
        title: 'Nouveau message de Claire Dubois',
        message: 'Claire Dubois a répondu dans la conversation « Suivi individuel — Mathématiques ».',
        type: 'message',
        isRead: false,
      },
      {
        recipientUid: 'student-claire',
        title: 'Séance de visioconférence prête à rejoindre',
        message: 'M. Marc Laurent a ouvert la salle « Révision Intégrale Convexité & Suites ».',
        type: 'live_session',
        isRead: false,
      },
      {
        recipientUid: 'student-claire',
        title: 'Nouveau document publié',
        message: 'Sujet Devoir Surveillé n°2 — Convexité & Limites a été publié dans votre classe.',
        type: 'document',
        isRead: false,
      },
      {
        recipientUid: 'admin-haroun',
        title: 'Audit de sécurité RLS & Intégrité PostgreSQL',
        message: 'Les 16 tables relationnelles et les politiques de permissions sont actives.',
        type: 'system',
        isRead: false,
      },
    ]);

    // 15. Student Activity
    await db.insert(studentActivity).values([
      {
        studentId: stClaire.id,
        activityType: 'document_download',
        resourceTitle: 'Polycopié Complet — Suites Numériques & Récurrence',
        details: 'Téléchargement autorisé effectué (PDF • 3.4 Mo)',
        progressDelta: 10,
      },
      {
        studentId: stClaire.id,
        activityType: 'live_join',
        resourceTitle: 'Séance Direct — Révision Intégrale Convexité & Suites',
        details: 'Présence enregistrée (58 min)',
        progressDelta: 15,
      },
      {
        studentId: stLucas.id,
        activityType: 'document_view',
        resourceTitle: 'Sujet Devoir Surveillé n°2 — Convexité & Limites',
        details: 'Consultation en ligne (mode lecture seule)',
        progressDelta: 8,
      },
      {
        studentId: stEmma.id,
        activityType: 'course_view',
        resourceTitle: 'Arithmétique dans Z, Congruences & Théorème de Bézout',
        details: 'Chapitre 3 complété à 100%',
        progressDelta: 12,
      },
    ]);

    // 16. Activity Logs
    await db.insert(activityLogs).values([
      {
        actorUid: 'admin-haroun',
        actorName: 'Dr. Haroun Jaballi',
        actorRole: 'super_admin',
        action: 'INITIALISATION_PLATEFORME',
        entityType: 'platform_settings',
        entityId: '1',
        details: 'Configuration initiale des politiques de sécurité et des accès multi-rôles.',
      },
      {
        actorUid: 'teacher-laurent',
        actorName: 'Marc Laurent',
        actorRole: 'teacher',
        action: 'PUBLICATION_DOCUMENT',
        entityType: 'documents',
        entityId: '2',
        details: 'Publication de « Sujet Devoir Surveillé n°2 » en mode consultation seule (Groupe A).',
      },
      {
        actorUid: 'teacher-laurent',
        actorName: 'Marc Laurent',
        actorRole: 'teacher',
        action: 'SUSPENSION_ELEVE',
        entityType: 'students',
        entityId: '6',
        details: 'Suspension préventive du compte élève Hugo Petit (ELV-2026-006) pour inactivité.',
      },
    ]);

    isSeeded = true;
  } catch (error) {
    console.error('Error seeding database:', error);
    throw new Error('Impossible d’initialiser les données PostgreSQL.', { cause: error });
  }
}

export async function getFullBootstrapState(
  viewerUid: string,
  viewerRole: 'super_admin' | 'teacher' | 'student'
) {
  try {
    await ensureSeeded();

    const [
      settingsRows,
      allProfiles,
      allTeachers,
      allStudents,
      allClasses,
      allSubjects,
      allCourses,
      allDocuments,
      allConversations,
      allMessages,
      allLiveSessions,
      allParticipants,
      allNotifications,
      allStudentActivities,
      allLogs,
    ] = await Promise.all([
      db.select().from(platformSettings).limit(1),
      db.select().from(profiles).orderBy(desc(profiles.createdAt)),
      db.select().from(teachers).orderBy(desc(teachers.createdAt)),
      db.select().from(students).orderBy(desc(students.createdAt)),
      db.select().from(classes).orderBy(desc(classes.createdAt)),
      db.select().from(subjects).orderBy(subjects.name),
      db.select().from(courses).orderBy(desc(courses.createdAt)),
      db.select().from(documents).orderBy(desc(documents.createdAt)),
      db.select().from(conversations).orderBy(desc(conversations.lastMessageAt)),
      db.select().from(messages).orderBy(messages.createdAt),
      db.select().from(liveSessions).orderBy(desc(liveSessions.scheduledDate)),
      db.select().from(sessionParticipants),
      db.select().from(notifications).orderBy(desc(notifications.createdAt)),
      db.select().from(studentActivity).orderBy(desc(studentActivity.createdAt)),
      db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(60),
    ]);

    const profileById = new Map(allProfiles.map((p) => [p.id, p]));
    const teacherById = new Map(allTeachers.map((t) => [t.id, t]));
    const classById = new Map(allClasses.map((c) => [c.id, c]));
    const subjectById = new Map(allSubjects.map((s) => [s.id, s]));

    // Enrich teachers with profile details
    const enrichedTeachers = allTeachers.map((t) => {
      const p = profileById.get(t.profileId);
      const studentCount = allStudents.filter((s) => s.primaryTeacherId === t.id).length;
      const courseCount = allCourses.filter((c) => c.teacherId === t.id).length;
      return {
        ...t,
        fullName: p?.fullName || 'Professeur',
        email: p?.email || '',
        status: p?.status || 'active',
        phone: p?.phone || '',
        lastLoginAt: p?.lastLoginAt,
        studentCount,
        courseCount,
      };
    });

    // Enrich students with profile & teacher details
    const enrichedStudents = allStudents.map((s) => {
      const p = profileById.get(s.profileId);
      const t = s.primaryTeacherId ? teacherById.get(s.primaryTeacherId) : undefined;
      const tp = t ? profileById.get(t.profileId) : undefined;
      return {
        ...s,
        fullName: p?.fullName || 'Élève',
        email: p?.email || '',
        status: p?.status || 'active',
        phone: p?.phone || '',
        lastLoginAt: p?.lastLoginAt,
        teacherName: tp?.fullName || 'Non rattaché',
      };
    });

    const enrichedCourses = allCourses.map((c) => {
      const cls = classById.get(c.classId);
      const sub = subjectById.get(c.subjectId);
      const t = teacherById.get(c.teacherId);
      const tp = t ? profileById.get(t.profileId) : undefined;
      return {
        ...c,
        className: cls?.name || 'Classe',
        classCode: cls?.code || '',
        subjectName: sub?.name || 'Matière',
        teacherName: tp?.fullName || 'Professeur',
      };
    });

    const enrichedDocuments = allDocuments.map((d) => {
      const cls = classById.get(d.classId);
      const sub = subjectById.get(d.subjectId);
      const t = teacherById.get(d.teacherId);
      const tp = t ? profileById.get(t.profileId) : undefined;
      return {
        ...d,
        className: cls?.name || 'Classe',
        classCode: cls?.code || '',
        subjectName: sub?.name || 'Matière',
        teacherName: tp?.fullName || 'Professeur',
      };
    });

    const enrichedSessions = allLiveSessions.map((ls) => {
      const cls = classById.get(ls.classId);
      const sub = subjectById.get(ls.subjectId);
      const t = teacherById.get(ls.teacherId);
      const tp = t ? profileById.get(t.profileId) : undefined;
      const participants = allParticipants
        .filter((sp) => sp.sessionId === ls.id)
        .map((sp) => {
          const st = enrichedStudents.find((s) => s.id === sp.studentId);
          return {
            ...sp,
            studentName: st?.fullName || 'Élève',
            studentCode: st?.studentCode || '',
          };
        });
      return {
        ...ls,
        className: cls?.name || 'Classe',
        classCode: cls?.code || '',
        subjectName: sub?.name || 'Matière',
        teacherName: tp?.fullName || 'Professeur',
        participants,
      };
    });

    const enrichedActivities = allStudentActivities.map((act) => {
      const st = enrichedStudents.find((s) => s.id === act.studentId);
      return {
        ...act,
        studentName: st?.fullName || 'Élève',
        studentCode: st?.studentCode || '',
        primaryTeacherId: st?.primaryTeacherId || null,
      };
    });

    // Apply strict server-side Role-Based Isolation (matching PostgreSQL RLS rules)
    if (viewerRole === 'super_admin') {
      return {
        settings: settingsRows[0],
        teachers: enrichedTeachers,
        students: enrichedStudents,
        classes: allClasses,
        subjects: allSubjects,
        courses: enrichedCourses,
        documents: enrichedDocuments,
        conversations: allConversations,
        messages: allMessages,
        liveSessions: enrichedSessions,
        notifications: allNotifications.filter(
          (n) => n.recipientUid === viewerUid || n.recipientUid === 'admin-haroun'
        ),
        studentActivities: enrichedActivities,
        activityLogs: allLogs,
      };
    }

    if (viewerRole === 'teacher') {
      const currentTeacher =
        enrichedTeachers.find((t) => t.uid === viewerUid) || enrichedTeachers[0];
      const teacherId = currentTeacher.id;

      const myStudents = enrichedStudents.filter((s) => s.primaryTeacherId === teacherId);
      const myStudentIds = new Set(myStudents.map((s) => s.id));
      const myConversations = allConversations.filter((c) => c.teacherId === teacherId);
      const myConvIds = new Set(myConversations.map((c) => c.id));

      return {
        settings: settingsRows[0],
        currentTeacher,
        teachers: [currentTeacher],
        students: myStudents,
        classes: allClasses.filter((c) => c.teacherId === teacherId || !c.teacherId),
        subjects: allSubjects,
        courses: enrichedCourses.filter((c) => c.teacherId === teacherId),
        documents: enrichedDocuments.filter((d) => d.teacherId === teacherId),
        conversations: myConversations,
        messages: allMessages.filter((m) => myConvIds.has(m.conversationId)),
        liveSessions: enrichedSessions.filter((ls) => ls.teacherId === teacherId),
        notifications: allNotifications.filter((n) => n.recipientUid === currentTeacher.uid),
        studentActivities: enrichedActivities.filter((a) => myStudentIds.has(a.studentId)),
        activityLogs: allLogs.filter((l) => l.actorUid === currentTeacher.uid),
      };
    }

    // Student role: strictly isolated to the logged-in student's own records & authorized resources
    const currentStudent =
      enrichedStudents.find((s) => s.uid === viewerUid) || enrichedStudents[0];
    const studentId = currentStudent.id;
    const myTeacherId = currentStudent.primaryTeacherId;

    const myCourses = enrichedCourses.filter(
      (c) => !myTeacherId || c.teacherId === myTeacherId
    );
    const myDocuments = enrichedDocuments.filter((d) => {
      if (myTeacherId && d.teacherId !== myTeacherId) return false;
      if (
        d.allowedGroup !== 'Tous' &&
        d.allowedGroup !== currentStudent.groupName
      ) {
        return false;
      }
      if (d.allowedStudentIds && d.allowedStudentIds.trim() !== '') {
        const ids = d.allowedStudentIds.split(',').map((x) => Number(x.trim()));
        if (!ids.includes(studentId)) return false;
      }
      return true;
    });

    const myConversations = allConversations.filter(
      (c) =>
        c.studentId === studentId ||
        (c.type === 'announcement' && (!myTeacherId || c.teacherId === myTeacherId))
    );
    const myConvIds = new Set(myConversations.map((c) => c.id));

    return {
      settings: settingsRows[0],
      currentStudent,
      teachers: enrichedTeachers.filter((t) => t.id === myTeacherId),
      // Strictly never expose other students' private records to a student
      students: [currentStudent],
      classes: allClasses.filter((c) => !myTeacherId || c.teacherId === myTeacherId),
      subjects: allSubjects,
      courses: myCourses,
      documents: myDocuments,
      conversations: myConversations,
      messages: allMessages.filter((m) => myConvIds.has(m.conversationId)),
      liveSessions: enrichedSessions.filter(
        (ls) =>
          (!myTeacherId || ls.teacherId === myTeacherId) &&
          (ls.allowedGroup === 'Tous' || ls.allowedGroup === currentStudent.groupName)
      ),
      notifications: allNotifications.filter((n) => n.recipientUid === currentStudent.uid),
      studentActivities: enrichedActivities.filter((a) => a.studentId === studentId),
      activityLogs: [],
    };
  } catch (error) {
    console.error('Database query failed in getFullBootstrapState:', error);
    throw new Error('Erreur lors de la récupération des données PostgreSQL.', {
      cause: error,
    });
  }
}

export async function logAction(params: {
  actorUid: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId?: string;
  details: string;
}) {
  try {
    await db.insert(activityLogs).values({
      actorUid: params.actorUid,
      actorName: params.actorName,
      actorRole: params.actorRole,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId || '',
      details: params.details,
    });
  } catch (error) {
    console.error('Failed to write activity log:', error);
  }
}
