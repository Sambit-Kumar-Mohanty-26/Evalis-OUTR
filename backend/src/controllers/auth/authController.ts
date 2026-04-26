import { Request, Response } from 'express';
import { db } from '../../config/db';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import emailjs from '@emailjs/nodejs';
import bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { createAuditLog } from '../../utils/auditLogger';

const JWT_SECRET = process.env.JWT_SECRET || 'evalis_hyper_secret_jwt_2024';
const JWT_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = 7 * 24 * 60 * 60 * 1000; // 7 days

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');
const generateRefreshToken = () => crypto.randomBytes(40).toString('hex');
const DEFAULT_PASSWORD = 'Evalis@2026';

export const sendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Institutional email is required' });
      return;
    }

    // Rate Limit Check (60-second cooldown)
    const lastOtp = await db.otpVerification.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' }
    });

    if (lastOtp && (Date.now() - lastOtp.lastSentAt.getTime() < 60000)) {
      res.status(429).json({ error: 'Radiation cooldown active. Please wait 60s.' });
      return;
    }

    // Invalidate old OTPs
    await db.otpVerification.updateMany({
      where: { email, isUsed: false },
      data: { isUsed: true }
    });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = hashToken(otp);

    await db.otpVerification.create({
      data: {
        email,
        otpHash,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min
      }
    });

    console.log(`\n🔐 EVALIS DEV PROTOCOL: OTP for ${email} -> [ ${otp} ]\n`);

    if (process.env.EMAILJS_SERVICE_ID && process.env.EMAILJS_TEMPLATE_ID) {
      try {
        await emailjs.send(
          process.env.EMAILJS_SERVICE_ID,
          process.env.EMAILJS_TEMPLATE_ID,
          { to_email: email, otp_code: otp, reply_to: "security@evalis.io" },
          {
            publicKey: process.env.EMAILJS_PUBLIC_KEY || '',
            privateKey: process.env.EMAILJS_PRIVATE_KEY || '',
          }
        );
      } catch (e) {
        console.error('EmailJS failure, check keys:', e);
      }
    }

    res.status(200).json({ message: 'OTP dispatched successfully.' });
  } catch (error) {
    console.error('Send OTP Error:', error);
    res.status(500).json({ error: 'System failure during OTP dispatch' });
  }
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      res.status(400).json({ error: 'Target email and signature required.' });
      return;
    }

    const activeOtp = await db.otpVerification.findFirst({
      where: { email, isUsed: false },
      orderBy: { createdAt: 'desc' }
    });

    if (!activeOtp || Date.now() > activeOtp.expiresAt.getTime()) {
      res.status(400).json({ error: 'Signature expired or invalid. Request new.' });
      return;
    }

    if (activeOtp.attemptCount >= 5) {
      await db.otpVerification.update({ where: { id: activeOtp.id }, data: { isUsed: true } });
      res.status(403).json({ error: 'Too many breaches. Re-initiate protocol.' });
      return;
    }

    const inputHash = hashToken(otp);
    if (inputHash !== activeOtp.otpHash) {
      await db.otpVerification.update({
        where: { id: activeOtp.id },
        data: { attemptCount: { increment: 1 } }
      });
      res.status(401).json({ error: 'Invalid signature match.' });
      return;
    }

    await db.otpVerification.update({ where: { id: activeOtp.id }, data: { isUsed: true } });

    // Issue pre-auth token (short-lived)
    const preAuthToken = jwt.sign(
      { email, verified: true },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.status(200).json({ message: 'Verification crystallized.', preAuthToken });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({ error: 'Internal system mismatch' });
  }
};

