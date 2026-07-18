import React, { useState, useEffect, useMemo } from 'react';
import styles from './AnnouncementsPage.module.css';
import { supabase } from '../services/supabaseClient'; // உன்னட Supabase கனெக்‌ஷன்

const AnnouncementsPage = () => {
    const [announcements, setAnnouncements] = useState([]);
    
    // Modal and Form States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    
    const initialFormState = {
        title: '',
        content: '',
        type: 'General',
        audience: 'All',
        priority: 'Normal',
        status: 'Published',
        validUntil: ''
    };
    const [formData, setFormData] = useState(initialFormState);

    // Filters
    const [filters, setFilters] = useState({
        search: '',
        audience: 'All',
        type: 'All'
    });

    // 1. Fetch Data from Supabase
    const fetchAnnouncements = async () => {
        const { data, error } = await supabase
            .from('announcements')
            .select('*')
            .order('publish_date', { ascending: false });

        if (error) {
            console.error('Error fetching data:', error);
        } else {
            setAnnouncements(data || []);
        }
    };

    // Load data when page loads
    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleOpenNew = () => {
        setFormData(initialFormState);
        setIsEditing(false);
        setEditId(null);
        setIsModalOpen(true);
    };

    const handleEdit = (announcement) => {
        setFormData({
            title: announcement.title,
            content: announcement.content,
            type: announcement.type,
            audience: announcement.audience,
            priority: announcement.priority,
            status: announcement.status,
            validUntil: announcement.valid_until || ''
        });
        setIsEditing(true);
        setEditId(announcement.id);
        setIsModalOpen(true);
    };

    // 2. Submit / Insert / Update to Supabase
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (isEditing) {
            const { error } = await supabase
                .from('announcements')
                .update({
                    title: formData.title,
                    content: formData.content,
                    type: formData.type,
                    audience: formData.audience,
                    priority: formData.priority,
                    status: formData.status,
                    valid_until: formData.validUntil || null
                })
                .eq('id', editId);

            if (error) alert('Failed to update announcement');
        } else {
            const newAnn = {
                id: `ANN-${Date.now()}`,
                title: formData.title,
                content: formData.content,
                type: formData.type,
                audience: formData.audience,
                priority: formData.priority,
                status: formData.status,
                valid_until: formData.validUntil || null,
                publish_date: new Date().toISOString().split('T')[0]
            };

            const { error } = await supabase
                .from('announcements')
                .insert([newAnn]);

            if (error) alert('Failed to save announcement');
        }
        
        fetchAnnouncements();
        setIsModalOpen(false);
    };

    // 3. Delete from Supabase
    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to permanently delete this announcement?')) {
            const { error } = await supabase
                .from('announcements')
                .delete()
                .eq('id', id);
            
            if (error) alert('Failed to delete announcement');
            else fetchAnnouncements();
        }
    };

    // Stats calculation
    const stats = useMemo(() => {
        return {
            total: announcements.length,
            active: announcements.filter(a => a.status === 'Published').length,
            drafts: announcements.filter(a => a.status === 'Draft').length,
            urgent: announcements.filter(a => a.priority === 'High').length
        };
    }, [announcements]);

    // Filters calculation
    const filteredAnnouncements = useMemo(() => {
        return announcements.filter(ann => {
            const matchSearch = ann.title.toLowerCase().includes(filters.search.toLowerCase()) || 
                                ann.content.toLowerCase().includes(filters.search.toLowerCase());
            const matchAudience = filters.audience === 'All' || ann.audience === filters.audience;
            const matchType = filters.type === 'All' || ann.type === filters.type;
            return matchSearch && matchAudience && matchType;
        });
    }, [announcements, filters]);

    return (
        <div className={styles.peracomTheme}>
            {/* Main Admin Content Container */}
            <div className={styles.adminContainer} style={{marginTop: '30px'}}>
                <header className={styles.pageHeader}>
                    <div>
                        <h2 className={styles.sectionTitle}>System Announcements</h2>
                        <p className={styles.sectionSubtitle}>Manage and broadcast updates across the university network.</p>
                    </div>
                    <button className={styles.createNewBtn} onClick={handleOpenNew}>
                        + Create Announcement
                    </button>
                </header>

                {/* Statistics Widget */}
                <div className={styles.statsWidget}>
                    <div className={styles.statCard}><h3>Total</h3><p>{stats.total}</p></div>
                    <div className={styles.statCard}><h3>Active</h3><p>{stats.active}</p></div>
                    <div className={styles.statCard}><h3>Drafts</h3><p>{stats.drafts}</p></div>
                    <div className={`${styles.statCard} ${styles.urgentStat}`}><h3>Urgent</h3><p>{stats.urgent}</p></div>
                </div>

                {/* Filters Section */}
                <div className={styles.filterSection}>
                    <input type="text" name="search" placeholder="Search announcements..." value={filters.search} onChange={handleFilterChange} className={styles.searchBar} />
                    <select name="audience" value={filters.audience} onChange={handleFilterChange} className={styles.filterDropdown}>
                        <option value="All">Target: All</option>
                        <option value="Students">Students</option>
                        <option value="Donors">Donors</option>
                        <option value="Admins">Admins</option>
                    </select>
                    <select name="type" value={filters.type} onChange={handleFilterChange} className={styles.filterDropdown}>
                        <option value="All">Type: All</option>
                        <option value="Scholarship">Scholarships</option>
                        <option value="Funding Update">Funding Update</option>
                        <option value="System Alert">System Alert</option>
                    </select>
                </div>

                {/* Data Grid */}
                <div className={styles.dataTableContainer}>
                    <table className={styles.dataTable}>
                        <thead>
                            <tr>
                                <th>Title & Details</th>
                                <th>Target</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAnnouncements.length === 0 ? (
                                <tr><td colSpan="5" className={styles.noData}>No announcements found.</td></tr>
                            ) : (
                                filteredAnnouncements.map(ann => (
                                    <tr key={ann.id}>
                                        <td className={styles.titleColumn}>
                                            <strong>{ann.title}</strong>
                                            <span className={styles.dateInfo}>Pub: {ann.publish_date} {ann.valid_until && `| Exp: ${ann.valid_until}`}</span>
                                        </td>
                                        <td><span className={`${styles.badge} ${styles.bgAudience}`}>{ann.audience}</span></td>
                                        <td><span className={`${styles.badge} ${styles.bgType}`}>{ann.type}</span></td>
                                        <td><span className={`${styles.badge} ${ann.status === 'Published' ? styles.bgSuccess : styles.bgDraft}`}>{ann.status}</span></td>
                                        <td className={styles.actionColumn}>
                                            <button onClick={() => handleEdit(ann)} className={styles.editBtn}>Edit</button>
                                            <button onClick={() => handleDelete(ann.id)} className={styles.deleteBtn}>Delete</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Popup */}
            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2>{isEditing ? 'Edit Announcement' : 'Create New Announcement'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className={styles.closeBtn}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} className={styles.modalForm}>
                            <div className={styles.formGroup}>
                                <label>Announcement Title <span className={styles.required}>*</span></label>
                                <input type="text" name="title" value={formData.title} onChange={handleInputChange} required />
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Announcement Type</label>
                                    <select name="type" value={formData.type} onChange={handleInputChange}>
                                        <option value="General">General News</option>
                                        <option value="Scholarship">Scholarship App</option>
                                        <option value="Funding Update">Funding Update</option>
                                        <option value="System Alert">System Alert</option>
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Target Audience</label>
                                    <select name="audience" value={formData.audience} onChange={handleInputChange}>
                                        <option value="All">All Users</option>
                                        <option value="Students">Students Only</option>
                                        <option value="Donors">Donors Only</option>
                                        <option value="Admins">Admins Only</option>
                                    </select>
                                </div>
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Priority</label>
                                    <select name="priority" value={formData.priority} onChange={handleInputChange}>
                                        <option value="Low">Low</option>
                                        <option value="Normal">Normal</option>
                                        <option value="High">High / Urgent</option>
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Status</label>
                                    <select name="status" value={formData.status} onChange={handleInputChange}>
                                        <option value="Published">Publish Now</option>
                                        <option value="Draft">Save as Draft</option>
                                    </select>
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Valid Until</label>
                                <input type="date" name="validUntil" value={formData.validUntil} onChange={handleInputChange} />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Detailed Content <span className={styles.required}>*</span></label>
                                <textarea name="content" rows="4" value={formData.content} onChange={handleInputChange} required></textarea>
                            </div>
                            <div className={styles.modalActions}>
                                <button type="button" onClick={() => setIsModalOpen(false)} className={styles.cancelBtn}>Cancel</button>
                                <button type="submit" className={styles.saveBtn}>{isEditing ? 'Update' : 'Save & Publish'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnnouncementsPage;