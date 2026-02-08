import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { ShopItem } from '../../../shared/types';
import { Loader2, CheckCircle2, XCircle, Wallet, Coins } from 'lucide-react';

interface CryptoPurchaseProps {
  item: ShopItem;
  onComplete: (txHash: string) => void;
  onCancel: () => void;
}

export default function CryptoPurchase({ item, onComplete, onCancel }: CryptoPurchaseProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<'ETH' | 'USDT' | 'RUM'>('RUM');
  const [prices, setPrices] = useState({ ETH: 0, USDT: 0, RUM: 0 });
  const [loading, setLoading] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  useEffect(() => {
    loadPrices();
    checkWallet();
  }, []);

  const checkWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      const prov = new ethers.BrowserProvider(window.ethereum);
      setProvider(prov);
      
      try {
        const accounts = await prov.listAccounts();
        if (accounts.length > 0) {
          setWalletConnected(true);
          setWalletAddress(accounts[0].address);
        }
      } catch (error) {
        console.error('Error checking wallet:', error);
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const prov = new ethers.BrowserProvider(window.ethereum);
        await prov.send('eth_requestAccounts', []);
        const signer = await prov.getSigner();
        const address = await signer.getAddress();
        
        setProvider(prov);
        setWalletConnected(true);
        setWalletAddress(address);
      } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Error conectando la billetera');
      }
    } else {
      alert('Por favor instala MetaMask');
    }
  };

  const loadPrices = async () => {
    try {
      const response = await fetch('/api/crypto/price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      const data = await response.json();
      if (data.success) {
        setPrices(data.prices);
      }
    } catch (error) {
      console.error('Error loading prices:', error);
    }
  };

  const handlePurchase = async () => {
    if (!walletConnected || !provider) {
      alert('Por favor conecta tu billetera primero');
      return;
    }

    setLoading(true);
    setStatus('processing');

    try {
      const signer = await provider.getSigner();
      const amount = prices[selectedCurrency];

      let txHash = '';

      if (selectedCurrency === 'ETH') {
        // Transferir ETH
        const tx = await signer.sendTransaction({
          to: process.env.VITE_PAYMENT_ADDRESS || '0x...',
          value: ethers.parseEther(amount.toString()),
        });
        await tx.wait();
        txHash = tx.hash;
      } else if (selectedCurrency === 'USDT' || selectedCurrency === 'RUM') {
        // Transferir token ERC-20
        const tokenAddress = selectedCurrency === 'RUM' 
          ? process.env.VITE_RUM_TOKEN_ADDRESS 
          : process.env.VITE_USDT_ADDRESS;

        const tokenAbi = [
          'function transfer(address to, uint256 amount) returns (bool)',
          'function decimals() view returns (uint8)',
        ];

        const tokenContract = new ethers.Contract(tokenAddress!, tokenAbi, signer);
        const decimals = await tokenContract.decimals();
        const amountInWei = ethers.parseUnits(amount.toString(), decimals);

        const tx = await tokenContract.transfer(
          process.env.VITE_PAYMENT_ADDRESS || '0x...',
          amountInWei
        );
        await tx.wait();
        txHash = tx.hash;
      }

      // Registrar compra en el backend
      const response = await fetch('/api/crypto/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          userId: localStorage.getItem('userId'),
          itemId: item.id,
          amount: amount,
          currency: selectedCurrency,
          txHash,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setStatus('success');
        setTimeout(() => {
          onComplete(txHash);
        }, 2000);
      } else {
        throw new Error(data.error || 'Error procesando la compra');
      }
    } catch (error: any) {
      console.error('Error purchasing:', error);
      setStatus('error');
      alert(error.message || 'Error procesando la compra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Comprar con Cripto</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircle size={24} />
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-gray-100 rounded-lg p-4 mb-4">
            <img
              src={item.image}
              alt={item.name}
              className="w-24 h-24 object-cover rounded-lg mx-auto mb-4"
            />
            <h3 className="text-xl font-semibold text-center">{item.name}</h3>
            <p className="text-gray-600 text-center text-sm">{item.description}</p>
          </div>

          {!walletConnected ? (
            <button
              onClick={connectWallet}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              <Wallet size={20} />
              Conectar Billetera
            </button>
          ) : (
            <div className="mb-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-green-800">
                  <CheckCircle2 size={16} className="inline mr-2" />
                  Conectado: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecciona criptomoneda:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['ETH', 'USDT', 'RUM'] as const).map((currency) => (
                    <button
                      key={currency}
                      onClick={() => setSelectedCurrency(currency)}
                      className={`py-3 px-4 rounded-lg border-2 font-semibold transition ${
                        selectedCurrency === currency
                          ? 'border-blue-600 bg-blue-50 text-blue-600'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <Coins size={20} className="mx-auto mb-1" />
                      {currency}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Precio:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {prices[selectedCurrency].toFixed(4)} {selectedCurrency}
                  </span>
                </div>
              </div>

              {status === 'success' ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle2 size={24} />
                    <span className="font-semibold">¡Compra exitosa!</span>
                  </div>
                </div>
              ) : status === 'error' ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 text-red-800">
                    <XCircle size={24} />
                    <span className="font-semibold">Error en la compra</span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handlePurchase}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Wallet size={20} />
                      Comprar ahora
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
