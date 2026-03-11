/**
 * New Bill Introduction Components
 * Highlights recently introduced bills with special UI
 */

import React from 'react';
import { useNewBills, useOrganizedBills, useNewBillNotification, useBillHighlight } from './syncHooks.newBills';
import './NewBillsComponents.css';

/**
 * NEW BILLS CAROUSEL
 * Shows the most recently introduced bills in an animated carousel
 */
export function NewBillsCarousel() {
  const { newBills, isSyncing } = useNewBills();
  const [activeIndex, setActiveIndex] = React.useState(0);

  React.useEffect(() => {
    if (newBills.length === 0) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % newBills.length);
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, [newBills.length]);

  if (newBills.length === 0) {
    return null;
  }

  const activeBill = newBills[activeIndex];
  const billData = activeBill.bill || activeBill;

  return (
    <div className="new-bills-carousel">
      <div className="carousel-badge">🆕 NEW INTRODUCTION</div>

      <div className="carousel-content">
        <h3 className="carousel-title">
          {billData.official_title || billData.title || 'Untitled Bill'}
        </h3>

        <div className="carousel-meta">
          <span className="bill-number">
            {billData.bill_id}
          </span>
          {activeBill.hoursOld && (
            <span className="bill-time">
              Introduced {activeBill.hoursOld}h ago
            </span>
          )}
        </div>

        <p className="carousel-summary">
          {billData.summary || 'A bill introduced to Congress'}
        </p>

        <div className="carousel-sponsor">
          <span className="sponsor-label">Sponsor:</span>
          <span className="sponsor-name">
            {billData.sponsor_name || 'Unknown'}
          </span>
        </div>

        <a href={`/bill/${billData.bill_id}`} className="carousel-link">
          View Full Bill →
        </a>
      </div>

      <div className="carousel-controls">
        {newBills.map((_, index) => (
          <button
            key={index}
            className={`carousel-dot ${index === activeIndex ? 'active' : ''}`}
            onClick={() => setActiveIndex(index)}
            aria-label={`View bill ${index + 1}`}
          />
        ))}
      </div>

      {isSyncing && <div className="carousel-syncing">⟳ Checking for new bills...</div>}
    </div>
  );
}

/**
 * NEW BILL BADGE
 * Small badge to show on any bill card if it's newly introduced
 */
export function NewBillBadge({ billId, hoursOld }) {
  const isNew = React.useMemo(
    () => syncService.isNewBill(billId),
    [billId]
  );

  if (!isNew) return null;

  return (
    <div className="new-bill-badge">
      <span className="badge-icon">✨</span>
      <span className="badge-text">New</span>
      {hoursOld !== undefined && (
        <span className="badge-time">{hoursOld}h ago</span>
      )}
    </div>
  );
}

/**
 * ORGANIZED BILL LIST
 * Shows new bills first, then other bills
 * Automatically highlights new introductions
 */
export function OrganizedBillsList({ allBills, onBillSelect }) {
  const { newBills, otherBills } = useOrganizedBills(allBills);

  return (
    <div className="organized-bills">
      {/* New Bills Section */}
      {newBills.length > 0 && (
        <div className="bills-section new-bills-section">
          <div className="section-header">
            <h3>🆕 Recently Introduced</h3>
            <span className="section-count">{newBills.length}</span>
          </div>

          <div className="bills-list">
            {newBills.map((bill) => (
              <BillListItem
                key={bill.bill?.bill_id || bill.bill_id}
                bill={bill}
                isNew={true}
                onSelect={() => onBillSelect(bill)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Other Bills Section */}
      {otherBills.length > 0 && (
        <div className="bills-section other-bills-section">
          <div className="section-header">
            <h3>All Legislation</h3>
            <span className="section-count">{otherBills.length}</span>
          </div>

          <div className="bills-list">
            {otherBills.slice(0, 20).map((bill) => (
              <BillListItem
                key={bill.bill?.bill_id || bill.bill_id}
                bill={bill}
                isNew={false}
                onSelect={() => onBillSelect(bill)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * BILL LIST ITEM
 * Individual bill in a list with new badge if applicable
 */
function BillListItem({ bill, isNew, onSelect }) {
  const billData = bill.bill || bill;

  return (
    <button
      className={`bill-list-item ${isNew ? 'is-new' : ''}`}
      onClick={onSelect}
    >
      <div className="item-left">
        {isNew && (
          <span className="new-indicator">
            <span className="pulse"></span>
          </span>
        )}
        <div className="item-content">
          <h4 className="item-title">
            {billData.official_title || billData.title}
          </h4>
          <p className="item-meta">
            <span className="bill-id">{billData.bill_id}</span>
            {billData.sponsor_name && (
              <span className="bill-sponsor">{billData.sponsor_name}</span>
            )}
          </p>
        </div>
      </div>

      <div className="item-right">
        <span className={`status-badge status-${billData.bill_status || 'unknown'}`}>
          {billData.bill_status || 'Introduced'}
        </span>
        {isNew && (
          <span className="new-badge">NEW</span>
        )}
      </div>
    </button>
  );
}

/**
 * NEW BILLS NOTIFICATION TOAST
 * Shows when new bills are introduced
 */
export function NewBillsNotification() {
  const notification = useNewBillNotification();

  if (!notification) return null;

  return (
    <div className="new-bills-notification">
      <div className="notification-icon">⚡</div>
      <div className="notification-content">
        <div className="notification-title">New Bills Introduced!</div>
        <div className="notification-message">
          {notification.count} bill{notification.count > 1 ? 's' : ''} just added to Congress
        </div>
      </div>
      <a href="#new-bills" className="notification-action">View →</a>
    </div>
  );
}

/**
 * REAL-TIME BILL COUNTER
 * Shows how many new bills have been introduced
 * Updates in real-time
 */
export function RealTimeBillCounter() {
  const { newBills } = useNewBills();

  if (newBills.length === 0) {
    return (
      <div className="bill-counter idle">
        <span className="counter-icon">📋</span>
        <div className="counter-content">
          <div className="counter-label">New Bills</div>
          <div className="counter-value">0</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bill-counter active">
      <span className="counter-icon">✨</span>
      <div className="counter-content">
        <div className="counter-label">New This 24h</div>
        <div className="counter-value">{newBills.length}</div>
      </div>
    </div>
  );
}

/**
 * BILL GRID WITH HIGHLIGHTS
 * Display bills in a grid with special styling for new introductions
 */
export function BillGridWithHighlights({ bills = [], limit = 12 }) {
  const { isHighlighted } = useBillHighlight();

  return (
    <div className="bill-grid">
      {bills.slice(0, limit).map((bill) => {
        const billId = bill.bill?.bill_id || bill.bill_id;
        const isNew = isHighlighted(billId);
        const billData = bill.bill || bill;

        return (
          <div
            key={billId}
            className={`bill-grid-item ${isNew ? 'is-new' : ''}`}
          >
            {isNew && (
              <div className="grid-item-badge">
                <span className="badge-shine"></span>
                NEW
              </div>
            )}

            <h3 className="grid-item-title">
              {billData.official_title || billData.title}
            </h3>

            <div className="grid-item-meta">
              <span className="bill-id">{billId}</span>
            </div>

            <div className="grid-item-footer">
              <span className={`status status-${billData.bill_status || 'unknown'}`}>
                {billData.bill_status || 'Introduced'}
              </span>
              {isNew && <span className="shine-effect"></span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
