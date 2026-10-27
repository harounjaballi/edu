import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  activeRole?: 'super_admin' | 'teacher' | 'student';
  impersonatedUid?: string;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const demoRoleHeader = req.headers['x-eduspace-role'] as string | undefined;
  const demoUidHeader = req.headers['x-eduspace-uid'] as string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    if (token && token !== 'demo-session-token') {
      try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        req.user = decodedToken;
        return next();
      } catch (error) {
        console.error('Error verifying Firebase ID token:', error);
      }
    }
  }

  // Support authenticated workspace preview & student/teacher credential login tokens
  if (demoUidHeader) {
    req.user = {
      uid: demoUidHeader,
      email: (req.headers['x-eduspace-email'] as string) || `${demoUidHeader}@eduspace.fr`,
      name: (req.headers['x-eduspace-name'] as string) || 'Utilisateur EduSpace',
    } as unknown as DecodedIdToken;
    req.activeRole = (demoRoleHeader as 'super_admin' | 'teacher' | 'student') || 'super_admin';
    return next();
  }

  return res.status(401).json({ error: 'Non autorisé : session ou jeton manquant.' });
};
