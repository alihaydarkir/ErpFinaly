import React, { useState, useEffect } from 'react';
import useUserProfileStore from '../../store/userProfileStore';
import './PreferencesTab.css';

const PreferencesTab = ({ profile }) => {
  const { updatePreferences, isLoading } = useUserProfileStore();

  const [preferences, setPreferences] = useState({
    theme: 'light',
    language: 'tr',
    notifications: {
      email: true,
      browser: true,
      lowStock: true,
      newOrders: true
    },
    dashboard: {
      showSales: true,
      showOrders: true,
      showProducts: true,
      showCustomers: true
    }
  });

  useEffect(() => {
    if (profile?.preferences) {
      // Parse preferences if it's a string
      const prefs = typeof profile.preferences === 'string'
        ? JSON.parse(profile.preferences)
        : profile.preferences;

      setPreferences({
        theme: prefs.theme || 'light',
        language: prefs.language || 'tr',
        notifications: prefs.notifications || {
          email: true,
          browser: true,
          lowStock: true,
          newOrders: true
        },
        dashboard: prefs.dashboard || {
          showSales: true,
          showOrders: true,
          showProducts: true,
          showCustomers: true
        }
      });
    }
  }, [profile]);

  const handleThemeChange = (e) => {
    setPreferences((prev) => ({
      ...prev,
      theme: e.target.value
    }));
  };

  const handleLanguageChange = (e) => {
    setPreferences((prev) => ({
      ...prev,
      language: e.target.value
    }));
  };

  const handleNotificationChange = (key) => {
    setPreferences((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key]
      }
    }));
  };

  const handleDashboardChange = (key) => {
    setPreferences((prev) => ({
      ...prev,
      dashboard: {
        ...prev.dashboard,
        [key]: !prev.dashboard[key]
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await updatePreferences(preferences);
      alert('Tercihler başarıyla kaydedildi');
    } catch (error) {
      alert(error.response?.data?.message || 'Tercihler kaydedilemedi');
    }
  };

  return (
    <div className="preferences-tab">
      <div className="tab-header">
        <h3>Tercihler</h3>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Theme Section */}
        <div className="preference-section">
          <h4>🎨 Tema</h4>
          <div className="preference-options">
            <label className="radio-option">
              <input
                type="radio"
                name="theme"
                value="light"
                checked={preferences.theme === 'light'}
                onChange={handleThemeChange}
                disabled={isLoading}
              />
              <span>Açık Tema</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="theme"
                value="dark"
                checked={preferences.theme === 'dark'}
                onChange={handleThemeChange}
                disabled={isLoading}
              />
              <span>Koyu Tema</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="theme"
                value="auto"
                checked={preferences.theme === 'auto'}
                onChange={handleThemeChange}
                disabled={isLoading}
              />
              <span>Otomatik (Sistem)</span>
            </label>
          </div>
        </div>

        {/* Language Section */}
        <div className="preference-section">
          <h4>🌐 Dil</h4>
          <div className="preference-options">
            <label className="radio-option">
              <input
                type="radio"
                name="language"
                value="tr"
                checked={preferences.language === 'tr'}
                onChange={handleLanguageChange}
                disabled={isLoading}
              />
              <span>Türkçe</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="language"
                value="en"
                checked={preferences.language === 'en'}
                onChange={handleLanguageChange}
                disabled={isLoading}
              />
              <span>English</span>
            </label>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="preference-section">
          <h4>🔔 Bildirimler</h4>
          <div className="preference-checkboxes">
            <label className="checkbox-option">
              <input
                type="checkbox"
                checked={preferences.notifications.email}
                onChange={() => handleNotificationChange('email')}
                disabled={isLoading}
              />
              <span>E-posta bildirimleri</span>
            </label>
            <label className="checkbox-option">
              <input
                type="checkbox"
                checked={preferences.notifications.browser}
                onChange={() => handleNotificationChange('browser')}
                disabled={isLoading}
              />
              <span>Tarayıcı bildirimleri</span>
            </label>
            <label className="checkbox-option">
              <input
                type="checkbox"
                checked={preferences.notifications.lowStock}
                onChange={() => handleNotificationChange('lowStock')}
                disabled={isLoading}
              />
              <span>Düşük stok uyarıları</span>
            </label>
            <label className="checkbox-option">
              <input
                type="checkbox"
                checked={preferences.notifications.newOrders}
                onChange={() => handleNotificationChange('newOrders')}
                disabled={isLoading}
              />
              <span>Yeni sipariş bildirimleri</span>
            </label>
          </div>
        </div>

        {/* Dashboard Section */}
        <div className="preference-section">
          <h4>📊 Dashboard Görünümü</h4>
          <div className="preference-checkboxes">
            <label className="checkbox-option">
              <input
                type="checkbox"
                checked={preferences.dashboard.showSales}
                onChange={() => handleDashboardChange('showSales')}
                disabled={isLoading}
              />
              <span>Satış grafiğini göster</span>
            </label>
            <label className="checkbox-option">
              <input
                type="checkbox"
                checked={preferences.dashboard.showOrders}
                onChange={() => handleDashboardChange('showOrders')}
                disabled={isLoading}
              />
              <span>Sipariş listesini göster</span>
            </label>
            <label className="checkbox-option">
              <input
                type="checkbox"
                checked={preferences.dashboard.showProducts}
                onChange={() => handleDashboardChange('showProducts')}
                disabled={isLoading}
              />
              <span>Ürün istatistiklerini göster</span>
            </label>
            <label className="checkbox-option">
              <input
                type="checkbox"
                checked={preferences.dashboard.showCustomers}
                onChange={() => handleDashboardChange('showCustomers')}
                disabled={isLoading}
              />
              <span>Müşteri bilgilerini göster</span>
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn-save"
            disabled={isLoading}
          >
            {isLoading ? 'Kaydediliyor...' : 'Tercihleri Kaydet'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PreferencesTab;
