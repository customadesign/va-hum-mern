import React from 'react';
import { Card, Row, Col, Statistic, Progress, Typography, Space, Tag } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  MessageOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const DashboardStats = ({ stats }) => {
  const {
    totalUsers = 0,
    totalVAs = 0,
    totalMessages = 0,
    activeVAs = 0,
    pendingTasks = 0,
    completedTasks = 0,
    systemHealth = 95,
  } = stats;

  const getHealthColor = (health) => {
    if (health >= 90) return '#52c41a';
    if (health >= 70) return '#faad14';
    return '#ff4d4f';
  };

  const getHealthStatus = (health) => {
    if (health >= 90) return 'Excellent';
    if (health >= 70) return 'Good';
    return 'Needs Attention';
  };

  return (
    <Row gutter={[24, 24]}>
      {/* User Statistics */}
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Total Users"
            value={totalUsers}
            prefix={<UserOutlined style={{ color: '#1890ff' }} />}
            valueStyle={{ color: '#1890ff' }}
          />
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">+12% from last month</Text>
          </div>
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Virtual Assistants"
            value={totalVAs}
            prefix={<TeamOutlined style={{ color: '#52c41a' }} />}
            valueStyle={{ color: '#52c41a' }}
          />
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">
              <Tag color="green">{activeVAs} Active</Tag>
            </Text>
          </div>
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Total Messages"
            value={totalMessages}
            prefix={<MessageOutlined style={{ color: '#722ed1' }} />}
            valueStyle={{ color: '#722ed1' }}
          />
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">+8% from last week</Text>
          </div>
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Task Completion"
            value={completedTasks}
            suffix={`/ ${completedTasks + pendingTasks}`}
            prefix={<CheckCircleOutlined style={{ color: '#13c2c2' }} />}
            valueStyle={{ color: '#13c2c2' }}
          />
          <div style={{ marginTop: 8 }}>
            <Progress
              percent={Math.round((completedTasks / (completedTasks + pendingTasks)) * 100)}
              size="small"
              strokeColor="#13c2c2"
            />
          </div>
        </Card>
      </Col>

      {/* System Health */}
      <Col xs={24} lg={12}>
        <Card title="System Health" extra={<Tag color={getHealthColor(systemHealth)}>{getHealthStatus(systemHealth)}</Tag>}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>Overall System Status</Text>
              <Progress
                percent={systemHealth}
                strokeColor={getHealthColor(systemHealth)}
                style={{ marginTop: 8 }}
              />
            </div>
            
            <Row gutter={16}>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                  <div style={{ marginTop: 4 }}>
                    <Text strong>API Status</Text>
                    <br />
                    <Text type="secondary">Operational</Text>
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                  <div style={{ marginTop: 4 }}>
                    <Text strong>Database</Text>
                    <br />
                    <Text type="secondary">Healthy</Text>
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <ClockCircleOutlined style={{ fontSize: 24, color: '#faad14' }} />
                  <div style={{ marginTop: 4 }}>
                    <Text strong>Response Time</Text>
                    <br />
                    <Text type="secondary">245ms</Text>
                  </div>
                </div>
              </Col>
            </Row>
          </Space>
        </Card>
      </Col>

      {/* Recent Activity */}
      <Col xs={24} lg={12}>
        <Card title="Recent Activity" extra={<Text type="secondary">Last 24 hours</Text>}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <UserOutlined style={{ color: '#1890ff' }} />
                <Text>New user registration</Text>
              </Space>
              <Text type="secondary">2 min ago</Text>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <MessageOutlined style={{ color: '#52c41a' }} />
                <Text>Message intercepted</Text>
              </Space>
              <Text type="secondary">5 min ago</Text>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <TeamOutlined style={{ color: '#722ed1' }} />
                <Text>VA status updated</Text>
              </Space>
              <Text type="secondary">12 min ago</Text>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                <Text>System maintenance scheduled</Text>
              </Space>
              <Text type="secondary">1 hour ago</Text>
            </div>
          </Space>
        </Card>
      </Col>
    </Row>
  );
};

export default DashboardStats;
