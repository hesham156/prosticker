import React, { useState } from 'react';
import { fixUserDocuments } from '../scripts/fixUserDocuments';
import '../styles/Setup.css';

const SetupPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleFix = async () => {
        try {
            setLoading(true);
            setError('');
            setMessage('جاري إصلاح المستندات...');

            await fixUserDocuments();

            setMessage('✅ تم إصلاح جميع المستندات بنجاح! الآن يمكنك تسجيل الدخول.');
        } catch (err: any) {
            setError('❌ فشل الإصلاح: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="setup-container">
            <div className="setup-card">
                <h1>إصلاح مستندات المستخدمين</h1>
                <h2>Fix User Documents</h2>

                <div className="setup-info">
                    <p>
                        هذه الصفحة ستقوم بإصلاح مستندات المستخدمين القديمة
                        <br />
                        عن طريق نقلها من IDs عشوائية إلى IDs مبنية على UID
                    </p>
                </div>

                {message && <div className="success-message">{message}</div>}
                {error && <div className="error-message">{error}</div>}

                <button
                    onClick={handleFix}
                    disabled={loading}
                    className="fix-btn"
                >
                    {loading ? 'جاري الإصلاح...' : 'إصلاح المستندات / Fix Documents'}
                </button>

                <div className="manual-steps">
                    <h3>أو إصلاح يدوي:</h3>
                    <ol>
                        <li>افتح Firestore Console</li>
                        <li>لكل مستند في <code>users</code>:</li>
                        <li>انسخ قيمة الحقل <code>uid</code></li>
                        <li>احذف المستند الحالي</li>
                        <li>أنشئ مستند جديد بـ Document ID = قيمة UID</li>
                        <li>أضف نفس الحقول</li>
                    </ol>
                </div>
            </div>
        </div>
    );
};

export default SetupPage;
