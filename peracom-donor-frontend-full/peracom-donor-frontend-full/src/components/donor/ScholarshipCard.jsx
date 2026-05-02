function ScholarshipCard({ scholarship, onViewStudents }) {
  return (
    <div className="card scholarship-card">
      <div className="space-between">
        <h3>{scholarship.title || scholarship.name || 'Untitled Scholarship'}</h3>
        <span className={`status-badge status-${(scholarship.status || 'pending').toLowerCase()}`}>
          {scholarship.status || 'Pending'}
        </span>
      </div>
      <p>{scholarship.description || 'No description provided.'}</p>
      <p><strong>Funding:</strong> {scholarship.funding_amount ?? 'N/A'}</p>
      <p><strong>Students Count:</strong> {scholarship.students_count ?? 0}</p>
      {onViewStudents && (
        <button className="btn btn-secondary" onClick={() => onViewStudents(scholarship)}>
          View Approved Students
        </button>
      )}
    </div>
  );
}

export default ScholarshipCard;
