import React, { useState } from 'react';
import styles from './IssueReportingPage.module.css';
import { supabase } from '../services/supabaseClient'; // உன்னட Supabase கனெக்‌ஷன்

const IssueReportingPage = () => {
    // State to manage form inputs
    const [formData, setFormData] = useState({
        title: '',
        category: 'System Bug',
        description: '',
        attachment: null
    });

    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        setFormData(prevState => ({
            ...prevState,
            attachment: e.target.files[0]
        }));
    };

    // Handle form submission to Supabase
    const handleSubmit = async (e) => {
        e.preventDefault();

        const newIssue = {
            id: `ISS-${Date.now()}`,
            reporter_name: 'Test Student',
            reporter_role: 'Student (E/23)',
            category: formData.category,
            title: formData.title,
            description: formData.description,
            status: 'Open',
            priority: 'Normal',
            date: new Date().toISOString().split('T')[0],
            admin_response: null
        };

        const { error } = await supabase
            .from('issues')
            .insert([newIssue]);

        if (error) {
            console.error('Error reporting issue:', error);
            alert('Something went wrong. Could not submit the issue.');
        } else {
            setIsSubmitted(true);
            setTimeout(() => {
                setIsSubmitted(false);
                setFormData({ title: '', category: 'System Bug', description: '', attachment: null });
                if (document.getElementById('fileUpload')) {
                    document.getElementById('fileUpload').value = '';
                }
            }, 3000);
        }
    };

    return (
        <div className={styles.peracomTheme}>
            {/* Main Form Container */}
            <div className={styles.formContainer} style={{ marginTop: '30px' }}>
                <header className={styles.formHeader}>
                    <h2>Report an Issue</h2>
                    <p>Facing a problem with your scholarship application or account? Let our admin team know.</p>
                </header>

                {isSubmitted ? (
                    <div className={styles.successMessage}>
                        <div className={styles.successIcon}>✓</div>
                        <h3>Issue Submitted Successfully!</h3>
                        <p>Our admin team will review your report and respond to you shortly via the portal.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className={styles.issueForm}>

                        <div className={styles.inputGroup}>
                            <label>Issue Title <span className={styles.required}>*</span></label>
                            <input
                                type="text"
                                name="title"
                                placeholder="E.g., Cannot upload transcript PDF"
                                value={formData.title}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Category <span className={styles.required}>*</span></label>
                            <select name="category" value={formData.category} onChange={handleChange}>
                                <option value="System Bug">System Bug / Error</option>
                                <option value="Scholarship Application">Scholarship Application Issue</option>
                                <option value="Donor Dashboard">Donor Dashboard Issue</option>
                                <option value="Account Login">Account / Login Issue</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Description <span className={styles.required}>*</span></label>
                            <textarea
                                name="description"
                                placeholder="Please describe the issue in detail. What were you trying to do?"
                                value={formData.description}
                                onChange={handleChange}
                                required
                                rows="6"
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Attach Screenshot / Document (Optional)</label>
                            <div className={styles.fileUploadWrapper}>
                                <div className={styles.uploadIcon}>📁</div>
                                <input
                                    type="file"
                                    id="fileUpload"
                                    name="attachment"
                                    onChange={handleFileChange}
                                    accept=".jpg,.jpeg,.png,.pdf"
                                    className={styles.fileInput}
                                />
                                <small>Supported formats: JPG, PNG, PDF (Max size: 5MB)</small>
                            </div>
                        </div>

                        <button type="submit" className={styles.submitBtn}>
                            Submit Issue Report
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default IssueReportingPage;