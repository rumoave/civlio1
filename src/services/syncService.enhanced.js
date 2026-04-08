/**
 * ENHANCED Real-time Sync Service for Civly
 * Improved new bill detection and real-time introductions
 */

const SYNC_INTERVALS = {
  bills: 2.5 * 60 * 1000, // 2.5 minutes - fast for catching new introductions
  members: 3 * 60 * 1000, // 3 minutes
  scotus: 4 * 60 * 1000, // 4 minutes
};

const API_BASE = 'https://api.congress.gov/v3';
const API_KEY = process.env.REACT_APP_CONGRESS_API_KEY;

class EnhancedSyncService {
  constructor() {
    this.timers = {};
    this.syncStates = {
      bills: { lastSync: null, isSyncing: false, data: [], newBills: [] },
      members: { lastSync: null, isSyncing: false, data: [] },
      scotus: { lastSync: null, isSyncing: false, data: [] },
    };
    this.listeners = new Set();
    this.previousData = {
      bills: [],
      members: [],
      scotus: [],
    };
    this.userSubscription = null;
    this.newBillHistory = new Map(); // Track newly introduced bills
  }

  /**
   * Initialize sync service with user subscription status
   */
  initialize(isSubscribed = false) {
    this.userSubscription = isSubscribed;
    console.log(`Sync service initialized. Premium user: ${isSubscribed}`);
  }

  /**
   * Subscribe to sync updates
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of sync state changes
   */
  notifyListeners(syncType, data, changesSummary = null) {
    const event = {
      type: syncType,
      timestamp: new Date(),
      data,
      changes: changesSummary,
      syncState: this.syncStates[syncType],
      newItems: this.syncStates[syncType].newBills, // For bills specifically
    };
    this.listeners.forEach(callback => callback(event));
  }

  /**
   * Start background syncing for home page
   */
  startHomeSync() {
    this.startSync('bills');
    this.startSync('members');
  }

  /**
   * Start sync for a specific data type
   */
  startSync(syncType) {
    if (this.timers[syncType]) {
      return;
    }

    // Immediate first sync
    this.performSync(syncType);

    // Set up interval
    this.timers[syncType] = setInterval(
      () => this.performSync(syncType),
      SYNC_INTERVALS[syncType]
    );

    console.log(`Started ${syncType} sync (interval: ${SYNC_INTERVALS[syncType]}ms)`);
  }

  /**
   * Stop sync for a specific data type
   */
  stopSync(syncType) {
    if (this.timers[syncType]) {
      clearInterval(this.timers[syncType]);
      delete this.timers[syncType];
    }
  }

  /**
   * Stop all syncing
   */
  stopAllSync() {
    Object.keys(this.timers).forEach(syncType => this.stopSync(syncType));
  }

  /**
   * Perform actual data sync
   */
  async performSync(syncType) {
    if (this.syncStates[syncType].isSyncing) {
      return;
    }

    this.syncStates[syncType].isSyncing = true;
    this.notifyListeners(syncType, null);

    try {
      let newData = [];

      switch (syncType) {
        case 'bills':
          newData = await this.fetchBills();
          break;
        case 'members':
          newData = await this.fetchMembers();
          break;
        case 'scotus':
          newData = await this.fetchSCOTUS();
          break;
      }

      // Detect changes
      const changesSummary = this.detectChanges(syncType, newData);

      // For bills, extract and highlight new bills
      if (syncType === 'bills') {
        this.processBillIntroductions(newData, changesSummary);
      }

      // Update state
      this.syncStates[syncType].data = newData;
      this.syncStates[syncType].lastSync = new Date();
      this.syncStates[syncType].isSyncing = false;
      this.previousData[syncType] = JSON.parse(JSON.stringify(newData));

      // Notify subscribers
      this.notifyListeners(syncType, newData, changesSummary);
      this.handleNotifications(syncType, changesSummary);

    } catch (error) {
      console.error(`Sync error for ${syncType}:`, error);
      this.syncStates[syncType].isSyncing = false;
      this.notifyListeners(syncType, null, { error: error.message });
    }
  }

  /**
   * Process newly introduced bills
   * Marks them as new and tracks introduction date
   */
  processBillIntroductions(newData, changesSummary) {
    const now = new Date();
    const newBills = [];

    // Get list of newly added bill IDs from change summary
    const previousIds = new Set(
      this.previousData.bills.map(item => item.bill?.bill_id)
    );

    newData.forEach(billItem => {
      const billId = billItem.bill?.bill_id;
      
      if (!previousIds.has(billId) && billId) {
        // This is a newly introduced bill
        const bill = billItem.bill || billItem;
        
        // Check if we've already tracked this bill's introduction
        if (!this.newBillHistory.has(billId)) {
          // Mark as "new" for the next 24 hours
          this.newBillHistory.set(billId, {
            introducedAt: now,
            bill: bill,
            expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24 hour highlight
          });

          newBills.push({
            ...billItem,
            isNewIntroduction: true,
            introducedAt: now,
          });
        }
      }
    });

    // Clean up old entries from history (older than 24 hours)
    for (const [billId, entry] of this.newBillHistory.entries()) {
      if (entry.expiresAt < now) {
        this.newBillHistory.delete(billId);
      }
    }

    // Update sync state with new bills
    this.syncStates.bills.newBills = Array.from(this.newBillHistory.values()).map(
      entry => entry.bill
    );

    console.log(`Found ${newBills.length} newly introduced bills`);
  }

