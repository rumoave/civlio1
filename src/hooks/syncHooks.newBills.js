/**
 * Enhanced React Hooks for New Bill Introductions
 * Specific hooks for highlighting and tracking newly introduced bills
 */

import { useEffect, useState, useCallback } from 'react';
import syncService from './syncService.enhanced';

/**
 * Hook to get newly introduced bills (last 24 hours)
 * These bills get special highlighting and prominence
 */
export function useNewBills() {
  const [newBills, setNewBills] = useState([]);
  const [billsSync, setBillsSync] = useState(null);

  useEffect(() => {
    // Subscribe to bill updates
    const unsubscribe = syncService.subscribe(event => {
      if (event.type === 'bills') {
        // Get the new bills from the service
        const fresh = syncService.getNewBills();
        setNewBills(fresh);
        setBillsSync(event.syncState);
      }
    });

    // Get initial new bills
    const initial = syncService.getNewBills();
    setNewBills(initial);

    return unsubscribe;
  }, []);

  return { newBills, isSyncing: billsSync?.isSyncing };
}

/**
 * Hook to check if a specific bill is newly introduced
 */
export function useIsNewBill(billId) {
  const [isNew, setIsNew] = useState(() => syncService.isNewBill(billId));

  useEffect(() => {
    const unsubscribe = syncService.subscribe(event => {
      if (event.type === 'bills') {
        setIsNew(syncService.isNewBill(billId));
      }
    });

    return unsubscribe;
  }, [billId]);

  return isNew;
}

/**
 * Hook to filter bills and separate new vs existing
 * Returns organized data: { newBills: [], otherBills: [] }
 */
export function useOrganizedBills(allBills) {
  const [organized, setOrganized] = useState({
    newBills: [],
    otherBills: [],
  });

  useEffect(() => {
    if (!allBills || allBills.length === 0) {
      setOrganized({ newBills: [], otherBills: [] });
      return;
    }

    const newBillIds = new Set(syncService.getNewBills().map(b => b.bill_id));

    const organized = {
      newBills: allBills.filter(bill => {
        const billId = bill.bill?.bill_id || bill.bill_id;
        return newBillIds.has(billId);
      }),
      otherBills: allBills.filter(bill => {
        const billId = bill.bill?.bill_id || bill.bill_id;
        return !newBillIds.has(billId);
      }),
    };

    setOrganized(organized);
  }, [allBills]);

  return organized;
}

/**
 * Hook for new bill notifications
 * Triggers when new bills are introduced
 */
export function useNewBillNotification() {
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const unsubscribe = syncService.subscribe(event => {
      if (event.type === 'bills' && event.changes?.summary?.newIntroductions > 0) {
        setNotification({
          count: event.changes.summary.newIntroductions,
          timestamp: new Date(),
        });

        // Auto-dismiss after 6 seconds
        const timer = setTimeout(() => {
          setNotification(null);
        }, 6000);

        return () => clearTimeout(timer);
      }
    });

    return unsubscribe;
  }, []);

  return notification;
}

/**
 * Hook to highlight newly introduced bills in a list
 * Returns a function to check if a bill should be highlighted
 */
export function useBillHighlight() {
  const [highlightedBills, setHighlightedBills] = useState(new Set());

  useEffect(() => {
    const unsubscribe = syncService.subscribe(event => {
      if (event.type === 'bills') {
        const newIds = new Set(
          syncService.getNewBills().map(b => b.bill_id)
        );
        setHighlightedBills(newIds);
      }
    });

    return unsubscribe;
  }, []);

  const isHighlighted = useCallback(
    (billId) => highlightedBills.has(billId),
    [highlightedBills]
  );

  return { isHighlighted, highlightedBills };
}
