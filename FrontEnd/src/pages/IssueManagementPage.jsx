import React, { useState, useEffect, useMemo } from 'react';
import styles from './IssueManagementPage.module.css';
import { supabase } from '../services/supabaseClient'; // உன்னட Supabase கனெக்‌ஷன்

const IssueManagementPage = () => {
    const [issues, setIssues] = useState([]);
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [filterStatus, setFilterStatus] = useState('All');
    const [responseText, setResponseText] = useState('');

    // 1. Fetch Issues from Supabase
    const fetchIssues = async () => {
        const { data, error } = await supabase
            .from('issues')
            .select('*')
            .order('date', { ascending: false });

        if (error) {
            console.error('Error fetching issues:', error);
        } else {
            setIssues(data || []);
        }
    };

    // Load data when page loads
    useEffect(() => {
        fetchIssues();
    }, []);

    const handleSelectIssue = (issue) => {
        setSelectedIssue(issue);
        setResponseText(issue.admin_response || '');
    };

    // 2. Update Status to Supabase
    const handleStatusChange = async (e) => {
        const newStatus = e.target.value;

        const { error } = await supabase
            .from('issues')
            .update({ status: newStatus })
            .eq('id', selectedIssue.id);

        if (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status.');
        } else {
            const updatedIssues = issues.map(iss =>
                iss.id === selectedIssue.id ? { ...iss, status: newStatus } : iss
            );
            setIssues(updatedIssues);
            setSelectedIssue({ ...selectedIssue, status: newStatus });
        }
    };

    // 3. Update Admin Response to Supabase
    const handleResponseSubmit = async (e) => {
        e.preventDefault();

        const { error } = await supabase
            .from('issues')
            .update({ admin_response: responseText })
            .eq('id', selectedIssue.id);

        if (error) {
            console.error('Error sending response:', error);
            alert('Failed to send response.');
        } else {
            const updatedIssues = issues.map(iss =>
                iss.id === selectedIssue.id ? { ...iss, admin_response: responseText } : iss
            );
            setIssues(updatedIssues);
            setSelectedIssue({ ...selectedIssue, admin_response: responseText });
            alert(`Response securely sent to ${selectedIssue.reporter_name}.`);
        }
    };

    const filteredIssues = useMemo(() => {
        if (filterStatus === 'All') return issues;
        return issues.filter(iss => iss.status === filterStatus);
    }, [issues, filterStatus]);

    const totalOpen = issues.filter(i => i.status === 'Open').length;

    return (
        <div className={styles.peracomTheme}>
            <div className={styles.adminContainer} style={{ marginTop: '30px' }}>
                <header className={styles.pageHeader}>
                    <div>
                        <h2 className={styles.sectionTitle}>User Issue Management</h2>
                        <p className={styles.sectionSubtitle}>
                            Resolve system issues. You have <strong>{totalOpen}</strong> open issues requiring attention.
                        </p>
                    </div>
                </header>

                <div className={styles.dashboardLayout}>
                    <aside className={styles.issueListPanel}>
                        <div className={styles.listControls}>
                            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={styles.filterSelect}>
                                <option value="All">View All Tickets</option>
                                <option value="Open">Status: Open</option>
                                <option value="In Progress">Status: In Progress</option>
                                <option value="Resolved">Status: Resolved</option>
                            </select>
                        </div>
                        <div className={styles.issueList}>
                            {filteredIssues.length === 0 ? (
                                <p className={styles.noData}>No issues found.</p>
                            ) : (
                                filteredIssues.map(iss => (
                                    <div key={iss.id} className={`${styles.issueListItem} ${selectedIssue?.id === iss.id ? styles.activeItem : ''}`} onClick={() => handleSelectIssue(iss)}>
                                        <div className={styles.itemHeader}>
                                            <span className={styles.issueId}>{iss.id}</span>
                                            <span className={`${styles.statusBadge} ${styles[iss.status.replace(' ', '')]}`}>{iss.status}</span>
                                        </div>
                                        <h4 className={styles.itemTitle}>{iss.title}</h4>
                                        <p className={styles.itemReporter}>{iss.reporter_name} • {iss.reporter_role}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </aside>

                    <main className={styles.issueDetailPanel}>
                        {!selectedIssue ? (
                            <div className={styles.emptyDetailState}>
                                <h3>Select an issue from the left panel to review and resolve</h3>
                            </div>
                        ) : (
                            <div className={styles.detailContent}>
                                <div className={styles.detailHeader}>
                                    <h2>{selectedIssue.title}</h2>
                                    <div className={styles.metaData}>
                                        <span><strong>Reported by:</strong> {selectedIssue.reporter_name} ({selectedIssue.reporter_role})</span>
                                        <span><strong>Category:</strong> {selectedIssue.category}</span>
                                        <span><strong>Date Logged:</strong> {selectedIssue.date}</span>
                                        <span><strong>Priority:</strong> <span className={`${styles.priorityBadge} ${styles[selectedIssue.priority]}`}>{selectedIssue.priority}</span></span>
                                    </div>
                                </div>
                                <div className={styles.descriptionBox}>
                                    <h3>User's Description</h3>
                                    <p>{selectedIssue.description}</p>
                                </div>
                                <div className={styles.resolutionSection}>
                                    <h3>Admin Resolution Controls</h3>
                                    <div className={styles.statusUpdateGroup}>
                                        <label>Current Status:</label>
                                        <select value={selectedIssue.status} onChange={handleStatusChange} className={styles.statusDropdown}>
                                            <option value="Open">Open</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Resolved">Resolved</option>
                                        </select>
                                    </div>
                                    <form onSubmit={handleResponseSubmit} className={styles.responseForm}>
                                        <label>Official Response to User:</label>
                                        <textarea value={responseText} onChange={(e) => setResponseText(e.target.value)} placeholder="Type your resolution..." rows="5" required className={styles.responseTextarea} />
                                        <button type="submit" className={styles.submitBtn}>
                                            {selectedIssue.admin_response ? 'Update Response' : 'Send Response'}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default IssueManagementPage;