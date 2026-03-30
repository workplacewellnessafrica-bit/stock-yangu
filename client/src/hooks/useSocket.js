import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';
import { usePosStore } from '../stores/posStore';
import { useUIStore } from '../stores/uiStore';

let socket = null;

export function useSocket() {
  const { business, token } = useAuthStore();
  const { addSaleToFeed, updateItemStock: _ } = usePosStore();
  const { toast } = useUIStore();
  const connected = useRef(false);

  useEffect(() => {
    if (!business?.id || !token) return;
    if (connected.current) return;

    socket = io('/', {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      connected.current = true;
      socket.emit('join:business', business.id);
    });

    socket.on('disconnect', () => {
      connected.current = false;
    });

    socket.on('sale:new', ({ sale }) => {
      addSaleToFeed(sale);
      toast(`${sale.emoji} ${sale.itemName} — KES ${sale.total}`, 'success', 2500);
    });

    socket.on('sale:voided', ({ saleId }) => {
      // Handled by feed refetch
    });

    socket.on('expense:new', ({ expense }) => {
      toast(`💸 Expense: KES ${expense.amount} (${expense.category})`, 'info', 2500);
    });

    socket.on('day:finalized', ({ summary }) => {
      toast(`✅ Day closed. Profit: KES ${summary.profit.toFixed(0)}`, 'success', 5000);
    });

    return () => {
      socket?.disconnect();
      socket = null;
      connected.current = false;
    };
  }, [business?.id, token]);

  return socket;
}

export { socket };
