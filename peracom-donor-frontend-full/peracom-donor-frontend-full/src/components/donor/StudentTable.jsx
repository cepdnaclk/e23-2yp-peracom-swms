import { Link } from 'react-router-dom';

function StudentTable({ students = [] }) {
  return (
    <div className="table-wrap card">
      <table className="data-table">
        <thead>
          <tr>
            <th>Student Name</th>
            <th>Registration No</th>
            <th>Batch</th>
            <th>Scholarship</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id || student.student_id}>
              <td>{student.student_name || student.full_name || 'N/A'}</td>
              <td>{student.registration_no || student.student_id || 'N/A'}</td>
              <td>{student.batch || 'N/A'}</td>
              <td>{student.scholarship_title || student.scholarship_name || 'N/A'}</td>
              <td>
                <span className={`status-badge status-${(student.status || 'approved').toLowerCase()}`}>
                  {student.status || 'Approved'}
                </span>
              </td>
              <td>
                <Link className="btn btn-link" to={`/students/${student.student_id || student.id}`}>
                  View Profile
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default StudentTable;
