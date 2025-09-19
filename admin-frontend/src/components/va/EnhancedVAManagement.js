import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  message,
  Popconfirm,
  Tooltip,
  Badge,
  Typography,
  Row,
  Col,
  Statistic,
  Avatar,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UserOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

const EnhancedVAManagement = () => {
  const [vas, setVAs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingVA, setEditingVA] = useState(null);
  const [form] = Form.useForm();

  // Sample data - replace with real API calls
  const sampleVAs = [
    {
      id: 1,
      name: 'Sarah Johnson',
      email: 'sarah.j@linkage.ph',
      status: 'active',
      role: 'Customer Support',
      experience: '2 years',
      rating: 4.8,
      tasksCompleted: 156,
      lastActive: '2024-01-15T10:30:00Z',
      avatar: null,
    },
    {
      id: 2,
      name: 'Michael Chen',
      email: 'michael.c@linkage.ph',
      status: 'busy',
      role: 'Technical Support',
      experience: '3 years',
      rating: 4.9,
      tasksCompleted: 203,
      lastActive: '2024-01-15T09:45:00Z',
      avatar: null,
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      email: 'emily.r@linkage.ph',
      status: 'offline',
      role: 'Sales Support',
      experience: '1 year',
      rating: 4.6,
      tasksCompleted: 89,
      lastActive: '2024-01-14T18:20:00Z',
      avatar: null,
    },
  ];

  useEffect(() => {
    fetchVAs();
  }, []);

  const fetchVAs = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setVAs(sampleVAs);
    } catch (error) {
      message.error('Failed to fetch VAs');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green';
      case 'busy': return 'orange';
      case 'offline': return 'red';
      case 'maintenance': return 'purple';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircleOutlined />;
      case 'busy': return <ClockCircleOutlined />;
      case 'offline': return <ExclamationCircleOutlined />;
      default: return <UserOutlined />;
    }
  };

  const handleAddVA = () => {
    setEditingVA(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditVA = (va) => {
    setEditingVA(va);
    form.setFieldsValue(va);
    setModalVisible(true);
  };

  const handleDeleteVA = async (id) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setVAs(vas.filter(va => va.id !== id));
      message.success('VA deleted successfully');
    } catch (error) {
      message.error('Failed to delete VA');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingVA) {
        // Update existing VA
        setVAs(vas.map(va => va.id === editingVA.id ? { ...va, ...values } : va));
        message.success('VA updated successfully');
      } else {
        // Add new VA
        const newVA = {
          id: Date.now(),
          ...values,
          rating: 0,
          tasksCompleted: 0,
          lastActive: new Date().toISOString(),
        };
        setVAs([...vas, newVA]);
        message.success('VA added successfully');
      }
      
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const columns = [
    {
      title: 'VA Details',
      key: 'details',
      render: (_, record) => (
        <Space>
          <Avatar
            size={40}
            icon={<UserOutlined />}
            style={{ backgroundColor: '#1890ff' }}
          />
          <div>
            <Text strong>{record.name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: 'Active', value: 'active' },
        { text: 'Busy', value: 'busy' },
        { text: 'Offline', value: 'offline' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
    },
    {
      title: 'Experience',
      dataIndex: 'experience',
      key: 'experience',
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating) => (
        <Badge
          count={rating}
          style={{ backgroundColor: rating >= 4.5 ? '#52c41a' : rating >= 4.0 ? '#faad14' : '#ff4d4f' }}
        />
      ),
      sorter: (a, b) => a.rating - b.rating,
    },
    {
      title: 'Tasks Completed',
      dataIndex: 'tasksCompleted',
      key: 'tasksCompleted',
      sorter: (a, b) => a.tasksCompleted - b.tasksCompleted,
    },
    {
      title: 'Last Active',
      dataIndex: 'lastActive',
      key: 'lastActive',
      render: (date) => new Date(date).toLocaleString(),
      sorter: (a, b) => new Date(a.lastActive) - new Date(b.lastActive),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => message.info('View details functionality')}
            />
          </Tooltip>
          <Tooltip title="Edit VA">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditVA(record)}
            />
          </Tooltip>
          <Tooltip title="Delete VA">
            <Popconfirm
              title="Are you sure you want to delete this VA?"
              onConfirm={() => handleDeleteVA(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const stats = {
    total: vas.length,
    active: vas.filter(va => va.status === 'active').length,
    busy: vas.filter(va => va.status === 'busy').length,
    offline: vas.filter(va => va.status === 'offline').length,
  };

  return (
    <div>
      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total VAs"
              value={stats.total}
              prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Active"
              value={stats.active}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Busy"
              value={stats.busy}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Offline"
              value={stats.offline}
              prefix={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* VA Management Table */}
      <Card
        title="Virtual Assistants Management"
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchVAs}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddVA}
            >
              Add VA
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={vas}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} VAs`,
          }}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* Add/Edit VA Modal */}
      <Modal
        title={editingVA ? 'Edit VA' : 'Add New VA'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            status: 'active',
            role: 'Customer Support',
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Full Name"
                rules={[{ required: true, message: 'Please input the VA name!' }]}
              >
                <Input placeholder="Enter full name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Please input the email!' },
                  { type: 'email', message: 'Please enter a valid email!' },
                ]}
              >
                <Input placeholder="Enter email address" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="role"
                label="Role"
                rules={[{ required: true, message: 'Please select a role!' }]}
              >
                <Select placeholder="Select role">
                  <Option value="Customer Support">Customer Support</Option>
                  <Option value="Technical Support">Technical Support</Option>
                  <Option value="Sales Support">Sales Support</Option>
                  <Option value="Data Entry">Data Entry</Option>
                  <Option value="Content Creation">Content Creation</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="experience"
                label="Experience"
                rules={[{ required: true, message: 'Please input experience!' }]}
              >
                <Input placeholder="e.g., 2 years" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select status!' }]}
          >
            <Select placeholder="Select status">
              <Option value="active">Active</Option>
              <Option value="busy">Busy</Option>
              <Option value="offline">Offline</Option>
              <Option value="maintenance">Maintenance</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EnhancedVAManagement;
