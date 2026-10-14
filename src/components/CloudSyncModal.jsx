import React from 'react';
import GoogleSheetsSyncModal from './GoogleSheetsSyncModal';

/**
 * CloudSyncModal (Forwarder to GoogleSheetsSyncModal)
 * Upgraded from legacy database setup to Bring Your Own Database (BYOD) Google Sheets sync.
 */
export default function CloudSyncModal(props) {
  return <GoogleSheetsSyncModal {...props} />;
}
