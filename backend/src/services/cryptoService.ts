// Servicio de Criptomonedas y NFTs
import { ethers } from 'ethers';
import { CryptoTransaction, NFT, ShopItem, Purchase } from '../shared/types.js';

export class CryptoService {
  private provider: ethers.JsonRpcProvider;
  private wallet!: ethers.Wallet;
  
  // Direcciones de contratos (deben configurarse según tu deploy)
  private RUM_TOKEN_ADDRESS = process.env.RUM_TOKEN_ADDRESS || '';
  private NFT_CONTRACT_ADDRESS = process.env.NFT_CONTRACT_ADDRESS || '';
  private MARKETPLACE_ADDRESS = process.env.MARKETPLACE_ADDRESS || '';

  constructor() {
    // Configurar provider (RPC endpoint)
    const rpcUrl = process.env.RPC_URL || 'https://mainnet.infura.io/v3/YOUR_KEY';
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Configurar wallet (privado del servidor)
    const privateKey = process.env.WALLET_PRIVATE_KEY || '';
    if (privateKey) {
      this.wallet = new ethers.Wallet(privateKey, this.provider);
    }
  }

  // Obtener balance de RUM tokens
  async getRUMBalance(address: string): Promise<number> {
    try {
      // ABI simplificado del token ERC-20
      const tokenAbi = [
        'function balanceOf(address owner) view returns (uint256)',
        'function decimals() view returns (uint8)',
      ];

      const tokenContract = new ethers.Contract(
        this.RUM_TOKEN_ADDRESS,
        tokenAbi,
        this.provider
      );

      const balance = await tokenContract.balanceOf(address);
      const decimals = await tokenContract.decimals();
      
      return parseFloat(ethers.formatUnits(balance, decimals));
    } catch (error: any) {
      console.error('Error getting RUM balance:', error);
      return 0;
    }
  }

  // Transferir RUM tokens
  async transferRUM(to: string, amount: number): Promise<string> {
    try {
      const tokenAbi = [
        'function transfer(address to, uint256 amount) returns (bool)',
        'function decimals() view returns (uint8)',
      ];

      const tokenContract = new ethers.Contract(
        this.RUM_TOKEN_ADDRESS,
        tokenAbi,
        this.wallet
      );

      const decimals = await tokenContract.decimals();
      const amountInWei = ethers.parseUnits(amount.toString(), decimals);

      const tx = await tokenContract.transfer(to, amountInWei);
      await tx.wait();

      return tx.hash;
    } catch (error: any) {
      console.error('Error transferring RUM:', error);
      throw error;
    }
  }

  // Procesar compra con cripto
  async processCryptoPurchase(
    userId: string,
    itemId: string,
    amount: number,
    currency: 'ETH' | 'USDT' | 'BTC' | 'RUM',
    txHash: string
  ): Promise<Purchase> {
    // Verificar transacción en blockchain
    const tx = await this.verifyTransaction(txHash);
    if (!tx || tx.status !== 'confirmed') {
      throw new Error('Transaction not confirmed');
    }

    const purchase: Purchase = {
      id: this.generateId(),
      userId,
      itemId,
      amount,
      currency,
      paymentMethod: 'crypto',
      txHash,
      status: 'completed',
      createdAt: new Date(),
    };

    // Guardar en base de datos
    // await PurchaseModel.create(purchase);

    // Aplicar item al usuario
    // await this.applyPurchaseToUser(userId, itemId);

    // Registrar transacción
    await this.recordTransaction({
      id: this.generateId(),
      userId,
      type: 'purchase',
      amount,
      currency: currency === 'ETH' ? 'ETH' : currency === 'USDT' ? 'USDT' : 'RUM',
      txHash,
      status: 'confirmed',
      createdAt: new Date(),
      confirmedAt: new Date(),
    });

    return purchase;
  }

  // Crear NFT de ficha especial
  async mintNFT(
    userId: string,
    name: string,
    description: string,
    imageUrl: string,
    attributes: any
  ): Promise<NFT> {
    try {
      const nftAbi = [
        'function mint(address to, string memory tokenURI) returns (uint256)',
      ];

      const nftContract = new ethers.Contract(
        this.NFT_CONTRACT_ADDRESS,
        nftAbi,
        this.wallet
      );

      // Crear metadata JSON
      const metadata = {
        name,
        description,
        image: imageUrl,
        attributes,
      };

      // Subir metadata a IPFS (usar servicio como Pinata)
      const tokenURI = await this.uploadToIPFS(metadata);

      // Mintear NFT
      const tx = await nftContract.mint(userId, tokenURI);
      const receipt = await tx.wait();

      // Obtener tokenId del evento
      const tokenId = receipt.logs[0].topics[3]; // Ajustar según tu contrato

      const nft: NFT = {
        id: this.generateId(),
        tokenId: tokenId.toString(),
        contractAddress: this.NFT_CONTRACT_ADDRESS,
        ownerId: userId,
        name,
        description,
        image: imageUrl,
        attributes,
        forSale: false,
        createdAt: new Date(),
      };

      // Guardar en base de datos
      // await NFTModel.create(nft);

      return nft;
    } catch (error: any) {
      console.error('Error minting NFT:', error);
      throw error;
    }
  }

  // Vender NFT en marketplace
  async listNFTForSale(
    nftId: string,
    price: number,
    currency: 'ETH' | 'RUM' | 'USDT'
  ): Promise<void> {
    // Implementar lógica de marketplace
    // Actualizar NFT en base de datos
    // await NFTModel.updateOne(
    //   { id: nftId },
    //   { $set: { forSale: true, price, currency } }
    // );
  }

  // Comprar NFT del marketplace
  async buyNFT(nftId: string, buyerId: string, txHash: string): Promise<void> {
    // Verificar transacción
    await this.verifyTransaction(txHash);

    // Transferir NFT
    // await this.transferNFT(nftId, buyerId);

    // Actualizar base de datos
    // await NFTModel.updateOne(
    //   { id: nftId },
    //   { 
    //     $set: { 
    //       ownerId: buyerId,
    //       forSale: false,
    //       price: undefined
    //     }
    //   }
    // );
  }

  // Obtener precio actual en cripto
  async getCryptoPrice(item: ShopItem): Promise<{
    ETH: number;
    USDT: number;
    RUM: number;
  }> {
    // Obtener precios actuales de exchanges
    // Usar API como CoinGecko o CoinMarketCap
    const ethPrice = 2500; // USD por ETH
    const usdtPrice = 1; // USD por USDT
    const rumPrice = 0.1; // USD por RUM (ejemplo)

    const priceInUSD = item.cryptoPrice?.amount || item.price;

    return {
      ETH: priceInUSD / ethPrice,
      USDT: priceInUSD / usdtPrice,
      RUM: priceInUSD / rumPrice,
    };
  }

  // Verificar transacción
  private async verifyTransaction(txHash: string): Promise<any> {
    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      if (!receipt) return null;
      return {
        hash: txHash,
        status: receipt.status === 1 ? 'confirmed' : 'failed',
        blockNumber: receipt.blockNumber,
      };
    } catch (error: any) {
      console.error('Error verifying transaction:', error);
      return null;
    }
  }

  // Registrar transacción
  private async recordTransaction(tx: CryptoTransaction): Promise<void> {
    // Guardar en base de datos
    // await CryptoTransactionModel.create(tx);
  }

  // Subir a IPFS
  private async uploadToIPFS(metadata: any): Promise<string> {
    // Usar servicio como Pinata o Infura IPFS
    // return `ipfs://${hash}`;
    return `ipfs://example-hash`;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
}

export const cryptoService = new CryptoService();
