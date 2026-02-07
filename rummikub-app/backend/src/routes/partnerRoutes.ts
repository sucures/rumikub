import { Router } from 'express';
import { partnerService } from '../services/partnerService.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Crear nuevo partner (solo admin)
router.post('/create', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const partner = await partnerService.createPartner(req.body);
    res.json({ success: true, partner });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Registrar referencia
router.post('/referral', async (req, res) => {
  try {
    const { userId, partnerCode } = req.body;
    const success = await partnerService.registerReferral(userId, partnerCode);
    res.json({ success });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Obtener estadísticas de partner
router.get('/stats/:partnerId', authenticate, async (req, res) => {
  try {
    const stats = await partnerService.getPartnerStats(req.params.partnerId);
    res.json({ success: true, stats });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Procesar recompensas pendientes
router.post('/process-rewards/:partnerId', authenticate, async (req, res) => {
  try {
    const totalAmount = await partnerService.processPendingRewards(req.params.partnerId);
    res.json({ success: true, totalAmount });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
