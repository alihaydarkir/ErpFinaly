import React, { useState, useEffect } from 'react';
import useUserProfileStore from '../../store/userProfileStore';
import './PreferencesTab.css';

const PreferencesTab = ({ profile }) => {
  const { updatePreferences, isLoading } = useUserProfileStore();

  const [preferences, setPreferences] = useState({
    theme: 'light',
    notifications: {
      email: true,
      browser: true,
      lowStock: true,
      newOrders: true
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
        notifications: prefs.notifications || {
          email: true,
          browser: true,
          lowStock: true,
          newOrders: true
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

  const handleNotificationChange = (key) => {
    setPreferences((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key]
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await updatePreferences(preferences);

      // Apply theme immediately
      applyTheme(preferences.theme);

      // Save to localStorage
      localStorage.setItem('userPreferences', JSON.stringify(preferences));

      alert('Tercihler başarıyla kaydedildi');
    } catch (error) {
      alert(error.response?.data?.message || 'Tercihler kaydedilemedi');
    }
  };

  const applyTheme = (theme) => {
    const root = document.documentElement;

    // Remove existing theme class
    root.classList.remove('dark');

    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'auto') {
      // Use system preference
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) {
        root.classList.add('dark');
      }
    }
    // 'light' theme doesn't need any class
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
