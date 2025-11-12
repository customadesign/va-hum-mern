import React, { useState, useEffect } from 'react';
import { Typography, Button, Space, Card, Row, Col, Alert, Spin, Tag, Timeline } from 'antd';
import { PlusOutlined, ReloadOutlined, SoundOutlined, TeamOutlined, ShopOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
} from 'chart.js';
import { adminAPI } from '../../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTitle,
  Tooltip,
  Legend
);

const { Title, Text } = Typography;

const ModernDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalVAs: 0,
    activeVAs: 0,
    totalBusinesses: 0,
    pendingApprovals: 0,
    activeAnnouncements: 0,
    unreadAnnouncementsVA: 0,
    unreadAnnouncementsBusiness: 0,
    recentActivity: [],
    growthChart: null,
  });

  const { data: apiStats, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminAPI.getStats,
    refetchInterval: 30000, // Refresh every 30 seconds
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 1,
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  useEffect(() => {
    console.log('[Dashboard] API Stats Response:', apiStats);
    if (apiStats?.data) {
      console.log('[Dashboard] Setting stats with data:', apiStats.data);
      setStats({
        totalVAs: apiStats.data.totalVAs || 0,
        activeVAs: apiStats.data.activeVAs || 0,
        totalBusinesses: apiStats.data.totalBusinesses || 0,
        pendingApprovals: apiStats.data.pendingApprovals || 0,
        activeAnnouncements: apiStats.data.activeAnnouncements || 0,
        unreadAnnouncementsVA: apiStats.data.unreadAnnouncementsVA || 0,
        unreadAnnouncementsBusiness: apiStats.data.unreadAnnouncementsBusiness || 0,
        recentActivity: apiStats.data.recentActivity || [],
        growthChart: apiStats.data.growthChart || null,
      });
      console.log('[Dashboard] Stats updated:', {
        totalVAs: apiStats.data.totalVAs || 0,
        activeVAs: apiStats.data.activeVAs || 0,
        totalBusinesses: apiStats.data.totalBusinesses || 0,
      });
    } else {
      console.log('[Dashboard] No data in API response');
    }
  }, [apiStats]);

  const handleRefresh = () => {
    refetch();
  };

  // Chart data for registration trends - use real data if available
  const chartData = stats.growthChart ? {
    labels: stats.growthChart.labels,
    datasets: [
      {
        label: 'New VAs',
        data: stats.growthChart.vaGrowth,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
      {
        label: 'New Businesses',
        data: stats.growthChart.businessGrowth,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
      },
    ],
  } : {
    labels: ['Loading...'],
    datasets: [
      {
        label: 'New VAs',
        data: [0],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
      {
        label: 'New Businesses',
        data: [0],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Registration Trends',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">Loading dashboard data...</Text>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error loading dashboard data"
        description="Please try refreshing the page or contact support if the issue persists."
        type="error"
        showIcon
        action={
          <Button size="small" danger onClick={handleRefresh}>
            Retry
          </Button>
        }
      />
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              Dashboard
            </Title>
            <Text type="secondary" style={{ fontSize: 16 }}>
              Welcome to the Linkage VA Hub admin panel. Here's what's happening on your platform.
            </Text>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={isLoading}
              >
                Refresh
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/announcements')}
              >
                Create Announcement
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Announcements Card */}
      <Card
        style={{ marginBottom: 24 }}
        title={
          <Space>
            <SoundOutlined style={{ color: '#1890ff' }} />
            <span>Announcements</span>
          </Space>
        }
        extra={
          <Button type="link" onClick={() => navigate('/announcements')}>
            View all →
          </Button>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff', marginBottom: 8 }}>
                  {stats.activeAnnouncements}
                </div>
                <Text type="secondary">Active</Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ background: '#fffbe6', border: '1px solid #ffe58f' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14', marginBottom: 8 }}>
                  {stats.unreadAnnouncementsVA}
                </div>
                <Text type="secondary">Unread (VAs)</Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a', marginBottom: 8 }}>
                  {stats.unreadAnnouncementsBusiness}
                </div>
                <Text type="secondary">Unread (Businesses)</Text>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Statistics Cards */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ 
                padding: 12, 
                borderRadius: 8, 
                background: '#e6f7ff', 
                marginRight: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TeamOutlined style={{ fontSize: 24, color: '#1890ff' }} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                  {stats.totalVAs.toLocaleString()}
                </div>
                <Text type="secondary">Total VAs</Text>
                <div style={{ marginTop: 4 }}>
                  <Tag color="green">+12%</Tag>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ 
                padding: 12, 
                borderRadius: 8, 
                background: '#f6ffed', 
                marginRight: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TeamOutlined style={{ fontSize: 24, color: '#52c41a' }} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                  {stats.activeVAs.toLocaleString()}
                </div>
                <Text type="secondary">Active VAs</Text>
                <div style={{ marginTop: 4 }}>
                  <Tag color="green">+8%</Tag>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ 
                padding: 12, 
                borderRadius: 8, 
                background: '#fffbe6', 
                marginRight: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ShopOutlined style={{ fontSize: 24, color: '#faad14' }} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>
                  {stats.totalBusinesses.toLocaleString()}
                </div>
                <Text type="secondary">Total Businesses</Text>
                <div style={{ marginTop: 4 }}>
                  <Tag color="green">+23%</Tag>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ 
                padding: 12, 
                borderRadius: 8, 
                background: '#fff2f0', 
                marginRight: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ExclamationCircleOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ff4d4f' }}>
                  {stats.pendingApprovals.toLocaleString()}
                </div>
                <Text type="secondary">Pending Approvals</Text>
                <div style={{ marginTop: 4 }}>
                  <Tag color="red">-5%</Tag>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Charts and Recent Activity */}
      <Row gutter={[24, 24]}>
        {/* Registration Trends Chart */}
        <Col xs={24} lg={12}>
          <Card title="Registration Trends">
            <div style={{ height: 300 }}>
              <Line data={chartData} options={chartOptions} />
            </div>
          </Card>
        </Col>

        {/* Recent Activity */}
        <Col xs={24} lg={12}>
          <Card title="Recent Activity">
            {stats.recentActivity && stats.recentActivity.length > 0 ? (
              <Timeline
                items={stats.recentActivity.map((activity, index) => ({
                  children: (
                    <div>
                      <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                        {activity.title}
                      </div>
                      <div style={{ color: '#666', marginBottom: 4 }}>
                        {activity.description}
                      </div>
                      <div style={{ fontSize: 12, color: '#999' }}>
                        {new Date(activity.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ),
                  color: index === 0 ? 'blue' : 'gray',
                }))}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
                No recent activity
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Card
        title="Quick Actions"
        style={{ marginTop: 24 }}
        extra={
          <Button type="link" onClick={() => navigate('/settings')}>
            View All Settings
          </Button>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card
              hoverable
              onClick={() => navigate('/va-management')}
              style={{ textAlign: 'center' }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
              <Text strong>Manage VAs</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                View and manage virtual assistants
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              hoverable
              onClick={() => navigate('/users')}
              style={{ textAlign: 'center' }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>👤</div>
              <Text strong>User Management</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Manage user accounts and permissions
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              hoverable
              onClick={() => navigate('/messenger-chat')}
              style={{ textAlign: 'center' }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
              <Text strong>Messages</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Review intercepted messages
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              hoverable
              onClick={() => navigate('/analytics')}
              style={{ textAlign: 'center' }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
              <Text strong>Analytics</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                View detailed analytics and reports
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              hoverable
              onClick={() => navigate('/business-management')}
              style={{ textAlign: 'center' }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>🏢</div>
              <Text strong>Business Management</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Manage business accounts
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              hoverable
              onClick={() => navigate('/announcements')}
              style={{ textAlign: 'center' }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>📢</div>
              <Text strong>Announcements</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Create and manage announcements
              </Text>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default ModernDashboard;