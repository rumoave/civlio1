/**
 * Sync Status Indicator Component
 * Shows sync status and last update time
 */

import React from 'react';
import { useSyncStatus, useLastSyncTime } from './syncHooks';
import './SyncIndicator.css';

export function SyncIndicator({ syncType, compact = false }) {
  const syncState = useSyncStatus(syncType);
  const timeAgo = useLastSyncTime(syncType);

  if (compact) {
    return (
      <div className="sync-indicator-compact">
        <div className={`sync-dot ${syncState.isSyncing ? 'syncing' : 'idle'}`} />
        <span className="sync-time">{timeAgo}</span>
      </div>
    );
  }

  return (
    <div className="sync-indicator-full">
      <div className="sync-status">
        <div className={`sync-dot ${syncState.isSyncing ? 'syncing' : 'idle'}`} />
        <div className="sync-info">
          <div className="sync-label">
            {syncState.isSyncing ? 'Syncing...' : 'Updated'}
          </div>
          <div className="sync-time">{timeAgo}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Sync status badge for tab navigation
 */
export function SyncBadge({ syncType, showChanges = true }) {
  const syncState = useSyncStatus(syncType);
  const [changeCount, setChangeCount] = React.useState(0);

  React.useEffect(() => {
    if (showChanges && syncState.changes?.summary) {
      const count =
        (syncState.changes.summary.addedCount || 0) +
        (syncState.changes.summary.statusChangeCount || 0);
      setChangeCount(count);
    }
  }, [syncState.changes, showChanges]);

  if (changeCount === 0) return null;

  return <div className="sync-badge">{changeCount}</div>;
}

/**
 * Full page sync status panel
 */
export function SyncStatusPanel() {
  const billsStatus = useSyncStatus('bills');
  const membersStatus = useSyncStatus('members');
  const scotusStatus = useSyncStatus('scotus');

  const billsTime = useLastSyncTime('bills');
  const membersTime = useLastSyncTime('members');
  const scotusTime = useLastSyncTime('scotus');

  const statusItems = [
    { type: 'Bills', status: billsStatus, time: billsTime },
    { type: 'Members', status: membersStatus, time: membersTime },
    { type: 'SCOTUS', status: scotusStatus, time: scotusTime },
  ];

  return (
    <div className="sync-status-panel">
      <div className="sync-panel-header">
        <h3>Sync Status</h3>
        <p>Real-time data synchronization</p>
      </div>
      <div className="sync-panel-items">
        {statusItems.map(item => (
          <div key={item.type} className="sync-panel-item">
            <div className="sync-panel-name">{item.type}</div>
            <div className="sync-panel-status">
              <div className={`sync-dot ${item.status.isSyncing ? 'syncing' : 'idle'}`} />
              <span>{item.status.isSyncing ? 'Syncing' : 'Live'}</span>
            </div>
            <div className="sync-panel-time">{item.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
