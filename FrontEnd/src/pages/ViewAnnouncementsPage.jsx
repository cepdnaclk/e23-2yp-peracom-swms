import React, { useState, useEffect } from 'react';
import styles from './AnnouncementsPage.module.css'; // அட்மினுக்கு பாவிச்ச அதே டிசைனை இங்கேயும் பாவிப்பம்
import { supabase } from '../services/supabaseClient';

const ViewAnnouncements = ({ userRole = 'Student' }) => { 
    // userRole எண்டது Student ஆ அல்லது Donor ஆ எண்டு குறிக்கும்.
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);

    // டேட்டாபேஸ்ல இருந்து வாசிக்க மட்டும் செய்யும் (Read-only)
    const fetchPublicAnnouncements = async () => {
        const { data, error } = await supabase
            .from('announcements')
            .select('*')
            .eq('status', 'Published') // Published ஆனதை மட்டும் தான் எடுக்கணும் (Draft வரக் கூடாது)
            .order('publish_date', { ascending: false });

        if (error) {
            console.error('Error fetching announcements:', error);
        } else {
            // யூசருக்கு ஏத்த மாதிரி பில்டர் (Filter) பண்ணுதல்
            const filteredData = data.filter(ann => 
                ann.audience === 'All' || 
                (userRole === 'Student' && ann.audience === 'Students') ||
                (userRole === 'Donor' && ann.audience === 'Donors')
            );
            setAnnouncements(filteredData);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchPublicAnnouncements();
    }, [userRole]);

    return (
        <div className={styles.peracomTheme}>
            <div className={styles.adminContainer} style={{marginTop: '30px'}}>
                <header className={styles.pageHeader}>
                    <div>
                        <h2 className={styles.sectionTitle}>University Announcements</h2>
                        <p className={styles.sectionSubtitle}>Stay updated with the latest news, deadlines, and alerts.</p>
                    </div>
                </header>

                <div className={styles.dataTableContainer}>
                    {loading ? (
                        <p className={styles.noData}>Loading announcements...</p>
                    ) : announcements.length === 0 ? (
                        <p className={styles.noData}>No new announcements at the moment.</p>
                    ) : (
                        <table className={styles.dataTable}>
                            <tbody>
                                {announcements.map(ann => (
                                    <tr key={ann.id}>
                                        <td className={styles.titleColumn} style={{ padding: '20px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <strong>{ann.title}</strong>
                                                <span className={`${styles.badge} ${styles.bgType}`}>{ann.type}</span>
                                            </div>
                                            <p style={{ margin: '10px 0', color: '#475569', lineHeight: '1.6' }}>
                                                {ann.content}
                                            </p>
                                            <span className={styles.dateInfo}>
                                                Published on: {ann.publish_date} {ann.valid_until && `| Valid Until: ${ann.valid_until}`}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ViewAnnouncements;