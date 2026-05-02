function ProgressUpdateCard({ update, isExpanded, onToggle }) {
  return (
    <div className="card progress-card">
      <div className="space-between">
        <div>
          <h3>{update.student_name || 'Student Progress'}</h3>
          <p className="muted">{update.scholarship_title || update.scholarship_name || 'Scholarship not specified'}</p>
        </div>
        <span className="muted">{update.update_date || update.date || 'N/A'}</span>
      </div>

      <p><strong>Summary:</strong> {update.summary || 'No summary available.'}</p>

      <button className="btn btn-secondary" onClick={onToggle}>
        {isExpanded ? 'Hide Details' : 'View Details'}
      </button>

      {isExpanded && (
        <div className="progress-details">
          <p><strong>Full Report:</strong> {update.full_report || 'No full report available.'}</p>
          <p><strong>GPA:</strong> {update.gpa ?? 'N/A'}</p>
          <p><strong>Achievements:</strong> {update.achievements || 'No achievements recorded.'}</p>
          <p><strong>Attachment:</strong> {update.attachment_url ? <a href={update.attachment_url} target="_blank" rel="noreferrer">View Attachment</a> : 'No attachment'}</p>
        </div>
      )}
    </div>
  );
}

export default ProgressUpdateCard;
