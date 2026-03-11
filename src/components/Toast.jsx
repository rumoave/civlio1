/**
 * Toast Component for Civly Sync Notifications
 */

import React from 'react';
import { useNotificationListener } from './syncHooks';
import './Toast.css';

export function Toast() {
  const { notification, dismiss } = useNotificationListener();

  if (!notification) return null;

  const icons = {
    bills: '📋',
    members: '👥',
    scotus: '⚖️',
  };

  const titles = {
    bills: 'Bill Updates',
    members: 'Member Updates',
    scotus: 'SCOTUS Updates',
  };

  return (
    <div className="toast-container">
      <div className={`toast toast-${notification.type}`}>
        <div className="toast-icon">{icons[notification.type]}</div>
        <div className="toast-content">
          <div className="toast-title">{titles[notification.type]}</div>
          <div className="toast-message">{notification.message}</div>
        </div>
        <button className="toast-close" onClick={dismiss}>
          ✕
        </button>
      </div>
    </div>
  );
}
