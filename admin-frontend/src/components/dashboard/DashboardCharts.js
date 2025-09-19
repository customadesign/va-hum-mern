import React from 'react';
import { Card, Row, Col, Typography } from 'antd';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const { Title } = Typography;

const DashboardCharts = () => {
  // Sample data - replace with real data from API
  const userGrowthData = [
    { month: 'Jan', users: 120, vas: 15 },
    { month: 'Feb', users: 150, vas: 18 },
    { month: 'Mar', users: 180, vas: 22 },
    { month: 'Apr', users: 220, vas: 25 },
    { month: 'May', users: 280, vas: 30 },
    { month: 'Jun', users: 320, vas: 35 },
  ];

  const messageData = [
    { time: '00:00', messages: 12 },
    { time: '04:00', messages: 8 },
    { time: '08:00', messages: 45 },
    { time: '12:00', messages: 78 },
    { time: '16:00', messages: 65 },
    { time: '20:00', messages: 32 },
  ];

  const vaStatusData = [
    { name: 'Active', value: 35, color: '#52c41a' },
    { name: 'Busy', value: 12, color: '#faad14' },
    { name: 'Offline', value: 8, color: '#ff4d4f' },
    { name: 'Maintenance', value: 3, color: '#722ed1' },
  ];

  const taskCompletionData = [
    { day: 'Mon', completed: 45, pending: 12 },
    { day: 'Tue', completed: 52, pending: 8 },
    { day: 'Wed', completed: 38, pending: 15 },
    { day: 'Thu', completed: 61, pending: 6 },
    { day: 'Fri', completed: 48, pending: 10 },
    { day: 'Sat', completed: 35, pending: 18 },
    { day: 'Sun', completed: 28, pending: 22 },
  ];

  return (
    <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
      {/* User Growth Chart */}
      <Col xs={24} lg={12}>
        <Card title="User Growth Trend" extra={<Title level={5} type="secondary">Last 6 months</Title>}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="users"
                stroke="#1890ff"
                strokeWidth={3}
                name="Users"
                dot={{ fill: '#1890ff', strokeWidth: 2, r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="vas"
                stroke="#52c41a"
                strokeWidth={3}
                name="VAs"
                dot={{ fill: '#52c41a', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </Col>

      {/* Message Activity */}
      <Col xs={24} lg={12}>
        <Card title="Message Activity" extra={<Title level={5} type="secondary">Today</Title>}>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={messageData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="messages"
                stroke="#722ed1"
                fill="#722ed1"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </Col>

      {/* VA Status Distribution */}
      <Col xs={24} lg={8}>
        <Card title="VA Status Distribution">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={vaStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {vaStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </Col>

      {/* Task Completion */}
      <Col xs={24} lg={16}>
        <Card title="Weekly Task Completion" extra={<Title level={5} type="secondary">This week</Title>}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={taskCompletionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" fill="#52c41a" name="Completed" />
              <Bar dataKey="pending" fill="#faad14" name="Pending" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </Col>
    </Row>
  );
};

export default DashboardCharts;
