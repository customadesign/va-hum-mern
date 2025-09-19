import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Card, 
  Tabs, 
  Form, 
  Switch, 
  Select, 
  InputNumber, 
  Button, 
  Space, 
  message, 
  Spin,
  Alert,
  Row,
  Col,
  Divider,
  Typography,
  Tag,
  Tooltip,
  Modal,
  Upload,
  Badge
} from 'antd';
import {
  BellOutlined,
  LockOutlined,
  DesktopOutlined,
  DatabaseOutlined,
  UserOutlined,
  ApiOutlined,
  ThunderboltOutlined,
  AppstoreOutlined,
  DashboardOutlined,
  MailOutlined,
  SaveOutlined,
  ReloadOutlined,
  ExportOutlined,
  ImportOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import api from '../services/api';
import { debounce } from 'lodash';
import './styles/settings.css';

const { TabPane } = Tabs;
const { Option } = Select;
const { Title, Text, Paragraph } = Typography;

// Cache key and duration
const CACHE_KEY = 'admin_settings_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const Settings = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('notifications');
  const [settings, setSettings] = useState(null);
  const [defaults, setDefaults] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);

  // Performance: Memoize tab icons
  const tabIcons = useMemo(() => ({
    notifications: <BellOutlined />,
    security: <LockOutlined />,
    display: <DesktopOutlined />,
    dataManagement: <DatabaseOutlined />,
    userManagement: <UserOutlined />,
    apiSettings: <ApiOutlined />,
    performance: <ThunderboltOutlined />,
    integrations: <AppstoreOutlined />,
    dashboard: <DashboardOutlined />,
    communication: <MailOutlined />
  }), []);

  // Load settings with caching
  const loadSettings = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);

      // Check cache first
      if (!forceRefresh) {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            setSettings(data.settings);
            setDefaults(data.defaults);
            form.setFieldsValue(data.settings);
            setLoading(false);
            return;
          }
        }
      }

      const response = await api.get('/admin/settings');
      const { settings: fetchedSettings, defaults: fetchedDefaults } = response.data;
      
      // Update state
      setSettings(fetchedSettings);
      setDefaults(fetchedDefaults);
      form.setFieldsValue(fetchedSettings);

      // Cache the data
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({
        data: { settings: fetchedSettings, defaults: fetchedDefaults },
        timestamp: Date.now()
      }));

      message.success('Settings loaded successfully');
    } catch (error) {
      console.error('Error loading settings:', error);
      message.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [form]);

  // Debounced save function for auto-save
  const debouncedSave = useMemo(
    () => debounce(async (values) => {
      try {
        setSaving(true);
        await api.put('/admin/settings', { settings: values });
        
        // Update cache
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const cacheData = JSON.parse(cached);
          cacheData.data.settings = values;
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        }
        
        setSettings(values);
        setUnsavedChanges(false);
        message.success('Settings saved automatically');
      } catch (error) {
        console.error('Error saving settings:', error);
        message.error('Failed to save settings');
      } finally {
        setSaving(false);
      }
    }, 2000),
    []
  );

  // Handle form changes
  const handleFormChange = useCallback((changedValues, allValues) => {
    setUnsavedChanges(true);
    if (allValues.performance?.autoSave?.enabled) {
      debouncedSave(allValues);
    }
  }, [debouncedSave]);

  // Manual save
  const handleSave = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      
      await api.put('/admin/settings', { settings: values });
      
      // Clear cache to force refresh
      sessionStorage.removeItem(CACHE_KEY);
      
      setSettings(values);
      setUnsavedChanges(false);
      message.success('Settings saved successfully');
      
      // Reload to get fresh data
      await loadSettings(true);
    } catch (error) {
      console.error('Error saving settings:', error);
      message.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }, [form, loadSettings]);

  // Reset to defaults
  const handleReset = useCallback((category) => {
    Modal.confirm({
      title: 'Reset Settings',
      content: category 
        ? `Are you sure you want to reset ${category} settings to defaults?`
        : 'Are you sure you want to reset ALL settings to defaults?',
      okText: 'Reset',
      okType: 'danger',
      onOk: async () => {
        try {
          setLoading(true);
          await api.post('/admin/settings/reset', { category });
          
          // Clear cache
          sessionStorage.removeItem(CACHE_KEY);
          
          // Reload settings
          await loadSettings(true);
          
          message.success(`Settings reset to defaults`);
        } catch (error) {
          console.error('Error resetting settings:', error);
          message.error('Failed to reset settings');
        } finally {
          setLoading(false);
        }
      }
    });
  }, [loadSettings]);

  // Export settings
  const handleExport = useCallback(async () => {
    try {
      const response = await api.get('/admin/settings/export', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `settings-backup-${new Date().toISOString()}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      message.success('Settings exported successfully');
    } catch (error) {
      console.error('Error exporting settings:', error);
      message.error('Failed to export settings');
    }
  }, []);

  // Import settings
  const handleImport = useCallback(async (file) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!data.settings || !Array.isArray(data.settings)) {
        throw new Error('Invalid settings file format');
      }
      
      await api.post('/admin/settings/import', data);
      
      // Clear cache and reload
      sessionStorage.removeItem(CACHE_KEY);
      await loadSettings(true);
      
      setImportModalVisible(false);
      message.success('Settings imported successfully');
    } catch (error) {
      console.error('Error importing settings:', error);
      message.error('Failed to import settings: ' + error.message);
    }
    return false; // Prevent default upload
  }, [loadSettings]);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (unsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [unsavedChanges]);

  // Render notification settings
  const renderNotificationSettings = () => (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Card title="Email Notifications" className="settings-card">
          <Form.Item name={['notifications', 'email', 'enabled']} valuePropName="checked">
            <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
          </Form.Item>
          <Form.Item name={['notifications', 'email', 'criticalAlerts']} valuePropName="checked" label="Critical Alerts">
            <Switch />
          </Form.Item>
          <Form.Item name={['notifications', 'email', 'userActivity']} valuePropName="checked" label="User Activity">
            <Switch />
          </Form.Item>
          <Form.Item name={['notifications', 'email', 'systemUpdates']} valuePropName="checked" label="System Updates">
            <Switch />
          </Form.Item>
          <Form.Item name={['notifications', 'email', 'digestFrequency']} label="Digest Frequency">
            <Select>
              <Option value="daily">Daily</Option>
              <Option value="weekly">Weekly</Option>
              <Option value="monthly">Monthly</Option>
            </Select>
          </Form.Item>
        </Card>
      </Col>
      <Col span={24}>
        <Card title="In-App Notifications" className="settings-card">
          <Form.Item name={['notifications', 'inApp', 'enabled']} valuePropName="checked">
            <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
          </Form.Item>
          <Form.Item name={['notifications', 'inApp', 'soundEnabled']} valuePropName="checked" label="Sound Alerts">
            <Switch />
          </Form.Item>
          <Form.Item name={['notifications', 'inApp', 'desktopNotifications']} valuePropName="checked" label="Desktop Notifications">
            <Switch />
          </Form.Item>
        </Card>
      </Col>
    </Row>
  );

  // Render security settings
  const renderSecuritySettings = () => (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Card title="Two-Factor Authentication" className="settings-card">
          <Form.Item name={['security', 'twoFactorAuth', 'enabled']} valuePropName="checked">
            <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
          </Form.Item>
          <Form.Item name={['security', 'twoFactorAuth', 'required']} valuePropName="checked" label="Required for All Users">
            <Switch />
          </Form.Item>
        </Card>
      </Col>
      <Col span={24}>
        <Card title="Session Management" className="settings-card">
          <Form.Item name={['security', 'sessionTimeout']} label="Session Timeout (minutes)">
            <InputNumber min={5} max={1440} />
          </Form.Item>
          <Form.Item name={['security', 'loginAttempts', 'maxAttempts']} label="Max Login Attempts">
            <InputNumber min={3} max={10} />
          </Form.Item>
          <Form.Item name={['security', 'loginAttempts', 'lockoutDuration']} label="Lockout Duration (minutes)">
            <InputNumber min={5} max={60} />
          </Form.Item>
        </Card>
      </Col>
      <Col span={24}>
        <Card title="Password Requirements" className="settings-card">
          <Form.Item name={['security', 'passwordRequirements', 'minLength']} label="Minimum Length">
            <InputNumber min={6} max={32} />
          </Form.Item>
          <Form.Item name={['security', 'passwordRequirements', 'requireUppercase']} valuePropName="checked" label="Require Uppercase">
            <Switch />
          </Form.Item>
          <Form.Item name={['security', 'passwordRequirements', 'requireNumbers']} valuePropName="checked" label="Require Numbers">
            <Switch />
          </Form.Item>
          <Form.Item name={['security', 'passwordRequirements', 'requireSpecialChars']} valuePropName="checked" label="Require Special Characters">
            <Switch />
          </Form.Item>
          <Form.Item name={['security', 'passwordRequirements', 'expirationDays']} label="Password Expiration (days)">
            <InputNumber min={0} max={365} />
          </Form.Item>
        </Card>
      </Col>
    </Row>
  );

  // Render display settings
  const renderDisplaySettings = () => (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Card title="Theme & Appearance" className="settings-card">
          <Form.Item name={['display', 'theme']} label="Theme">
            <Select>
              <Option value="light">Light</Option>
              <Option value="dark">Dark</Option>
              <Option value="auto">Auto (System)</Option>
            </Select>
          </Form.Item>
          <Form.Item name={['display', 'compactMode']} valuePropName="checked" label="Compact Mode">
            <Switch />
          </Form.Item>
          <Form.Item name={['display', 'animations']} valuePropName="checked" label="Enable Animations">
            <Switch />
          </Form.Item>
        </Card>
      </Col>
      <Col span={24}>
        <Card title="Regional Settings" className="settings-card">
          <Form.Item name={['display', 'timezone']} label="Timezone">
            <Select>
              <Option value="auto">Auto Detect</Option>
              <Option value="UTC">UTC</Option>
              <Option value="America/New_York">Eastern Time</Option>
              <Option value="America/Chicago">Central Time</Option>
              <Option value="America/Denver">Mountain Time</Option>
              <Option value="America/Los_Angeles">Pacific Time</Option>
              <Option value="Asia/Manila">Philippines Time</Option>
            </Select>
          </Form.Item>
          <Form.Item name={['display', 'language']} label="Language">
            <Select>
              <Option value="en">English</Option>
              <Option value="es">Spanish</Option>
              <Option value="fr">French</Option>
            </Select>
          </Form.Item>
          <Form.Item name={['display', 'dateFormat']} label="Date Format">
            <Select>
              <Option value="MM/DD/YYYY">MM/DD/YYYY</Option>
              <Option value="DD/MM/YYYY">DD/MM/YYYY</Option>
              <Option value="YYYY-MM-DD">YYYY-MM-DD</Option>
            </Select>
          </Form.Item>
          <Form.Item name={['display', 'timeFormat']} label="Time Format">
            <Select>
              <Option value="12h">12 Hour</Option>
              <Option value="24h">24 Hour</Option>
            </Select>
          </Form.Item>
        </Card>
      </Col>
    </Row>
  );

  // Render performance settings
  const renderPerformanceSettings = () => (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Card title="Caching" className="settings-card">
          <Form.Item name={['performance', 'cache', 'enabled']} valuePropName="checked">
            <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
          </Form.Item>
          <Form.Item name={['performance', 'cache', 'duration']} label="Cache Duration (seconds)">
            <InputNumber min={60} max={86400} />
          </Form.Item>
          <Form.Item name={['performance', 'cache', 'strategy']} label="Cache Strategy">
            <Select>
              <Option value="memory">Memory</Option>
              <Option value="disk">Disk</Option>
              <Option value="hybrid">Hybrid</Option>
            </Select>
          </Form.Item>
        </Card>
      </Col>
      <Col span={24}>
        <Card title="Pagination & Loading" className="settings-card">
          <Form.Item name={['performance', 'pagination', 'defaultLimit']} label="Default Page Size">
            <InputNumber min={10} max={100} />
          </Form.Item>
          <Form.Item name={['performance', 'lazyLoading', 'enabled']} valuePropName="checked" label="Lazy Loading">
            <Switch />
          </Form.Item>
          <Form.Item name={['performance', 'autoSave', 'enabled']} valuePropName="checked" label="Auto-Save">
            <Switch />
          </Form.Item>
          <Form.Item name={['performance', 'autoSave', 'interval']} label="Auto-Save Interval (seconds)">
            <InputNumber min={30} max={300} />
          </Form.Item>
        </Card>
      </Col>
    </Row>
  );

  // Tab content renderer
  const renderTabContent = useCallback((tab) => {
    switch (tab) {
      case 'notifications':
        return renderNotificationSettings();
      case 'security':
        return renderSecuritySettings();
      case 'display':
        return renderDisplaySettings();
      case 'performance':
        return renderPerformanceSettings();
      // Add other tabs as needed
      default:
        return (
          <Alert
            message="Settings Category"
            description={`${tab} settings will be displayed here`}
            type="info"
            showIcon
          />
        );
    }
  }, []);

  if (loading && !settings) {
    return (
      <div className="settings-loading">
        <Spin size="large" tip="Loading settings..." />
      </div>
    );
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <Title level={2}>
          <SettingOutlined /> System Settings
        </Title>
        <Space>
          {unsavedChanges && (
            <Tag color="warning" icon={<WarningOutlined />}>
              Unsaved Changes
            </Tag>
          )}
          <Button 
            icon={<ReloadOutlined />} 
            onClick={() => loadSettings(true)}
            loading={loading}
          >
            Refresh
          </Button>
          <Button 
            icon={<ExportOutlined />} 
            onClick={handleExport}
          >
            Export
          </Button>
          <Button 
            icon={<ImportOutlined />} 
            onClick={() => setImportModalVisible(true)}
          >
            Import
          </Button>
          <Button 
            type="primary" 
            icon={<SaveOutlined />} 
            onClick={handleSave}
            loading={saving}
            disabled={!unsavedChanges}
          >
            Save Settings
          </Button>
        </Space>
      </div>

      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleFormChange}
        className="settings-form"
      >
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          className="settings-tabs"
          type="card"
        >
          {Object.keys(tabIcons).map(key => (
            <TabPane 
              tab={
                <span>
                  {tabIcons[key]}
                  {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                </span>
              } 
              key={key}
            >
              <div className="tab-content-wrapper">
                {renderTabContent(key)}
                <Divider />
                <div className="tab-actions">
                  <Button 
                    danger 
                    onClick={() => handleReset(key)}
                  >
                    Reset {key} to Defaults
                  </Button>
                </div>
              </div>
            </TabPane>
          ))}
        </Tabs>
      </Form>

      <Modal
        title="Import Settings"
        visible={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        footer={null}
      >
        <Upload.Dragger
          accept=".json"
          beforeUpload={handleImport}
          showUploadList={false}
        >
          <p className="ant-upload-drag-icon">
            <ImportOutlined />
          </p>
          <p className="ant-upload-text">Click or drag settings file to import</p>
          <p className="ant-upload-hint">
            Only JSON files exported from this system are supported
          </p>
        </Upload.Dragger>
      </Modal>
    </div>
  );
};

export default Settings;
