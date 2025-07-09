import { useState, useEffect } from 'react';
import { agentService } from '../services/agent';
import { useAuth } from './useAuth';

export const useTokens = () => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  const fetchBalance = async () => {
    if (!isAuthenticated || !agentService.token) return;
    
    try {
      const currentBalance = await agentService.token.get_balance();
      setBalance(currentBalance);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  const fetchTransactions = async () => {
    if (!isAuthenticated || !agentService.token) return;
    
    try {
      const history = await agentService.token.get_transaction_history();
      setTransactions(history);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated) {
        setBalance(0);
        setTransactions([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      await Promise.all([fetchBalance(), fetchTransactions()]);
      setIsLoading(false);
    };

    fetchData();
  }, [isAuthenticated]);

  const transferTokens = async (to: string, amount: number, memo: string = '') => {
    if (!agentService.token) throw new Error('Token service not available');
    
    try {
      const transaction = await agentService.token.transfer_tokens(to, amount, memo);
      
      // Refresh balance and transactions
      await fetchBalance();
      await fetchTransactions();
      
      return transaction;
    } catch (error) {
      console.error('Transfer failed:', error);
      throw error;
    }
  };

  const refreshData = async () => {
    if (isAuthenticated) {
      await Promise.all([fetchBalance(), fetchTransactions()]);
    }
  };

  return {
    balance,
    transactions,
    isLoading,
    transferTokens,
    refreshData,
    fetchBalance
  };
};