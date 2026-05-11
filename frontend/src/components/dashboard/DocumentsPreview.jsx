import React from 'react';
import styles from './DocumentsPreview.module.css';

const getFileTypeName = (key) => {
  switch (key) {
    case 'id_card_url':
      return 'ID Card';
    case 'income_certificate_url':
      return 'Income Certificate';
    case 'bank_account_url':
      return 'Bank Account';
    default:
      return 'Document';
  }
};

const basename = (url) => {
  if (!url) return '';
  try {
    const parts = url.split('/');
    return decodeURIComponent(parts[parts.length - 1].split('?')[0]);
  } catch (e) {
    return url;
  }
};

const DocumentsPreview = ({ documents }) => {
  if (!documents || Object.keys(documents).length === 0) {
    return (
      <div className={styles.card}>
        <h3 className={styles.title}>Uploaded Documents</h3>
        <p>No documents have been uploaded for this application.</p>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Uploaded Documents</h3>
      <ul className={styles.docList}>
        {Object.entries(documents).map(([key, url]) => (
          url && (
            <li key={key} className={styles.docItem}>
              <span className={styles.docName}>{getFileTypeName(key)}</span>
              <a href={url} target="_blank" rel="noopener noreferrer" className={styles.docLink}>
                View File
              </a>
            </li>
          )
        ))}
      </ul>
    </div>
  );
};

export default DocumentsPreview;
