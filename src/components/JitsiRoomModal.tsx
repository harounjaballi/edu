import React, { useState } from 'react';
import {
  Video,
  X,
  Users,
  CheckCircle2,
  Clock,
  ExternalLink,
  Maximize2,
  Minimize2,
  ShieldCheck,
} from 'lucide-react';
import { LiveSessionRecord } from '../types.ts';

interface JitsiRoomModalProps {
  session: LiveSessionRecord;
  jitsiDomain: string;
  userDisplayName: string;
  userEmail: string;
  userRole: string;
  onClose: () => void;
}

export const JitsiRoomModal: React.FC<JitsiRoomModalProps> = ({
  session,
  jitsiDomain,
  userDisplayName,
  userEmail,
  userRole,
  onClose,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAttendancePanel, setShowAttendancePanel] = useState(true);

  const cleanDomain = (jitsiDomain || 'meet.jit.si').replace(/^https?:\/\//, '');
  const iframeSrc = `https://${cleanDomain}/${encodeURIComponent(
    session.roomName
  )}#userInfo.displayName="${encodeURIComponent(
    userDisplayName
  )}"&userInfo.email="${encodeURIComponent(
    userEmail
  )}"&config.prejoinPageEnabled=false&config.startWithAudioMuted=false`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 p-4 backdrop-blur-xs">
      <div
        className={`flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl transition-all ${
          isFullscreen ? 'h-full w-full' : 'h-[86vh] w-full max-w-6xl'
        }`}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-3.5 text-white">
          <div className="flex items-center gap-3 min-w-0">
            <Video className="h-5 w-5 text-blue-400 shrink-0" />
            <div className="min-w-0">
              <h3 className="font-display text-sm font-semibold truncate">
                {session.title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span>{session.subjectName}</span>
                <span aria-hidden="true">·</span>
                <span>{session.className}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  Salle : {session.roomName}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowAttendancePanel((prev) => !prev)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
            >
              <Users className="h-3.5 w-3.5" />
              <span>
                Présences ({session.participants?.length || 0})
              </span>
            </button>

            <a
              href={session.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Ouvrir dans un onglet</span>
            </a>

            <button
              type="button"
              onClick={() => setIsFullscreen((prev) => !prev)}
              className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700 transition-colors"
              title="Plein écran"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors whitespace-nowrap shrink-0"
            >
              Quitter la séance
            </button>
          </div>
        </div>

        {/* Main Workspace Split */}
        <div className="flex flex-1 overflow-hidden bg-slate-950">
          <div className="relative flex-1">
            <iframe
              src={iframeSrc}
              title={`Jitsi Meet - ${session.title}`}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              className="h-full w-full border-0"
            />
          </div>

          {showAttendancePanel && (
            <div className="w-80 border-l border-slate-200 bg-white flex flex-col">
              <div className="border-b border-slate-200 px-4 py-3">
                <h4 className="font-display text-xs font-semibold text-slate-900">
                  Feuille de présence & Émargement
                </h4>
                <p className="mt-0.5 text-xs text-slate-500">
                  Enregistrement automatique à la connexion ({userRole === 'teacher' ? 'Professeur' : userRole === 'super_admin' ? 'Super Admin' : 'Élève'})
                </p>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-4 space-y-3">
                <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-blue-900">
                    <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>Enseignant référent : {session.teacherName}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-600 font-mono tabular-nums">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>
                      {session.scheduledDate} à {session.scheduledTime} ({session.durationMinutes} min)
                    </span>
                  </div>
                </div>

                {session.participants && session.participants.length > 0 ? (
                  session.participants.map((p) => (
                    <div key={p.id} className="pt-3 first:pt-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-900">
                          {p.studentName}
                        </span>
                        <span className="flex items-center gap-1 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>{p.attendanceStatus === 'present' ? 'Présent' : 'Retard'}</span>
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
                        <span>{p.studentCode}</span>
                        <span aria-hidden="true">·</span>
                        <span>{p.durationMinutes} min</span>
                      </div>
                      {p.participationNote && (
                        <p className="mt-1 text-xs text-slate-600">
                          {p.participationNote}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="py-6 text-center text-xs text-slate-500">
                    Aucun participant enregistré pour le moment.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
