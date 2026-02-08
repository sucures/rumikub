import { Router } from 'express';
import { cryptoService } from '../services/cryptoService.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Obtener balance de RUM tokens
router.get('/balance/:address', authenticate, async (req, res) => {
  try {
    const balance = await cryptoService.getRUMBalance(req.params.address);
    res.json({ success: true, balance });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Procesar compra con cripto
router.post('/purchase', authenticate, async (req, res) => {
  try {
    const { userId, itemId, amount, currency, txHash } = req.body;
    const purchase = await cryptoService.processCryptoPurchase(
      userId,
      itemId,
      amount,
      currency,
      txHash
    );
    res.json({ success: true, purchase });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Crear NFT
router.post('/mint-nft', authenticate, async (req, res) => {
  try {
    const { userId, name, description, imageUrl, attributes } = req.body;
    const nft = await cryptoService.mintNFT(
      userId,
      name,
      description,
      imageUrl,
      attributes
    );
    res.json({ success: true, nft });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Listar NFT para venta
router.post('/nft/list/:nftId', authenticate, async (req, res) => {
  try {
    const { price, currency } = req.body;
    await cryptoService.listNFTForSale(req.params.nftId, price, currency);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Comprar NFT
router.post('/nft/buy/:nftId', authenticate, async (req, res) => {
  try {
    const { buyerId, txHash } = req.body;
    await cryptoService.buyNFT(req.params.nftId, buyerId, txHash);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Obtener precio en cripto
router.post('/price', async (req, res) => {
  try {
    const prices = await cryptoService.getCryptoPrice(req.body);
    res.json({ success: true, prices });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
