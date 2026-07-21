function EmptyState({ title = 'No data found', description = '' }) {
  return (
    <div className="empty-state card">
      <h3>{title}</h3>
      {description && <p>{description}</p>}
    </div>
  );
}

export default EmptyState;