export const onboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, email, phoneNumber, password, preAuthToken } = req.body;

    if (!preAuthToken) {
      res.status(401).json({ error: 'Verification missing.' });
      return;
    }

    // Verify pre-auth token
    let decoded: any;
    try {
      decoded = jwt.verify(preAuthToken, JWT_SECRET);
      if (decoded.email !== email || !decoded.verified) throw new Error();
    } catch {
      res.status(403).json({ error: 'Integrity breach. Re-verify email.' });
      return;
    }

    // Check if admin already exists
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: 'Identity already registered in grid.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Create Tenant and Admin in a transaction
    const result = await db.$transaction(async (tx: Prisma.TransactionClient) => {
      const tenant = await tx.tenant.create({
        data: { name: `${fullName}'s Intelligence Hub` }
      });

      const user = await tx.user.create({
        data: {
          fullName,
          email,
          phoneNumber,
          passwordHash,
          role: 'ADMIN',
          tenantId: tenant.id,
          onboardingRequired: true
        }
      });

      return { user, tenant };
    });

    res.status(201).json({
      message: 'Institutional core initialized.',
      user: { id: result.user.id, role: result.user.role }
    });
  } catch (error) {
    console.error('Onboard Error:', error);
    res.status(500).json({ error: 'Failed to initialize core' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await db.user.findUnique({ 
      where: { email },
      include: { tenant: true }
    });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ error: 'Credential mismatch.' });
      return;
    }

    const accessToken = jwt.sign(
      { 
        userId: user.id, 
        role: user.role, 
        tenantId: user.tenantId,
        email: user.email,
        onboardingRequired: user.onboardingRequired 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const rawRefreshToken = generateRefreshToken();
    const tokenHash = hashToken(rawRefreshToken);

    await db.refreshToken.create({
      data: {
        userId: user.id,
        tenantId: user.tenantId,
        tokenHash,
        ipAddress: req.ip || '0.0.0.0',
        userAgent: req.headers['user-agent'] || 'EvalisAgent',
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN)
      }
    });

    res.cookie('refresh_token', rawRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: REFRESH_TOKEN_EXPIRES_IN
    });

    // Log the event
    await createAuditLog(
      user.id,
      'LOGIN',
      'User',
      user.id,
      { email: user.email },
      req.ip
    );

    res.status(200).json({
      accessToken,
      user: { 
        id: user.id, 
        fullName: user.fullName, 
        role: user.role, 
        tenantId: user.tenantId,
        tenantName: user.tenant.name,
        onboardingRequired: user.onboardingRequired
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Login protocol failure' });
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawToken = req.cookies.refresh_token;
    if (!rawToken) {
      res.status(401).json({ error: 'Session missing.' });
      return;
    }

    const tokenHash = hashToken(rawToken);
    const storedToken = await db.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { include: { tenant: true } } }
    });

    if (!storedToken || storedToken.revoked || Date.now() > storedToken.expiresAt.getTime()) {
      // Security breach detection: if token is revoked but used, revoke all sessions for this user
      // BUT: Allow a small grace period (10s) if it was revoked recently (to handle race conditions)
      const isRecentlyRevoked = storedToken?.revoked && (Date.now() - storedToken.updatedAt.getTime() < 10000);
      
      if (storedToken?.revoked && !isRecentlyRevoked) {
        await db.refreshToken.updateMany({ where: { userId: storedToken.userId }, data: { revoked: true } });
        res.clearCookie('refresh_token', { path: '/' });
        res.status(401).json({ error: 'Session compromised.' });
        return;
      }

      if (!isRecentlyRevoked) {
        res.clearCookie('refresh_token', { path: '/' });
        res.status(401).json({ error: 'Session expired or invalid.' });
        return;
      }
      
      // If it's a recently revoked token, we might want to return the new one if we could find it,
      // but simpler is to just let the client wait for the concurrent request to finish.
      // For now, we'll return 401 and let the client retry.
      res.status(401).json({ error: 'Session rotating. Retry.' });
      return;
    }

    // Rotate refresh token
    await db.refreshToken.update({ where: { id: storedToken.id }, data: { revoked: true } });

    const newRawToken = generateRefreshToken();
    const newTokenHash = hashToken(newRawToken);

    await db.refreshToken.create({
      data: {
        userId: storedToken.userId,
        tenantId: storedToken.tenantId,
        tokenHash: newTokenHash,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN),
        ipAddress: req.ip || '0.0.0.0',
        userAgent: req.headers['user-agent'] || 'EvalisAgent'
      }
    });

    const newAccessToken = jwt.sign(
      { 
        userId: storedToken.user.id, 
        role: storedToken.user.role, 
        tenantId: storedToken.user.tenantId,
        email: storedToken.user.email,
        onboardingRequired: storedToken.user.onboardingRequired
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.cookie('refresh_token', newRawToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: REFRESH_TOKEN_EXPIRES_IN
    });

    res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    console.error('Refresh Error:', error);
    res.status(500).json({ error: 'Session renewal failure' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawToken = req.cookies.refresh_token;
    if (rawToken) {
      const tokenHash = hashToken(rawToken);
      await db.refreshToken.updateMany({ where: { tokenHash }, data: { revoked: true } });
    }
    res.clearCookie('refresh_token', { path: '/' });
    res.status(200).json({ message: 'Session terminated.' });
  } catch (err) {
    res.status(500).json({ error: 'Logout failure' });
  }
};

export const qrRegister = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, email, role, tenantId, preAuthToken } = req.body;

    if (!preAuthToken || !tenantId) {
      res.status(401).json({ error: 'Verification or tenant context missing.' });
      return;
    }

    // Verify pre-auth token
    let decoded: any;
    try {
      decoded = jwt.verify(preAuthToken, JWT_SECRET);
      if (decoded.email !== email || !decoded.verified) throw new Error();
    } catch {
      res.status(403).json({ error: 'Integrity breach. Re-verify email.' });
      return;
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: 'Identity already registered in grid.' });
      return;
    }

    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

    const user = await db.user.create({
      data: {
        fullName,
        email,
        passwordHash,
        role: role as any,
        tenantId,
        onboardingRequired: true,
        status: 'ACTIVE'
      }
    });

    res.status(201).json({
      message: 'Institutional identity synthesized. Please login with default credentials.',
      user: { id: user.id, role: user.role }
    });
  } catch (error) {
    console.error('QR Register Error:', error);
    res.status(500).json({ error: 'Failed to synthesize identity' });
  }
};
