import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  LockClosedIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import api from '../services/api';

// Import custom UI components
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input, { TextArea } from '../components/ui/Input';
import Form from '../components/ui/Form';
import Avatar from '../components/ui/Avatar';
import Select from '../components/ui/Select';
import Switch from '../components/ui/Switch';
import Tag from '../components/ui/Tag';
import Spin from '../components/ui/Spin';
import AvatarUploader from '../components/AvatarUploader.jsx';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    timezone: 'Asia/Manila',
    language: 'en',
    emailNotifications: true,
    pushNotifications: true,
    twoFactorEnabled: false,
    avatar: null,
  });

  // Timezone options
  const timezoneOptions = [
    { value: 'Asia/Manila', label: 'Asia/Manila (UTC+8)' },
    { value: 'America/New_York', label: 'America/New_York (UTC-5)' },
    { value: 'Europe/London', label: 'Europe/London (UTC+0)' },
    { value: 'Asia/Tokyo', label: 'Asia/Tokyo (UTC+9)' },
    { value: 'Australia/Sydney', label: 'Australia/Sydney (UTC+10)' },
  ];

  // Language options
  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'zh', label: 'Chinese' },
  ];

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/profile');
      const userData = response.data?.data || user;

      const profileInfo = {
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        bio: userData.bio || '',
        timezone: userData.timezone || 'Asia/Manila',
        language: userData.language || 'en',
        emailNotifications: userData.emailNotifications !== false,
        pushNotifications: userData.pushNotifications !== false,
        twoFactorEnabled: userData.twoFactorEnabled || false,
        avatar: userData.avatar || null,
      };

      setProfileData(profileInfo);
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      const response = await api.put('/admin/profile', formData);
      const updatedUser = response.data?.data;

      // Update local user context
      updateUser(updatedUser);

      // Update local state
      setProfileData(prev => ({ ...prev, ...formData }));

      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // When AvatarUploader finishes, persist avatar to profile and refresh UI/auth state.
  const handleAvatarUploaded = async (url, meta) => {
    try {
      console.log('[Profile] Avatar uploaded:', { url, meta });
      // Persist avatar URL to admin profile in mock backend
      const res = await api.put('/admin/profile', { avatar: url });
      const updated = res?.data?.data || {};
      updateUser?.(updated);
      setProfileData(prev => ({ ...prev, avatar: url }));
      toast.success('Avatar updated successfully');
    } catch (e) {
      console.error('[Profile] Failed to save avatar URL:', e?.response?.data || e);
      toast.error(e?.response?.data?.error || e?.message || 'Failed to save avatar URL');
    }
  };

  const handleFormSubmit = (values) => {
    handleSave(values);
  };

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <Spin spinning={true} tip="Loading profile..." />
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your account settings and preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Overview Card */}
        <div className="lg:col-span-1">
          <Card className="text-center">
            <div className="space-y-4">
              <div className="relative inline-block">
                <Avatar
                  src={profileData.avatar}
                  size={120}
                  icon={<UserIcon className="h-12 w-12" />}
                  className="border-4 border-white dark:border-gray-700 shadow-lg"
                />
                <div className="mt-3">
                  <AvatarUploader
                    user={user}
                    onUploaded={handleAvatarUploaded}
                    buttonLabel="Upload New Avatar"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {profileData.name || 'Admin User'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{profileData.email}</p>
                <Tag color="primary" className="mt-2">Administrator</Tag>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4" />

              <div className="space-y-3 text-left">
                <div className="flex items-center space-x-3">
                  <EnvelopeIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{profileData.email}</span>
                </div>
                {profileData.phone && (
                  <div className="flex items-center space-x-3">
                    <PhoneIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{profileData.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Profile Settings Form */}
        <div className="lg:col-span-2">
          <Card title="Personal Information">
            <Form onSubmit={handleFormSubmit} initialValues={profileData}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item
                  label="Full Name"
                  name="name"
                  required
                >
                  <Input
                    prefix={<UserIcon className="h-4 w-4 text-gray-400" />}
                    placeholder="Enter your full name"
                  />
                </Form.Item>

                <Form.Item
                  label="Email Address"
                  name="email"
                  required
                >
                  <Input
                    type="email"
                    prefix={<EnvelopeIcon className="h-4 w-4 text-gray-400" />}
                    placeholder="Enter your email"
                  />
                </Form.Item>

                <Form.Item
                  label="Phone Number"
                  name="phone"
                >
                  <Input
                    prefix={<PhoneIcon className="h-4 w-4 text-gray-400" />}
                    placeholder="Enter your phone number"
                  />
                </Form.Item>

                <Form.Item
                  label="Timezone"
                  name="timezone"
                >
                  <Select
                    options={timezoneOptions}
                    placeholder="Select your timezone"
                  />
                </Form.Item>
              </div>

              <Form.Item
                label="Bio"
                name="bio"
              >
                <TextArea
                  rows={4}
                  placeholder="Tell us about yourself..."
                  maxLength={500}
                  showCount
                />
              </Form.Item>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Preferences</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <Form.Item
                    label="Language"
                    name="language"
                  >
                    <Select
                      options={languageOptions}
                      placeholder="Select your language"
                    />
                  </Form.Item>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email Notifications
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Receive email notifications about your account
                      </p>
                    </div>
                    <Form.Item name="emailNotifications" className="mb-0">
                      <Switch />
                    </Form.Item>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Push Notifications
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Receive push notifications in your browser
                      </p>
                    </div>
                    <Form.Item name="pushNotifications" className="mb-0">
                      <Switch />
                    </Form.Item>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Two-Factor Authentication
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Form.Item name="twoFactorEnabled" className="mb-0">
                      <Switch />
                    </Form.Item>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                <div className="flex space-x-3">
                  <Button
                    type="submit"
                    variant="primary"
                    loading={saving}
                    icon={<CheckIcon className="h-4 w-4" />}
                    size="large"
                  >
                    Save Changes
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="large"
                    onClick={() => window.location.reload()}
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </Form>
          </Card>
        </div>
      </div>

      {/* Security Section */}
      <Card title="Security Settings">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Change Password</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Update your account password</p>
            </div>
            <Button
              variant="secondary"
              icon={<LockClosedIcon className="h-4 w-4" />}
            >
              Change Password
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Login Sessions</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Manage your active login sessions</p>
            </div>
            <Button variant="secondary">
              View Sessions
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div>
              <h4 className="font-medium text-red-900 dark:text-red-400 flex items-center">
                <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                Danger Zone
              </h4>
              <p className="text-sm text-red-600 dark:text-red-400">Irreversible actions</p>
            </div>
            <Button variant="danger">
              Delete Account
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Profile;