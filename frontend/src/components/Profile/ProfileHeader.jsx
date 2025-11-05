import React, { useRef } from 'react';
import useUserProfileStore from '../../store/userProfileStore';
import './ProfileHeader.css';

const ProfileHeader = ({ profile }) => {
  const { uploadAvatar, isLoading } = useUserProfileStore();
  const fileInputRef = useRef(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      alert('Sadece JPG, JPEG ve PNG dosyaları yüklenebilir');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Dosya boyutu 5MB\'dan büyük olamaz');
      return;
    }

    try {
      await uploadAvatar(file);
      alert('Profil resmi başarıyla güncellendi');
    } catch (error) {
      alert(error.response?.data?.message || 'Profil resmi yüklenemedi');
    }
  };

  const getAvatarUrl = () => {
    if (profile?.profile_image) {
      // If it's a full URL, use it directly
      if (profile.profile_image.startsWith('http')) {
        return profile.profile_image;
      }
      // Otherwise, construct URL from backend
      return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${profile.profile_image}`;
    }
    return null;
  };

  const getInitials = () => {
    if (profile?.username) {
      return profile.username.substring(0, 2).toUpperCase();
    }
    return '??';
  };

  return (
    <div className="profile-header">
      <div className="profile-avatar-container">
        <div
          className="profile-avatar"
          onClick={handleAvatarClick}
          style={{ cursor: isLoading ? 'not-allowed' : 'pointer' }}
        >
          {getAvatarUrl() ? (
            <img src={getAvatarUrl()} alt="Profile" />
          ) : (
            <div className="profile-avatar-placeholder">
              {getInitials()}
            </div>
          )}
          <div className="profile-avatar-overlay">
            <span>📷</span>
            <span className="avatar-text">Değiştir</span>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          disabled={isLoading}
        />
      </div>

      <div className="profile-info">
        <h2>{profile?.username || 'Kullanıcı'}</h2>
        <p className="profile-email">{profile?.email || ''}</p>
        <div className="profile-badges">
          <span className={`role-badge role-${profile?.role}`}>
            {profile?.role === 'admin' ? 'Yönetici' :
             profile?.role === 'manager' ? 'Müdür' : 'Kullanıcı'}
          </span>
          {profile?.two_factor_enabled && (
            <span className="badge-2fa">🔐 2FA Aktif</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
