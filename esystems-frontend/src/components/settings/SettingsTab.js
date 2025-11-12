import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '../../services/api';
import { format } from 'date-fns';
import {
  UserCircleIcon,
  BellIcon,
  ShieldCheckIcon,
  UsersIcon,
  LinkIcon,
  CogIcon,
  LockClosedIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronRightIcon,
  GlobeAltIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ClockIcon,
  LanguageIcon,
  KeyIcon,
  CalendarIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  ClipboardDocumentCheckIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  EyeSlashIcon,
  PlusIcon,
  MinusIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon,
  QrCodeIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import { Switch } from '@headlessui/react';

// Settings sections configuration
const settingsSections = [
  { id: 'account', name: 'Account Settings', icon: UserCircleIcon },
  { id: 'notifications', name: 'Notifications', icon: BellIcon },
  { id: 'security', name: 'Security', icon: ShieldCheckIcon },
  { id: 'team', name: 'Team Management', icon: UsersIcon },
  { id: 'integrations', name: 'Integrations', icon: LinkIcon },
  { id: 'preferences', name: 'Preferences', icon: CogIcon },
  { id: 'privacy', name: 'Data & Privacy', icon: LockClosedIcon },
];

const SettingsTab = () => {
  const [activeSection, setActiveSection] = useState('account');
  const [loading, setLoading] = useState(false);
  const [savingSection, setSavingSection] = useState(null);
  const [businessData, setBusinessData] = useState(null);
  const [notificationSettings, setNotificationSettings] = useState({
    email: {
      newApplications: true,
      trialExpiration: true,
      paymentConfirmations: true,
      weeklyReports: false,
      systemUpdates: true,
    },
    sms: {
      enabled: false,
      newApplications: false,
      trialExpiration: false,
      paymentConfirmations: false,
    },
    inApp: {
      enabled: true,
      newApplications: true,
      trialExpiration: true,
      paymentConfirmations: true,
      systemUpdates: true,
    },
    frequency: 'instant', // instant, daily, weekly
  });
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    backupCodesCount: 0,
    last2FAActivity: null,
    sessions: [],
    apiKeys: [],
  });
  const [teamMembers, setTeamMembers] = useState([]);
  const [integrations, setIntegrations] = useState({
    google: { connected: false },
    outlook: { connected: false },
    slack: { connected: false },
    zapier: { connected: false, webhook: '' },
  });
  const [preferences, setPreferences] = useState({
    defaultWorkingHours: { start: '09:00', end: '18:00' },
    preferredSpecialties: [],
    autoApproveApplications: false,
    defaultTrialDuration: 10,
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [show2FASetupModal, setShow2FASetupModal] = useState(false);
  const [show2FADisableModal, setShow2FADisableModal] = useState(false);
  const [showBackupCodesModal, setShowBackupCodesModal] = useState(false);
  const [twoFactorData, setTwoFactorData] = useState(null);
  const [setupStep, setSetupStep] = useState(1);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [setupPassword, setSetupPassword] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [setting2FA, setSetting2FA] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchBusinessData();
    fetchNotificationSettings();
    fetchSecuritySettings();
    fetchTeamMembers();
    fetchIntegrations();
    fetchPreferences();
  }, []);

  const fetchBusinessData = async () => {
    try {
      const response = await api.get('/businesses/profile');
      setBusinessData(response.data);
      setPhoneVerified(response.data?.phoneVerified || false);
    } catch (error) {
      console.error('Error fetching business data:', error);
    }
  };

  const fetchNotificationSettings = async () => {
    try {
      const response = await api.get('/businesses/notification-settings');
      if (response.data) {
        setNotificationSettings(response.data);
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
    }
  };

  const fetchSecuritySettings = async () => {
    try {
      const response = await api.get('/businesses/security-settings');
      if (response.data) {
        setSecuritySettings(response.data);
      }
      // Also fetch 2FA status
      const twoFAResponse = await api.get('/api/settings/2fa/status');
      if (twoFAResponse.data) {
        setSecuritySettings(prev => ({
          ...prev,
          twoFactorEnabled: twoFAResponse.data.enabled,
          backupCodesCount: twoFAResponse.data.backupCodesCount || 0,
          last2FAActivity: twoFAResponse.data.lastActivity
        }));
      }
    } catch (error) {
      console.error('Error fetching security settings:', error);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const response = await api.get('/businesses/team-members');
      setTeamMembers(response.data || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const fetchIntegrations = async () => {
    try {
      const response = await api.get('/businesses/integrations');
      if (response.data) {
        setIntegrations(response.data);
      }
    } catch (error) {
      console.error('Error fetching integrations:', error);
    }
  };

  const fetchPreferences = async () => {
    try {
      const response = await api.get('/businesses/preferences');
      if (response.data) {
        setPreferences(response.data);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  };

  // Account Settings Form
  const accountFormik = useFormik({
    enableReinitialize: true,
    initialValues: {
      businessName: businessData?.businessName || '',
      email: businessData?.email || '',
      phone: businessData?.phone || '',
      address: businessData?.address || '',
      city: businessData?.city || '',
      state: businessData?.state || '',
      country: businessData?.country || '',
      zipCode: businessData?.zipCode || '',
      timezone: businessData?.timezone || 'America/New_York',
      language: businessData?.language || 'en',
    },
    validationSchema: Yup.object({
      businessName: Yup.string().required('Business name is required'),
      email: Yup.string().email('Invalid email').required('Email is required'),
      phone: Yup.string(),
      address: Yup.string(),
      city: Yup.string(),
      state: Yup.string(),
      country: Yup.string(),
      zipCode: Yup.string(),
      timezone: Yup.string(),
      language: Yup.string(),
    }),
    onSubmit: async (values) => {
      setSavingSection('account');
      try {
        await api.put('/businesses/profile', values);
        toast.success('Account settings updated successfully');
        fetchBusinessData();
      } catch (error) {
        toast.error('Failed to update account settings');
      } finally {
        setSavingSection(null);
      }
    },
  });

  // Password Change Form
  const passwordFormik = useFormik({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema: Yup.object({
      currentPassword: Yup.string().required('Current password is required'),
      newPassword: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .required('New password is required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword'), null], 'Passwords must match')
        .required('Please confirm your password'),
    }),
    onSubmit: async (values) => {
      setSavingSection('password');
      try {
        await api.post('/auth/change-password', {
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        });
        toast.success('Password changed successfully');
        setShowPasswordForm(false);
        passwordFormik.resetForm();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to change password');
      } finally {
        setSavingSection(null);
      }
    },
  });

  // Notification toggle handler
  const handleNotificationToggle = async (category, type) => {
    const newSettings = { ...notificationSettings };
    newSettings[category][type] = !newSettings[category][type];
    setNotificationSettings(newSettings);
    
    try {
      await api.put('/businesses/notification-settings', newSettings);
      toast.success('Notification settings updated');
    } catch (error) {
      toast.error('Failed to update notification settings');
      // Revert the change
      setNotificationSettings(notificationSettings);
    }
  };

  // Team member invitation
  const handleInviteTeamMember = async (email, role) => {
    try {
      await api.post('/businesses/team-members/invite', { email, role });
      toast.success(`Invitation sent to ${email}`);
      setShowInviteModal(false);
      fetchTeamMembers();
    } catch (error) {
      toast.error('Failed to send invitation');
    }
  };

  // Remove team member
  const handleRemoveTeamMember = async (memberId) => {
    if (window.confirm('Are you sure you want to remove this team member?')) {
      try {
        await api.delete(`/businesses/team-members/${memberId}`);
        toast.success('Team member removed');
        fetchTeamMembers();
      } catch (error) {
        toast.error('Failed to remove team member');
      }
    }
  };

  // 2FA Setup Functions
  const start2FASetup = async () => {
    setShow2FASetupModal(true);
    setSetupStep(1);
    setSetupPassword('');
    setVerificationCode('');
  };

  const verify2FAPassword = async () => {
    if (!setupPassword) {
      toast.error('Please enter your password');
      return;
    }
    
    try {
      setSetting2FA(true);
      const response = await api.post('/api/settings/2fa/setup', {
        password: setupPassword
      });
      
      setTwoFactorData(response.data);
      setSetupStep(2);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid password');
    } finally {
      setSetting2FA(false);
    }
  };

  const verify2FACode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }
    
    try {
      setSetting2FA(true);
      const response = await api.post('/api/settings/2fa/verify', {
        code: verificationCode
      });
      
      setBackupCodes(response.data.backupCodes || []);
      setSetupStep(3);
      
      // Update security settings
      setSecuritySettings(prev => ({
        ...prev,
        twoFactorEnabled: true,
        backupCodesCount: response.data.backupCodes?.length || 0
      }));
      
      toast.success('Two-factor authentication enabled successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid verification code');
    } finally {
      setSetting2FA(false);
    }
  };

  const complete2FASetup = () => {
    setShow2FASetupModal(false);
    setSetupStep(1);
    setSetupPassword('');
    setVerificationCode('');
    setTwoFactorData(null);
    fetchSecuritySettings();
  };

  const disable2FA = async () => {
    if (!disablePassword || !disableCode) {
      toast.error('Please enter both your password and 2FA code');
      return;
    }
    
    try {
      setSetting2FA(true);
      await api.post('/api/settings/2fa/disable', {
        password: disablePassword,
        code: disableCode
      });
      
      setSecuritySettings(prev => ({
        ...prev,
        twoFactorEnabled: false,
        backupCodesCount: 0
      }));
      
      setShow2FADisableModal(false);
      setDisablePassword('');
      setDisableCode('');
      
      toast.success('Two-factor authentication disabled');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to disable 2FA');
    } finally {
      setSetting2FA(false);
    }
  };

  const generateNewBackupCodes = async () => {
    try {
      const response = await api.post('/api/settings/2fa/backup-codes');
      setBackupCodes(response.data.backupCodes || []);
      setShowBackupCodesModal(true);
      
      setSecuritySettings(prev => ({
        ...prev,
        backupCodesCount: response.data.backupCodes?.length || 0
      }));
      
      toast.success('New backup codes generated');
    } catch (error) {
      toast.error('Failed to generate new backup codes');
    }
  };

  const downloadBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `linkage-va-hub-backup-codes-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy to clipboard');
    });
  };

  // Integration handlers
  const handleConnectIntegration = async (integration) => {
    try {
      const response = await api.post(`/businesses/integrations/${integration}/connect`);
      if (response.data.authUrl) {
        window.open(response.data.authUrl, '_blank');
      }
      toast.success(`Connecting to ${integration}...`);
    } catch (error) {
      toast.error(`Failed to connect ${integration}`);
    }
  };

  const handleDisconnectIntegration = async (integration) => {
    if (window.confirm(`Are you sure you want to disconnect ${integration}?`)) {
      try {
        await api.delete(`/businesses/integrations/${integration}`);
        setIntegrations(prev => ({
          ...prev,
          [integration]: { connected: false }
        }));
        toast.success(`${integration} disconnected`);
      } catch (error) {
        toast.error(`Failed to disconnect ${integration}`);
      }
    }
  };

  // Render section content
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'account':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Account Information</h3>
              <p className="mt-1 text-sm text-gray-700">
                Update your business information and contact details.
              </p>
            </div>

            <form onSubmit={accountFormik.handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
                    Business Name
                  </label>
                  <input
                    type="text"
                    id="businessName"
                    {...accountFormik.getFieldProps('businessName')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {accountFormik.touched.businessName && accountFormik.errors.businessName && (
                    <p className="mt-1 text-sm text-red-600">{accountFormik.errors.businessName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                    {businessData?.emailVerified && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircleIcon className="h-3 w-3 mr-1" />
                        Verified
                      </span>
                    )}
                  </label>
                  <input
                    type="email"
                    id="email"
                    {...accountFormik.getFieldProps('email')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {accountFormik.touched.email && accountFormik.errors.email && (
                    <p className="mt-1 text-sm text-red-600">{accountFormik.errors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                    {phoneVerified && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircleIcon className="h-3 w-3 mr-1" />
                        Verified
                      </span>
                    )}
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    {...accountFormik.getFieldProps('phone')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
                    Time Zone
                  </label>
                  <select
                    id="timezone"
                    {...accountFormik.getFieldProps('timezone')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="America/Phoenix">Arizona Time</option>
                    <option value="Pacific/Honolulu">Hawaii Time</option>
                    <option value="America/Anchorage">Alaska Time</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Business Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    {...accountFormik.getFieldProps('address')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    {...accountFormik.getFieldProps('city')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                    State/Province
                  </label>
                  <input
                    type="text"
                    id="state"
                    {...accountFormik.getFieldProps('state')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                    Country
                  </label>
                  <input
                    type="text"
                    id="country"
                    {...accountFormik.getFieldProps('country')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
                    ZIP/Postal Code
                  </label>
                  <input
                    type="text"
                    id="zipCode"
                    {...accountFormik.getFieldProps('zipCode')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                    Language Preference
                  </label>
                  <select
                    id="language"
                    {...accountFormik.getFieldProps('language')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="zh">Chinese</option>
                    <option value="ja">Japanese</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingSection === 'account'}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {savingSection === 'account' ? (
                    <>
                      <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Notification Preferences</h3>
              <p className="mt-1 text-sm text-gray-700">
                Choose how you want to receive notifications.
              </p>
            </div>

            {/* Email Notifications */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <EnvelopeIcon className="h-5 w-5 text-gray-700 mr-2" />
                <h4 className="text-base font-medium text-gray-900">Email Notifications</h4>
              </div>
              <div className="space-y-4">
                {Object.entries(notificationSettings.email).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </p>
                      <p className="text-xs text-gray-700">
                        {getNotificationDescription(key)}
                      </p>
                    </div>
                    <Switch
                      checked={value}
                      onChange={() => handleNotificationToggle('email', key)}
                      className={`${
                        value ? 'bg-blue-600' : 'bg-gray-200'
                      } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                    >
                      <span className="sr-only">Enable {key}</span>
                      <span
                        className={`${
                          value ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                      />
                    </Switch>
                  </div>
                ))}
              </div>
            </div>

            {/* SMS Notifications */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <DevicePhoneMobileIcon className="h-5 w-5 text-gray-700 mr-2" />
                <h4 className="text-base font-medium text-gray-900">SMS Notifications</h4>
                {!phoneVerified && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                    Phone verification required
                  </span>
                )}
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Enable SMS Notifications</p>
                    <p className="text-xs text-gray-700">
                      Receive important alerts via text message
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.sms.enabled}
                    onChange={() => handleNotificationToggle('sms', 'enabled')}
                    disabled={!phoneVerified}
                    className={`${
                      notificationSettings.sms.enabled ? 'bg-blue-600' : 'bg-gray-200'
                    } relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      !phoneVerified ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <span className="sr-only">Enable SMS</span>
                    <span
                      className={`${
                        notificationSettings.sms.enabled ? 'translate-x-6' : 'translate-x-1'
                      } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                    />
                  </Switch>
                </div>
                {notificationSettings.sms.enabled && phoneVerified && (
                  <>
                    {Object.entries(notificationSettings.sms).filter(([key]) => key !== 'enabled').map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between pl-6">
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </p>
                        </div>
                        <Switch
                          checked={value}
                          onChange={() => handleNotificationToggle('sms', key)}
                          className={`${
                            value ? 'bg-blue-600' : 'bg-gray-200'
                          } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                        >
                          <span className="sr-only">Enable {key}</span>
                          <span
                            className={`${
                              value ? 'translate-x-6' : 'translate-x-1'
                            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                          />
                        </Switch>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* In-App Notifications */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <ComputerDesktopIcon className="h-5 w-5 text-gray-700 mr-2" />
                <h4 className="text-base font-medium text-gray-900">In-App Notifications</h4>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Enable In-App Notifications</p>
                    <p className="text-xs text-gray-700">
                      Show notifications within the application
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.inApp.enabled}
                    onChange={() => handleNotificationToggle('inApp', 'enabled')}
                    className={`${
                      notificationSettings.inApp.enabled ? 'bg-blue-600' : 'bg-gray-200'
                    } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                  >
                    <span className="sr-only">Enable In-App</span>
                    <span
                      className={`${
                        notificationSettings.inApp.enabled ? 'translate-x-6' : 'translate-x-1'
                      } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                    />
                  </Switch>
                </div>
              </div>
            </div>

            {/* Notification Frequency */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <ClockIcon className="h-5 w-5 text-gray-700 mr-2" />
                <h4 className="text-base font-medium text-gray-900">Notification Frequency</h4>
              </div>
              <div className="space-y-2">
                {['instant', 'daily', 'weekly'].map(freq => (
                  <label key={freq} className="flex items-center">
                    <input
                      type="radio"
                      name="frequency"
                      value={freq}
                      checked={notificationSettings.frequency === freq}
                      onChange={(e) => {
                        setNotificationSettings(prev => ({
                          ...prev,
                          frequency: e.target.value
                        }));
                      }}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700 capitalize">
                      {freq === 'instant' ? 'Instant' : freq === 'daily' ? 'Daily Digest' : 'Weekly Summary'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
              <p className="mt-1 text-sm text-gray-700">
                Manage your account security and authentication.
              </p>
            </div>

            {/* Change Password */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <KeyIcon className="h-5 w-5 text-gray-700 mr-2" />
                  <h4 className="text-base font-medium text-gray-900">Password</h4>
                </div>
                <button
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {showPasswordForm ? 'Cancel' : 'Change Password'}
                </button>
              </div>
              
              {showPasswordForm && (
                <form onSubmit={passwordFormik.handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                      Current Password
                    </label>
                    <input
                      type="password"
                      id="currentPassword"
                      {...passwordFormik.getFieldProps('currentPassword')}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                    {passwordFormik.touched.currentPassword && passwordFormik.errors.currentPassword && (
                      <p className="mt-1 text-sm text-red-600">{passwordFormik.errors.currentPassword}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                      New Password
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      {...passwordFormik.getFieldProps('newPassword')}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                    {passwordFormik.touched.newPassword && passwordFormik.errors.newPassword && (
                      <p className="mt-1 text-sm text-red-600">{passwordFormik.errors.newPassword}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      {...passwordFormik.getFieldProps('confirmPassword')}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                    {passwordFormik.touched.confirmPassword && passwordFormik.errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{passwordFormik.errors.confirmPassword}</p>
                    )}
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={savingSection === 'password'}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {savingSection === 'password' ? 'Changing...' : 'Change Password'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Two-Factor Authentication */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <ShieldCheckIcon className="h-5 w-5 text-gray-700 mr-2" />
                  <div>
                    <h4 className="text-base font-medium text-gray-900">Google Authenticator (2FA)</h4>
                    <p className="text-sm text-gray-700">
                      Add an extra layer of security with time-based codes
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {securitySettings.twoFactorEnabled ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircleIcon className="h-3 w-3 mr-1" />
                      Enabled
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <XCircleIcon className="h-3 w-3 mr-1" />
                      Disabled
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {securitySettings.twoFactorEnabled ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center">
                          <KeyIcon className="h-4 w-4 text-gray-700 mr-2" />
                          <span className="text-sm font-medium text-gray-700">Backup Codes</span>
                        </div>
                        <p className="text-lg font-semibold text-gray-900 mt-1">
                          {securitySettings.backupCodesCount} remaining
                        </p>
                      </div>
                      {securitySettings.last2FAActivity && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 text-gray-700 mr-2" />
                            <span className="text-sm font-medium text-gray-700">Last Used</span>
                          </div>
                          <p className="text-sm text-gray-900 mt-1">
                            {format(new Date(securitySettings.last2FAActivity), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={generateNewBackupCodes}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <ArrowPathIcon className="h-4 w-4 mr-2" />
                        Generate New Backup Codes
                      </button>
                      <button
                        onClick={() => setShow2FADisableModal(true)}
                        className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <XMarkIcon className="h-4 w-4 mr-2" />
                        Disable 2FA
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <QrCodeIcon className="mx-auto h-12 w-12 text-gray-700 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Secure Your Account</h3>
                    <p className="text-sm text-gray-700 mb-6 max-w-md mx-auto">
                      Enable two-factor authentication using Google Authenticator, Authy, or any compatible TOTP app for enhanced security.
                    </p>
                    <button
                      onClick={start2FASetup}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <ShieldCheckIcon className="h-4 w-4 mr-2" />
                      Enable 2FA
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Login History */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <ClockIcon className="h-5 w-5 text-gray-700 mr-2" />
                <h4 className="text-base font-medium text-gray-900">Recent Login Activity</h4>
              </div>
              {securitySettings.sessions && securitySettings.sessions.length > 0 ? (
                <div className="space-y-3">
                  {securitySettings.sessions.slice(0, 5).map((session, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {session.device || 'Unknown Device'}
                        </p>
                        <p className="text-xs text-gray-700">
                          {session.location || 'Unknown Location'} • {format(new Date(session.timestamp), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                      {session.current && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Current
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-700">No recent login activity</p>
              )}
            </div>

            {/* API Keys */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <KeyIcon className="h-5 w-5 text-gray-700 mr-2" />
                  <h4 className="text-base font-medium text-gray-900">API Keys</h4>
                </div>
                <button
                  onClick={async () => {
                    try {
                      const response = await api.post('/businesses/api-keys');
                      toast.success('API key generated');
                      fetchSecuritySettings();
                    } catch (error) {
                      toast.error('Failed to generate API key');
                    }
                  }}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Generate New Key
                </button>
              </div>
              
              {securitySettings.apiKeys && securitySettings.apiKeys.length > 0 ? (
                <div className="space-y-2">
                  {securitySettings.apiKeys.map(key => (
                    <div key={key.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{key.name}</p>
                        <p className="text-xs text-gray-700">
                          Created {format(new Date(key.createdAt), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to delete this API key?')) {
                            try {
                              await api.delete(`/businesses/api-keys/${key.id}`);
                              toast.success('API key deleted');
                              fetchSecuritySettings();
                            } catch (error) {
                              toast.error('Failed to delete API key');
                            }
                          }
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-700">No API keys generated</p>
              )}
            </div>
          </div>
        );

      case 'team':
        return (
          <div className="space-y-6">
            <div className="text-center py-12">
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gray-100">
                <UsersIcon className="h-10 w-10 text-gray-700" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Team Management</h3>
              <p className="mt-2 text-sm text-gray-700 max-w-sm mx-auto">
                Team collaboration features are coming soon. You'll be able to invite team members and manage permissions.
              </p>
              <div className="mt-6">
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  Coming Soon
                </span>
              </div>
            </div>
          </div>
        );

      case 'integrations':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Integrations</h3>
              <p className="mt-1 text-sm text-gray-700">
                Connect your account with third-party services.
              </p>
            </div>

            {/* Calendar Integration */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-gray-700 mr-2" />
                  <div>
                    <h4 className="text-base font-medium text-gray-900">Calendar Integration</h4>
                    <p className="text-sm text-gray-700">Sync VA schedules with your calendar</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <img src="https://www.google.com/favicon.ico" alt="Google" className="h-5 w-5 mr-2" />
                    <span className="text-sm font-medium text-gray-900">Google Calendar</span>
                  </div>
                  {integrations.google.connected ? (
                    <button
                      onClick={() => handleDisconnectIntegration('google')}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnectIntegration('google')}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Connect
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <img src="https://outlook.live.com/favicon.ico" alt="Outlook" className="h-5 w-5 mr-2" />
                    <span className="text-sm font-medium text-gray-900">Outlook Calendar</span>
                  </div>
                  {integrations.outlook.connected ? (
                    <button
                      onClick={() => handleDisconnectIntegration('outlook')}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnectIntegration('outlook')}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Communication Integration */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <LinkIcon className="h-5 w-5 text-gray-700 mr-2" />
                  <div>
                    <h4 className="text-base font-medium text-gray-900">Communication Tools</h4>
                    <p className="text-sm text-gray-700">Get notifications in your preferred channels</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <img src="https://slack.com/favicon.ico" alt="Slack" className="h-5 w-5 mr-2" />
                    <span className="text-sm font-medium text-gray-900">Slack</span>
                  </div>
                  {integrations.slack.connected ? (
                    <button
                      onClick={() => handleDisconnectIntegration('slack')}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnectIntegration('slack')}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Automation Integration */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <CogIcon className="h-5 w-5 text-gray-700 mr-2" />
                  <div>
                    <h4 className="text-base font-medium text-gray-900">Automation</h4>
                    <p className="text-sm text-gray-700">Connect with automation platforms</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <img src="https://zapier.com/favicon.ico" alt="Zapier" className="h-5 w-5 mr-2" />
                      <span className="text-sm font-medium text-gray-900">Zapier</span>
                    </div>
                    {integrations.zapier.connected ? (
                      <button
                        onClick={() => handleDisconnectIntegration('zapier')}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Disconnect
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConnectIntegration('zapier')}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        Setup Webhook
                      </button>
                    )}
                  </div>
                  {integrations.zapier.webhook && (
                    <div className="mt-2">
                      <label className="block text-xs font-medium text-gray-700">Webhook URL</label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <input
                          type="text"
                          value={integrations.zapier.webhook}
                          readOnly
                          className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-gray-300 bg-gray-50 text-sm"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(integrations.zapier.webhook);
                            toast.success('Webhook URL copied to clipboard');
                          }}
                          className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-700 text-sm hover:bg-gray-100"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* API Documentation */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <DocumentArrowDownIcon className="h-5 w-5 text-gray-700 mr-2" />
                  <div>
                    <h4 className="text-base font-medium text-gray-900">API Documentation</h4>
                    <p className="text-sm text-gray-700">Build custom integrations with our API</p>
                  </div>
                </div>
                <a
                  href="/api-docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  View Docs
                  <ChevronRightIcon className="ml-1 h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Preferences</h3>
              <p className="mt-1 text-sm text-gray-700">
                Configure default settings for your VA management.
              </p>
            </div>

            {/* Working Hours */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <ClockIcon className="h-5 w-5 text-gray-700 mr-2" />
                <h4 className="text-base font-medium text-gray-900">Default Working Hours</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                    Start Time
                  </label>
                  <input
                    type="time"
                    id="startTime"
                    value={preferences.defaultWorkingHours.start}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      defaultWorkingHours: {
                        ...prev.defaultWorkingHours,
                        start: e.target.value
                      }
                    }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                    End Time
                  </label>
                  <input
                    type="time"
                    id="endTime"
                    value={preferences.defaultWorkingHours.end}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      defaultWorkingHours: {
                        ...prev.defaultWorkingHours,
                        end: e.target.value
                      }
                    }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* VA Preferences */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <UserCircleIcon className="h-5 w-5 text-gray-700 mr-2" />
                <h4 className="text-base font-medium text-gray-900">VA Preferences</h4>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred VA Specialties
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Admin Support', 'Customer Service', 'Social Media', 'Content Writing', 'Data Entry', 'Research'].map(specialty => (
                      <label key={specialty} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={preferences.preferredSpecialties?.includes(specialty)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPreferences(prev => ({
                                ...prev,
                                preferredSpecialties: [...(prev.preferredSpecialties || []), specialty]
                              }));
                            } else {
                              setPreferences(prev => ({
                                ...prev,
                                preferredSpecialties: prev.preferredSpecialties?.filter(s => s !== specialty)
                              }));
                            }
                          }}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{specialty}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Auto-approve VA Applications</p>
                    <p className="text-xs text-gray-700">
                      Automatically approve VA applications that meet your criteria
                    </p>
                  </div>
                  <Switch
                    checked={preferences.autoApproveApplications}
                    onChange={(value) => setPreferences(prev => ({ ...prev, autoApproveApplications: value }))}
                    className={`${
                      preferences.autoApproveApplications ? 'bg-blue-600' : 'bg-gray-200'
                    } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                  >
                    <span className="sr-only">Auto-approve</span>
                    <span
                      className={`${
                        preferences.autoApproveApplications ? 'translate-x-6' : 'translate-x-1'
                      } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                    />
                  </Switch>
                </div>

                <div>
                  <label htmlFor="trialDuration" className="block text-sm font-medium text-gray-700">
                    Default Trial Duration (hours)
                  </label>
                  <input
                    type="number"
                    id="trialDuration"
                    min="1"
                    max="40"
                    value={preferences.defaultTrialDuration}
                    onChange={(e) => setPreferences(prev => ({ ...prev, defaultTrialDuration: parseInt(e.target.value) }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Save Preferences Button */}
            <div className="flex justify-end">
              <button
                onClick={async () => {
                  setSavingSection('preferences');
                  try {
                    await api.put('/businesses/preferences', preferences);
                    toast.success('Preferences saved successfully');
                  } catch (error) {
                    toast.error('Failed to save preferences');
                  } finally {
                    setSavingSection(null);
                  }
                }}
                disabled={savingSection === 'preferences'}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {savingSection === 'preferences' ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Data & Privacy</h3>
              <p className="mt-1 text-sm text-gray-700">
                Manage your data and privacy settings.
              </p>
            </div>

            {/* Data Export */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ArrowDownTrayIcon className="h-5 w-5 text-gray-700 mr-2" />
                  <div>
                    <h4 className="text-base font-medium text-gray-900">Export Your Data</h4>
                    <p className="text-sm text-gray-700">
                      Download all your data in JSON format
                    </p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    try {
                      const response = await api.get('/businesses/export-data', {
                        responseType: 'blob'
                      });
                      const url = window.URL.createObjectURL(new Blob([response.data]));
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute('download', `business-data-${Date.now()}.json`);
                      document.body.appendChild(link);
                      link.click();
                      toast.success('Data export started');
                    } catch (error) {
                      toast.error('Failed to export data');
                    }
                  }}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                  Download
                </button>
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <EyeIcon className="h-5 w-5 text-gray-700 mr-2" />
                <h4 className="text-base font-medium text-gray-900">Privacy Settings</h4>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Profile Visibility</p>
                    <p className="text-xs text-gray-700">Allow VAs to see your company profile</p>
                  </div>
                  <Switch
                    checked={true}
                    onChange={() => {}}
                    className="bg-blue-600 relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                  >
                    <span className="sr-only">Profile visibility</span>
                    <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition-transform" />
                  </Switch>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Share Usage Analytics</p>
                    <p className="text-xs text-gray-700">Help us improve by sharing anonymous usage data</p>
                  </div>
                  <Switch
                    checked={false}
                    onChange={() => {}}
                    className="bg-gray-200 relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                  >
                    <span className="sr-only">Share analytics</span>
                    <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition-transform" />
                  </Switch>
                </div>
              </div>
            </div>

            {/* Data Retention */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <ClockIcon className="h-5 w-5 text-gray-700 mr-2" />
                <h4 className="text-base font-medium text-gray-900">Data Retention</h4>
              </div>
              <div>
                <label htmlFor="retention" className="block text-sm font-medium text-gray-700">
                  Automatically delete old data after
                </label>
                <select
                  id="retention"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="never">Never</option>
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                  <option value="180">180 days</option>
                  <option value="365">1 year</option>
                </select>
              </div>
            </div>

            {/* Delete Account */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                  <div>
                    <h4 className="text-base font-medium text-red-900">Delete Account</h4>
                    <p className="text-sm text-red-700">
                      Permanently delete your account and all associated data
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Helper function for notification descriptions
  const getNotificationDescription = (key) => {
    const descriptions = {
      newApplications: 'Get notified when a VA applies to work with you',
      trialExpiration: 'Reminders before your VA trials expire',
      paymentConfirmations: 'Confirmation of successful payments',
      weeklyReports: 'Weekly summary of VA activity and performance',
      systemUpdates: 'Important system updates and announcements',
    };
    return descriptions[key] || '';
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Sidebar Navigation */}
      <div className="lg:w-64">
        <nav className="space-y-1">
          {settingsSections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeSection === section.id
                    ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                {section.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-w-0">
        <div className="bg-white shadow rounded-lg p-6">
          {renderSectionContent()}
        </div>
      </div>

      {/* Invite Team Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Invite Team Member</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleInviteTeamMember(formData.get('email'), formData.get('role'));
              }}
            >
              <div className="space-y-4">
                <div>
                  <label htmlFor="inviteEmail" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="inviteEmail"
                    name="email"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="inviteRole" className="block text-sm font-medium text-gray-700">
                    Role
                  </label>
                  <select
                    id="inviteRole"
                    name="role"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="member">Member</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2FA Setup Modal */}
      {show2FASetupModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Enable Two-Factor Authentication</h3>
                <button
                  onClick={() => setShow2FASetupModal(false)}
                  className="text-gray-700 hover:text-gray-700"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              
              {/* Progress Steps */}
              <div className="mt-4">
                <div className="flex items-center">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                        setupStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {setupStep > step ? <CheckIcon className="h-4 w-4" /> : step}
                      </div>
                      {step < 3 && (
                        <div className={`flex-1 h-1 mx-2 ${
                          setupStep > step ? 'bg-blue-600' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-700">
                  <span>Verify Password</span>
                  <span>Scan QR Code</span>
                  <span>Backup Codes</span>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-6">
              {setupStep === 1 && (
                <div className="space-y-4">
                  <div className="text-center">
                    <KeyIcon className="mx-auto h-12 w-12 text-blue-600 mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Verify Your Password</h4>
                    <p className="text-sm text-gray-700">
                      Please enter your current password to continue with 2FA setup.
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="setupPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      id="setupPassword"
                      value={setupPassword}
                      onChange={(e) => setSetupPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      onKeyPress={(e) => e.key === 'Enter' && verify2FAPassword()}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShow2FASetupModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={verify2FAPassword}
                      disabled={!setupPassword || setting2FA}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {setting2FA ? 'Verifying...' : 'Continue'}
                    </button>
                  </div>
                </div>
              )}
              
              {setupStep === 2 && twoFactorData && (
                <div className="space-y-6">
                  <div className="text-center">
                    <QrCodeIcon className="mx-auto h-12 w-12 text-blue-600 mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Scan QR Code</h4>
                    <p className="text-sm text-gray-700">
                      Use Google Authenticator, Authy, or any compatible TOTP app to scan this QR code.
                    </p>
                  </div>
                  
                  {/* QR Code */}
                  <div className="flex justify-center">
                    <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                      <img
                        src={twoFactorData.qrCode}
                        alt="2FA QR Code"
                        className="w-48 h-48"
                      />
                    </div>
                  </div>
                  
                  {/* Manual Entry Key */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Manual Entry Key:</span>
                      <button
                        onClick={() => copyToClipboard(twoFactorData.secret)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <DocumentDuplicateIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <code className="text-sm font-mono text-gray-900 break-all">
                      {twoFactorData.secret}
                    </code>
                  </div>
                  
                  {/* Verification Code Input */}
                  <div>
                    <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-2">
                      Enter 6-digit code from your app:
                    </label>
                    <input
                      type="text"
                      id="verificationCode"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                      placeholder="000000"
                      className="block w-full text-center text-lg font-mono tracking-widest rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      maxLength="6"
                      onKeyPress={(e) => e.key === 'Enter' && verificationCode.length === 6 && verify2FACode()}
                    />
                    <p className="mt-1 text-xs text-gray-700">
                      Enter the 6-digit code shown in your authenticator app
                    </p>
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setSetupStep(1);
                        setTwoFactorData(null);
                        setVerificationCode('');
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Back
                    </button>
                    <button
                      onClick={verify2FACode}
                      disabled={verificationCode.length !== 6 || setting2FA}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {setting2FA ? 'Verifying...' : 'Verify & Enable'}
                    </button>
                  </div>
                </div>
              )}
              
              {setupStep === 3 && backupCodes.length > 0 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <CheckCircleIcon className="mx-auto h-12 w-12 text-green-600 mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">2FA Enabled Successfully!</h4>
                    <p className="text-sm text-gray-700">
                      Save these backup codes in a safe place. You can use them to access your account if you lose your phone.
                    </p>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex">
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">Important</h3>
                        <p className="mt-1 text-sm text-yellow-700">
                          Each backup code can only be used once. Store them securely and don't share them with anyone.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Backup Codes */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-sm font-medium text-gray-700">Backup Codes</h5>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => copyToClipboard(backupCodes.join('\n'))}
                          className="text-blue-600 hover:text-blue-700"
                          title="Copy all codes"
                        >
                          <DocumentDuplicateIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={downloadBackupCodes}
                          className="text-blue-600 hover:text-blue-700"
                          title="Download as text file"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {backupCodes.map((code, index) => (
                        <div key={index} className="bg-white rounded border p-2">
                          <code className="text-sm font-mono text-gray-900">{code}</code>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      onClick={complete2FASetup}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Complete Setup
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* 2FA Disable Modal */}
      {show2FADisableModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Disable Two-Factor Authentication</h3>
              </div>
            </div>
            
            <div className="px-6 py-6">
              <div className="mb-4">
                <p className="text-sm text-gray-700">
                  Disabling 2FA will make your account less secure. Please enter your password and a current 2FA code to confirm.
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="disablePassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    id="disablePassword"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    placeholder="Enter your password"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="disableCode" className="block text-sm font-medium text-gray-700 mb-1">
                    2FA Code
                  </label>
                  <input
                    type="text"
                    id="disableCode"
                    value={disableCode}
                    onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                    placeholder="000000"
                    className="block w-full text-center font-mono tracking-widest rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                    maxLength="6"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShow2FADisableModal(false);
                    setDisablePassword('');
                    setDisableCode('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={disable2FA}
                  disabled={!disablePassword || !disableCode || setting2FA}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {setting2FA ? 'Disabling...' : 'Disable 2FA'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Backup Codes Modal */}
      {showBackupCodesModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">New Backup Codes</h3>
                <button
                  onClick={() => setShowBackupCodesModal(false)}
                  className="text-gray-700 hover:text-gray-700"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="px-6 py-6">
              <div className="mb-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">Important</h3>
                      <p className="mt-1 text-sm text-yellow-700">
                        Your previous backup codes are now invalid. Save these new codes securely.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Backup Codes */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-sm font-medium text-gray-700">Backup Codes</h5>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => copyToClipboard(backupCodes.join('\n'))}
                      className="text-blue-600 hover:text-blue-700"
                      title="Copy all codes"
                    >
                      <DocumentDuplicateIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={downloadBackupCodes}
                      className="text-blue-600 hover:text-blue-700"
                      title="Download as text file"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="bg-white rounded border p-2">
                      <code className="text-sm font-mono text-gray-900">{code}</code>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => setShowBackupCodesModal(false)}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Delete Account</h3>
            </div>
            <p className="text-sm text-gray-700 mb-4">
              This action cannot be undone. All your data, including VA connections, payment history, and settings will be permanently deleted.
            </p>
            <p className="text-sm text-gray-700 mb-4">
              Please type <strong>DELETE</strong> to confirm:
            </p>
            <input
              type="text"
              id="deleteConfirm"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm mb-6"
              placeholder="Type DELETE to confirm"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const confirmText = document.getElementById('deleteConfirm').value;
                  if (confirmText === 'DELETE') {
                    try {
                      await api.delete('/businesses/account');
                      toast.success('Account deleted successfully');
                      // Redirect to login or home page
                      window.location.href = '/';
                    } catch (error) {
                      toast.error('Failed to delete account');
                    }
                  } else {
                    toast.error('Please type DELETE to confirm');
                  }
                }}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsTab;