# 📊 Monitoring and Alerting Setup for Linkage VA Hub

## 🎯 **Monitoring Strategy Overview**

### **1. Application Performance Monitoring (APM)**

#### **New Relic Setup:**
```bash
# Install New Relic
npm install newrelic

# Configuration
# File: newrelic.js
exports.config = {
  app_name: ['Linkage VA Hub API'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  distributed_tracing: {
    enabled: true
  },
  logging: {
    level: 'info'
  }
};
```

#### **Key Metrics to Monitor:**
- Response time (target: <200ms for 95th percentile)
- Throughput (requests per minute)
- Error rate (target: <1%)
- Apdex score (target: >0.9)
- Database query performance
- Memory usage and garbage collection

### **2. Error Tracking & Debugging**

#### **Sentry Configuration:**
```javascript
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app }),
    new Sentry.Integrations.Mongo()
  ]
});
```

#### **Error Categories to Track:**
- Authentication failures
- Database connection errors
- Email delivery failures
- File upload errors
- API validation errors
- Rate limiting violations

### **3. Infrastructure Monitoring**

#### **System Metrics:**
- CPU usage (alert if >80% for 5+ minutes)
- Memory usage (alert if >85% for 5+ minutes)
- Disk usage (alert if >90%)
- Network I/O
- Database connections

#### **Application Metrics:**
- Active user sessions
- Password reset attempts (security monitoring)
- File upload volumes
- Email delivery rates
- API endpoint usage patterns

## 🚨 **Critical Alerts Configuration**

### **1. High Priority Alerts (Immediate Response)**

#### **Application Down:**
```yaml
Alert: Application Unavailable
Condition: Health check fails for 2+ consecutive minutes
Notification: SMS + Email + Slack
Escalation: 5 minutes -> On-call engineer
```

#### **Database Issues:**
```yaml
Alert: Database Connection Failed
Condition: MongoDB connection errors >5 in 1 minute
Notification: SMS + Email
Escalation: Immediate
```

#### **Security Incidents:**
```yaml
Alert: Security Breach Detected
Condition: 
  - Failed login attempts >20 in 5 minutes
  - Admin privilege escalation
  - Unusual password reset patterns
Notification: SMS + Email + Security team
Escalation: Immediate
```

### **2. Medium Priority Alerts (Within 1 Hour)**

#### **Performance Degradation:**
```yaml
Alert: High Response Time
Condition: Average response time >500ms for 5+ minutes
Notification: Email + Slack
Escalation: 15 minutes
```

#### **Error Rate Spike:**
```yaml
Alert: High Error Rate
Condition: Error rate >5% for 5+ minutes
Notification: Email + Slack
Escalation: 10 minutes
```

### **3. Low Priority Alerts (Within 4 Hours)**

#### **Resource Usage:**
```yaml
Alert: High Resource Usage
Condition: CPU >70% or Memory >75% for 10+ minutes
Notification: Email
Escalation: 30 minutes
```

#### **Email Delivery Issues:**
```yaml
Alert: Email Delivery Problems
Condition: Email failure rate >10% for 15+ minutes
Notification: Email
Escalation: 1 hour
```

## 📈 **Dashboard Configuration**

### **1. Executive Dashboard**
- Total active users
- Revenue metrics
- System uptime
- Customer satisfaction metrics

### **2. Operations Dashboard**
- Application performance metrics
- Infrastructure health
- Error rates and trends
- Security incident timeline

### **3. Development Dashboard**
- Code deployment frequency
- Bug resolution time
- Feature adoption rates
- Technical debt metrics

## 📋 **Monitoring Checklist**

### **Setup Phase:**
- [ ] New Relic APM configured and receiving data
- [ ] Sentry error tracking configured
- [ ] Custom application metrics implemented
- [ ] Infrastructure monitoring setup
- [ ] Log aggregation configured
- [ ] Alert rules created and tested
- [ ] Dashboard layouts configured
- [ ] Team notification preferences set

### **Testing Phase:**
- [ ] Trigger test alerts to verify notification delivery
- [ ] Validate alert escalation procedures
- [ ] Test dashboard accessibility for all team members
- [ ] Verify metric accuracy and reliability
- [ ] Test incident response procedures

### **Maintenance Phase:**
- [ ] Weekly dashboard review meetings
- [ ] Monthly alert rule optimization
- [ ] Quarterly monitoring strategy review
- [ ] Annual monitoring tool evaluation

## 🔧 **Custom Monitoring Implementation**

### **Password Reset Monitoring:**
```javascript
// Custom metrics for password reset system
const sendPasswordResetMetric = (type, success, userType) => {
  // New Relic custom event
  newrelic.recordCustomEvent('PasswordReset', {
    type: type, // 'admin_initiated' or 'user_self_service'
    success: success,
    userType: userType, // 'va', 'business', 'admin'
    timestamp: new Date().toISOString()
  });
  
  // Sentry breadcrumb
  Sentry.addBreadcrumb({
    message: 'Password reset attempt',
    category: 'auth',
    data: { type, success, userType }
  });
};
```

### **File Upload Monitoring:**
```javascript
const monitorFileUpload = (fileSize, fileType, success, duration) => {
  newrelic.recordCustomEvent('FileUpload', {
    fileSize,
    fileType,
    success,
    duration,
    timestamp: new Date().toISOString()
  });
};
```

## 📱 **Alert Notification Channels**

### **Channel Configuration:**
1. **SMS**: For critical alerts (application down, security breaches)
2. **Email**: For all alerts with detailed information
3. **Slack**: For team notifications and collaboration
4. **PagerDuty**: For on-call escalation management

### **Contact Groups:**
- **Critical**: DevOps team + CTO
- **High**: Development team + DevOps
- **Medium**: Development team
- **Low**: Logs only

## 💡 **Best Practices**

### **Alert Fatigue Prevention:**
- Use proper alert thresholds
- Implement alert escalation
- Regular alert rule review
- Suppress known issues during maintenance

### **Incident Response:**
- Clear runbooks for common issues
- Automated remediation where possible
- Post-incident reviews and improvements
- Regular incident response training

### **Performance Optimization:**
- Regular performance baseline reviews
- Proactive capacity planning
- Database query optimization
- Code performance profiling