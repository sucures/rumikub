/**
 * Security routes for 2FA (Step Security.2) and recovery (Step Security.10).
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as securityController from '../controllers/securityController.js';

const router = Router();

// Step Security.10: Recovery request — no auth (user doesn't have access)
router.post('/recovery/request', securityController.requestRecovery);

router.use(authenticate);

// Step Security.10 Phase 2: Device registration
router.post('/device/register', securityController.registerDevice);

// Step Security.10: Recovery approve & finalize — require auth
router.get('/recovery/approve', securityController.approveRecovery);
router.post('/recovery/finalize', securityController.finalizeRecovery);

router.get('/status', securityController.getStatus);

// Step Security.4: Client-signed transactions
router.post('/public-key', securityController.setPublicKey);

router.post('/totp/setup', securityController.setupTotp);
router.post('/totp/enable', securityController.enableTotp);
router.post('/totp/disable', securityController.disableTotp);

router.post('/email-otp/send', securityController.sendEmailOtp);
router.post('/email-otp/verify', securityController.verifyEmailOtp);

router.post('/phone', securityController.setPhone);
router.post('/sms-otp/send', securityController.sendSmsOtp);
router.post('/sms-otp/verify', securityController.verifySmsOtp);

router.post('/disable', securityController.disable2FA);

export default router;