  /**
   * Get newly introduced bills (highlighted for the last 24 hours)
   */
  getNewBills() {
    return Array.from(this.newBillHistory.values())
      .filter(entry => entry.expiresAt > new Date())
      .map(entry => ({
        ...entry.bill,
        isNew: true,
        hoursOld: Math.round(
          (new Date() - entry.introducedAt) / (1000 * 60 * 60)
        ),
      }));
  }

  /**
   * Check if a bill is newly introduced
   */
  isNewBill(billId) {
    const entry = this.newBillHistory.get(billId);
    return entry && entry.expiresAt > new Date();
  }

  /**
   * Fetch bills from Congress API
   * Sorted by introduction date (newest first)
   */
  async fetchBills() {
    try {
      const response = await fetch(
        `${API_BASE}/bills?congress=119&limit=250&sort=-introduced_date&api_key=${API_KEY}`
      );
      if (!response.ok) throw new Error(`Bills API error: ${response.status}`);
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Bills fetch error:', error);
      // Return cached data if available
      return this.previousData.bills;
    }
  }

  /**
   * Fetch members from Congress API
   */
  async fetchMembers() {
    try {
      const response = await fetch(
        `${API_BASE}/members?limit=500&api_key=${API_KEY}`
      );
      if (!response.ok) throw new Error(`Members API error: ${response.status}`);
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Members fetch error:', error);
      return this.previousData.members;
    }
  }

  /**
   * Fetch SCOTUS cases
   */
  async fetchSCOTUS() {
    try {
      const response = await fetch(
        'https://api.propublica.org/congress/v1/us/courts/scotus/2024/opinions.json',
        {
          headers: {
            'X-API-Key': process.env.REACT_APP_PROPUBLICA_API_KEY || '',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.results || [];
      }

      return this.previousData.scotus;
    } catch (error) {
      console.error('SCOTUS fetch error:', error);
      return this.previousData.scotus;
    }
  }

  /**
   * Detect what changed between syncs
   */
  detectChanges(syncType, newData) {
    const previousData = this.previousData[syncType] || [];

    const previousIds = new Set(previousData.map(item => item.bill?.bill_id || item.member_id));
    const newIds = new Set(newData.map(item => item.bill?.bill_id || item.member_id));

    // Find additions and removals
    const added = newData.filter(item => {
      const id = item.bill?.bill_id || item.member_id;
      return !previousIds.has(id);
    });

    const removed = previousData.filter(item => {
      const id = item.bill?.bill_id || item.member_id;
      return !newIds.has(id);
    });

    // For bills, detect status changes
    let statusChanges = [];
    if (syncType === 'bills') {
      statusChanges = this.detectBillStatusChanges(previousData, newData);
    }

    return {
      totalItems: newData.length,
      added: added.length,
      removed: removed.length,
      statusChanges: statusChanges.length,
      newBillsCount: syncType === 'bills' ? added.length : 0,
      summary: {
        addedCount: added.length,
        removedCount: removed.length,
        statusChangeCount: statusChanges.length,
        newIntroductions: syncType === 'bills' ? added.length : 0,
      },
    };
  }

  /**
   * Detect bills that changed status
   */
  detectBillStatusChanges(previousData, newData) {
    const changes = [];

    previousData.forEach(prevBill => {
      const newBill = newData.find(
        b => b.bill?.bill_id === prevBill.bill?.bill_id
      );

      if (newBill && prevBill.bill?.bill_status !== newBill.bill?.bill_status) {
        changes.push({
          billId: prevBill.bill?.bill_id,
          previousStatus: prevBill.bill?.bill_status,
          newStatus: newBill.bill?.bill_status,
        });
      }
    });

    return changes;
  }

  /**
   * Handle user notifications based on subscription
   */
  handleNotifications(syncType, changesSummary) {
    // Only notify premium subscribers
    if (!this.userSubscription) {
      return;
    }

    // Only notify if there are significant changes
    if (!changesSummary || (changesSummary.added === 0 && changesSummary.statusChanges === 0)) {
      return;
    }

    this.sendNotification(syncType, changesSummary);
  }

  /**
   * Send notification to user
   */
  sendNotification(syncType, changesSummary) {
    let message = '';

    if (syncType === 'bills') {
      message = `${changesSummary.added} new bill${changesSummary.added > 1 ? 's' : ''} introduced`;
      if (changesSummary.statusChanges > 0) {
        message += `, ${changesSummary.statusChanges} status update${changesSummary.statusChanges > 1 ? 's' : ''}`;
      }
    } else if (syncType === 'members') {
      message = `${changesSummary.added} member change${changesSummary.added > 1 ? 's' : ''} detected`;
    } else if (syncType === 'scotus') {
      message = `${changesSummary.added} new SCOTUS opinion${changesSummary.added > 1 ? 's' : ''}`;
    }

    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Civlio Update', {
        body: message,
        icon: '/civlio-icon.png',
        tag: `civlio-${syncType}-${Date.now()}`,
      });
    }

    // Dispatch custom event for in-app toast
    window.dispatchEvent(
      new CustomEvent('civly-notification', {
        detail: { type: syncType, message },
      })
    );
  }

  /**
   * Request notification permission
   */
  static requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  /**
   * Get current sync state
   */
  getSyncState(syncType) {
    return this.syncStates[syncType];
  }

  /**
   * Get all sync states
   */
  getAllSyncStates() {
    return this.syncStates;
  }

  /**
   * Manually trigger sync
   */
  manualSync(syncType) {
    return this.performSync(syncType);
  }
}

// Export singleton instance
export default new EnhancedSyncService();
