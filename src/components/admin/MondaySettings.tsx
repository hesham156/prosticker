import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
    getMondaySettings,
    saveMondaySettings,
    testMondayConnectionWithToken,
    type MondaySettings as MondaySettingsType
} from '../../services/mondayService';
import '../../styles/Settings.css';

const MondaySettings: React.FC = () => {
    const { userData } = useAuth();
    const [settings, setSettings] = useState<MondaySettingsType>({
        enabled: false,
        apiToken: '',
        designBoardId: '',
        productionBoardId: '',
        autoSync: false
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
    const [showToken, setShowToken] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const data = await getMondaySettings();
            setSettings(data);
        } catch (error: any) {
            setMessage({ type: 'error', text: 'فشل تحميل الإعدادات / Failed to load settings' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!userData?.uid) {
            setMessage({ type: 'error', text: 'يجب تسجيل الدخول / Must be logged in' });
            return;
        }

        try {
            setSaving(true);
            setMessage(null);

            await saveMondaySettings(settings, userData.uid);

            setMessage({ type: 'success', text: 'تم حفظ الإعدادات بنجاح / Settings saved successfully' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'فشل الحفظ / Save failed' });
        } finally {
            setSaving(false);
        }
    };

    const handleTestConnection = async () => {
        if (!settings.apiToken) {
            setMessage({ type: 'error', text: 'الرجاء إدخال API Token أولاً / Please enter API token first' });
            return;
        }

        try {
            setTesting(true);
            setMessage(null);

            const result = await testMondayConnectionWithToken(settings.apiToken);

            if (result.success) {
                setMessage({ type: 'success', text: `✅ ${result.message}` });
            } else {
                setMessage({ type: 'error', text: `❌ ${result.message}` });
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'فشل الاختبار / Test failed' });
        } finally {
            setTesting(false);
        }
    };

    if (loading) {
        return <div className="loading">جاري التحميل...</div>;
    }

    return (
        <div className="settings-container">
            <div className="settings-header">
                <h2>إعدادات Monday.com / Monday.com Settings</h2>
                <p className="settings-description">
                    قم بتكوين الربط مع Monday.com لمزامنة الطلبات تلقائياً
                    <br />
                    Configure Monday.com integration to sync orders automatically
                </p>
            </div>

            {message && (
                <div className={`message message-${message.type}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSave} className="settings-form">
                {/* Enable/Disable Toggle */}
                <div className="form-group toggle-group">
                    <label className="toggle-label">
                        <span>تفعيل الربط / Enable Integration</span>
                        <div className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={settings.enabled}
                                onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                            />
                            <span className="toggle-slider"></span>
                        </div>
                    </label>
                </div>

                {/* API Token */}
                <div className="form-group">
                    <label>Monday.com API Token *</label>
                    <div className="input-with-button">
                        <input
                            type={showToken ? 'text' : 'password'}
                            value={settings.apiToken}
                            onChange={(e) => setSettings({ ...settings, apiToken: e.target.value })}
                            placeholder="eyJhbGciOiJIUzI1NiJ9..."
                            required
                        />
                        <button
                            type="button"
                            className="btn-toggle-visibility"
                            onClick={() => setShowToken(!showToken)}
                        >
                            {showToken ? '🙈' : '👁️'}
                        </button>
                    </div>
                    <small className="field-hint">
                        احصل على API Token من Monday.com → Profile → Admin → API
                    </small>
                </div>

                {/* Design Board ID */}
                <div className="form-group">
                    <label>معرف لوحة المصممين / Design Board ID *</label>
                    <input
                        type="text"
                        value={settings.designBoardId}
                        onChange={(e) => setSettings({ ...settings, designBoardId: e.target.value })}
                        placeholder="123456789"
                        required
                    />
                    <small className="field-hint">
                        معرف اللوحة الخاصة بقسم التصميم
                    </small>
                </div>

                {/* Production Board ID */}
                <div className="form-group">
                    <label>معرف لوحة الإنتاج / Production Board ID *</label>
                    <input
                        type="text"
                        value={settings.productionBoardId}
                        onChange={(e) => setSettings({ ...settings, productionBoardId: e.target.value })}
                        placeholder="987654321"
                        required
                    />
                    <small className="field-hint">
                        معرف اللوحة الخاصة بقسم الإنتاج
                    </small>
                </div>

                {/* Auto Sync Toggle */}
                <div className="form-group toggle-group">
                    <label className="toggle-label">
                        <span>مزامنة تلقائية / Auto Sync</span>
                        <div className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={settings.autoSync}
                                onChange={(e) => setSettings({ ...settings, autoSync: e.target.checked })}
                                disabled={!settings.enabled}
                            />
                            <span className="toggle-slider"></span>
                        </div>
                    </label>
                    <small className="field-hint">
                        مزامنة الطلبات تلقائياً عند إنشائها
                    </small>
                </div>

                {/* Last Sync Info */}
                {settings.lastSync && (
                    <div className="info-box">
                        <strong>آخر مزامنة / Last Sync:</strong>
                        <span>{new Date(settings.lastSync).toLocaleString('ar-EG')}</span>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="form-actions">
                    <button
                        type="button"
                        className="btn-test"
                        onClick={handleTestConnection}
                        disabled={testing || !settings.apiToken}
                    >
                        {testing ? 'جاري الاختبار...' : 'اختبار الاتصال / Test Connection'}
                    </button>
                    <button
                        type="submit"
                        className="btn-save"
                        disabled={saving}
                    >
                        {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات / Save Settings'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default MondaySettings;
