const EventEmitter = require('events');
const nodemailer = require('nodemailer');
const winston = require('winston');
const { query } = require('../database/db');

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'notification-service' },
  transports: [
    new winston.transports.File({ filename: 'logs/notifications.log' }),
    new winston.transports.Console()
  ]
});

// Notification types
const NOTIFICATION_TYPES = {
  WIZARD_STARTED: 'wizard_started',
  WIZARD_STEP_COMPLETED: 'wizard_step_completed',
  WIZARD_COMPLETED: 'wizard_completed',
  WIZARD_ABANDONED: 'wizard_abandoned',
  PROJECT_CREATED: 'project_created',
  VALIDATION_ERROR: 'validation_error',
  SYSTEM_ERROR: 'system_error',
  USER_ASSIGNED: 'user_assigned',
  VENDOR_ASSIGNED: 'vendor_assigned',
  BUDGET_APPROVED: 'budget_approved',
  DEADLINE_REMINDER: 'deadline_reminder'
};

// Notification channels
const NOTIFICATION_CHANNELS = {
  EMAIL: 'email',
  SMS: 'sms',
  IN_APP: 'in_app',
  WEBHOOK: 'webhook',
  SLACK: 'slack'
};

// Notification priorities
const NOTIFICATION_PRIORITIES = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent'
};

// Email templates
const EMAIL_TEMPLATES = {
  [NOTIFICATION_TYPES.WIZARD_STARTED]: {
    subject: 'Project Creation Started',
    template: `
      <h2>Project Creation Started</h2>
      <p>Hello {{userName}},</p>
      <p>You have started creating a new project in the PFMT system.</p>
      <p><strong>Session ID:</strong> {{sessionId}}</p>
      <p>You can continue your project creation at any time by returning to the wizard.</p>
      <p>Best regards,<br>PFMT System</p>
    `
  },

  [NOTIFICATION_TYPES.WIZARD_COMPLETED]: {
    subject: 'Project Creation Completed',
    template: `
      <h2>Project Creation Completed</h2>
      <p>Hello {{userName}},</p>
      <p>Congratulations! You have successfully completed the project creation wizard.</p>
      
      <h3>Project Details:</h3>
      <ul>
        <li><strong>Project Name:</strong> {{projectName}}</li>
        <li><strong>Project Code:</strong> {{projectCode}}</li>
        <li><strong>Category:</strong> {{projectCategory}}</li>
        <li><strong>Total Budget:</strong> {{totalBudget}}</li>
      </ul>
      
      <p>Your project is now available in the PFMT system and you can begin managing it.</p>
      <p><a href="{{projectUrl}}" style="background-color: #007cba; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Project</a></p>
      
      <p>Best regards,<br>PFMT System</p>
    `
  },

  [NOTIFICATION_TYPES.PROJECT_CREATED]: {
    subject: 'New Project Created: {{projectName}}',
    template: `
      <h2>New Project Created</h2>
      <p>A new project has been created in the PFMT system.</p>
      
      <h3>Project Information:</h3>
      <ul>
        <li><strong>Project Name:</strong> {{projectName}}</li>
        <li><strong>Project Code:</strong> {{projectCode}}</li>
        <li><strong>Created By:</strong> {{createdBy}}</li>
        <li><strong>Category:</strong> {{projectCategory}}</li>
        <li><strong>Location:</strong> {{projectLocation}}</li>
        <li><strong>Total Budget:</strong> {{totalBudget}}</li>
        <li><strong>Created At:</strong> {{createdAt}}</li>
      </ul>
      
      <p><a href="{{projectUrl}}" style="background-color: #007cba; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Project</a></p>
      
      <p>This is an automated notification from the PFMT system.</p>
    `
  },

  [NOTIFICATION_TYPES.VALIDATION_ERROR]: {
    subject: 'Project Wizard Validation Error',
    template: `
      <h2>Validation Error in Project Wizard</h2>
      <p>Hello {{userName}},</p>
      <p>There was a validation error while processing your project creation.</p>
      
      <h3>Error Details:</h3>
      <ul>
        <li><strong>Step:</strong> {{stepName}}</li>
        <li><strong>Error:</strong> {{errorMessage}}</li>
        <li><strong>Session ID:</strong> {{sessionId}}</li>
      </ul>
      
      <p>Please return to the wizard and correct the issues to continue.</p>
      <p><a href="{{wizardUrl}}" style="background-color: #007cba; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Continue Wizard</a></p>
      
      <p>Best regards,<br>PFMT System</p>
    `
  },

  [NOTIFICATION_TYPES.SYSTEM_ERROR]: {
    subject: 'PFMT System Error Alert',
    template: `
      <h2>System Error Alert</h2>
      <p>A system error has occurred in the PFMT project wizard.</p>
      
      <h3>Error Information:</h3>
      <ul>
        <li><strong>Error:</strong> {{errorMessage}}</li>
        <li><strong>User:</strong> {{userName}} ({{userEmail}})</li>
        <li><strong>Session ID:</strong> {{sessionId}}</li>
        <li><strong>Timestamp:</strong> {{timestamp}}</li>
        <li><strong>Correlation ID:</strong> {{correlationId}}</li>
      </ul>
      
      <h3>Stack Trace:</h3>
      <pre>{{stackTrace}}</pre>
      
      <p>Please investigate this issue promptly.</p>
    `
  },

  [NOTIFICATION_TYPES.USER_ASSIGNED]: {
    subject: 'You have been assigned to project: {{projectName}}',
    template: `
      <h2>Project Assignment</h2>
      <p>Hello {{userName}},</p>
      <p>You have been assigned to a project in the PFMT system.</p>
      
      <h3>Project Details:</h3>
      <ul>
        <li><strong>Project Name:</strong> {{projectName}}</li>
        <li><strong>Project Code:</strong> {{projectCode}}</li>
        <li><strong>Your Role:</strong> {{userRole}}</li>
        <li><strong>Assigned By:</strong> {{assignedBy}}</li>
      </ul>
      
      <p><a href="{{projectUrl}}" style="background-color: #007cba; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Project</a></p>
      
      <p>Best regards,<br>PFMT System</p>
    `
  },

  [NOTIFICATION_TYPES.VENDOR_ASSIGNED]: {
    subject: 'Vendor Assignment: {{projectName}}',
    template: `
      <h2>Vendor Assignment Notification</h2>
      <p>A vendor has been assigned to project: <strong>{{projectName}}</strong></p>
      
      <h3>Assignment Details:</h3>
      <ul>
        <li><strong>Vendor:</strong> {{vendorName}}</li>
        <li><strong>Role:</strong> {{vendorRole}}</li>
        <li><strong>Contract Value:</strong> {{contractValue}}</li>
        <li><strong>Assigned By:</strong> {{assignedBy}}</li>
        <li><strong>Project Code:</strong> {{projectCode}}</li>
      </ul>
      
      <p><a href="{{projectUrl}}" style="background-color: #007cba; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Project</a></p>
      
      <p>This is an automated notification from the PFMT system.</p>
    `
  }
};

class NotificationService extends EventEmitter {
  constructor() {
    super();
    this.emailTransporter = null;
    this.initializeEmailTransporter();
    this.setupEventListeners();
  }

  // Initialize email transporter
  initializeEmailTransporter() {
    try {
      this.emailTransporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'localhost',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        pool: true,
        maxConnections: 5,
        maxMessages: 100
      });

      logger.info('Email transporter initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email transporter', { error: error.message });
    }
  }

  // Setup event listeners for automatic notifications
  setupEventListeners() {
    this.on(NOTIFICATION_TYPES.WIZARD_COMPLETED, async (data) => {
      await this.sendWizardCompletionNotifications(data);
    });

    this.on(NOTIFICATION_TYPES.PROJECT_CREATED, async (data) => {
      await this.sendProjectCreationNotifications(data);
    });

    this.on(NOTIFICATION_TYPES.SYSTEM_ERROR, async (data) => {
      await this.sendSystemErrorNotifications(data);
    });

    this.on(NOTIFICATION_TYPES.USER_ASSIGNED, async (data) => {
      await this.sendUserAssignmentNotification(data);
    });

    this.on(NOTIFICATION_TYPES.VENDOR_ASSIGNED, async (data) => {
      await this.sendVendorAssignmentNotification(data);
    });
  }

  // Send notification
  async sendNotification(type, channel, recipient, data, options = {}) {
    try {
      const notificationId = this.generateNotificationId();
      
      logger.info('Sending notification', {
        notificationId,
        type,
        channel,
        recipient: this.maskSensitiveData(recipient)
      });

      // Log notification to database
      await this.logNotification(notificationId, type, channel, recipient, data, options);

      let result;
      switch (channel) {
        case NOTIFICATION_CHANNELS.EMAIL:
          result = await this.sendEmailNotification(type, recipient, data, options);
          break;
        case NOTIFICATION_CHANNELS.IN_APP:
          result = await this.sendInAppNotification(type, recipient, data, options);
          break;
        case NOTIFICATION_CHANNELS.WEBHOOK:
          result = await this.sendWebhookNotification(type, recipient, data, options);
          break;
        default:
          throw new Error(`Unsupported notification channel: ${channel}`);
      }

      // Update notification status
      await this.updateNotificationStatus(notificationId, 'sent', result);

      logger.info('Notification sent successfully', {
        notificationId,
        type,
        channel
      });

      return { notificationId, result };
    } catch (error) {
      logger.error('Failed to send notification', {
        type,
        channel,
        error: error.message,
        recipient: this.maskSensitiveData(recipient)
      });
      throw error;
    }
  }

  // Send email notification
  async sendEmailNotification(type, recipient, data, options = {}) {
    if (!this.emailTransporter) {
      throw new Error('Email transporter not initialized');
    }

    const template = EMAIL_TEMPLATES[type];
    if (!template) {
      throw new Error(`No email template found for notification type: ${type}`);
    }

    // Render template
    const subject = this.renderTemplate(template.subject, data);
    const htmlContent = this.renderTemplate(template.template, data);
    const textContent = this.htmlToText(htmlContent);

    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@alberta.ca',
      to: recipient,
      subject,
      html: htmlContent,
      text: textContent,
      priority: this.getEmailPriority(options.priority)
    };

    // Add attachments if provided
    if (options.attachments) {
      mailOptions.attachments = options.attachments;
    }

    const result = await this.emailTransporter.sendMail(mailOptions);
    return { messageId: result.messageId, response: result.response };
  }

  // Send in-app notification
  async sendInAppNotification(type, userId, data, options = {}) {
    try {
      const notification = {
        user_id: userId,
        type,
        title: data.title || this.getDefaultTitle(type),
        message: data.message || this.getDefaultMessage(type, data),
        data: JSON.stringify(data),
        priority: options.priority || NOTIFICATION_PRIORITIES.NORMAL,
        read: false,
        created_at: new Date()
      };

      const result = await query(`
        INSERT INTO user_notifications (user_id, type, title, message, data, priority, read, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, [
        notification.user_id,
        notification.type,
        notification.title,
        notification.message,
        notification.data,
        notification.priority,
        notification.read,
        notification.created_at
      ]);

      return { notificationId: result.rows[0].id };
    } catch (error) {
      logger.error('Failed to send in-app notification', {
        error: error.message,
        userId,
        type
      });
      throw error;
    }
  }

  // Send webhook notification
  async sendWebhookNotification(type, webhookUrl, data, options = {}) {
    const axios = require('axios');
    
    const payload = {
      type,
      timestamp: new Date().toISOString(),
      data,
      ...options
    };

    const response = await axios.post(webhookUrl, payload, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PFMT-Notification-Service/1.0'
      }
    });

    return { status: response.status, data: response.data };
  }

  // Wizard-specific notification methods
  async sendWizardCompletionNotifications(data) {
    const { user, project, sessionId } = data;

    // Send notification to user
    await this.sendNotification(
      NOTIFICATION_TYPES.WIZARD_COMPLETED,
      NOTIFICATION_CHANNELS.EMAIL,
      user.email,
      {
        userName: `${user.first_name} ${user.last_name}`,
        projectName: project.name,
        projectCode: project.code,
        projectCategory: project.category,
        totalBudget: this.formatCurrency(project.total_budget),
        projectUrl: `${process.env.FRONTEND_URL}/projects/${project.id}`
      }
    );

    // Send in-app notification
    await this.sendNotification(
      NOTIFICATION_TYPES.WIZARD_COMPLETED,
      NOTIFICATION_CHANNELS.IN_APP,
      user.id,
      {
        title: 'Project Created Successfully',
        message: `Your project "${project.name}" has been created successfully.`,
        projectId: project.id,
        projectCode: project.code
      }
    );
  }

  async sendProjectCreationNotifications(data) {
    const { project, createdBy } = data;

    // Get notification recipients (administrators, project managers)
    const recipients = await this.getProjectCreationRecipients();

    for (const recipient of recipients) {
      await this.sendNotification(
        NOTIFICATION_TYPES.PROJECT_CREATED,
        NOTIFICATION_CHANNELS.EMAIL,
        recipient.email,
        {
          projectName: project.name,
          projectCode: project.code,
          createdBy: `${createdBy.first_name} ${createdBy.last_name}`,
          projectCategory: project.category,
          projectLocation: project.location,
          totalBudget: this.formatCurrency(project.total_budget),
          createdAt: this.formatDate(project.created_at),
          projectUrl: `${process.env.FRONTEND_URL}/projects/${project.id}`
        }
      );
    }
  }

  async sendSystemErrorNotifications(data) {
    const { error, user, sessionId, correlationId } = data;

    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    
    for (const email of adminEmails) {
      await this.sendNotification(
        NOTIFICATION_TYPES.SYSTEM_ERROR,
        NOTIFICATION_CHANNELS.EMAIL,
        email.trim(),
        {
          errorMessage: error.message,
          userName: user ? `${user.first_name} ${user.last_name}` : 'Unknown',
          userEmail: user?.email || 'Unknown',
          sessionId: sessionId || 'Unknown',
          timestamp: new Date().toISOString(),
          correlationId: correlationId || 'Unknown',
          stackTrace: error.stack || 'No stack trace available'
        },
        { priority: NOTIFICATION_PRIORITIES.URGENT }
      );
    }
  }

  async sendUserAssignmentNotification(data) {
    const { user, project, role, assignedBy } = data;

    await this.sendNotification(
      NOTIFICATION_TYPES.USER_ASSIGNED,
      NOTIFICATION_CHANNELS.EMAIL,
      user.email,
      {
        userName: `${user.first_name} ${user.last_name}`,
        projectName: project.name,
        projectCode: project.code,
        userRole: role,
        assignedBy: `${assignedBy.first_name} ${assignedBy.last_name}`,
        projectUrl: `${process.env.FRONTEND_URL}/projects/${project.id}`
      }
    );

    // Also send in-app notification
    await this.sendNotification(
      NOTIFICATION_TYPES.USER_ASSIGNED,
      NOTIFICATION_CHANNELS.IN_APP,
      user.id,
      {
        title: 'Project Assignment',
        message: `You have been assigned to project "${project.name}" as ${role}.`,
        projectId: project.id,
        role
      }
    );
  }

  async sendVendorAssignmentNotification(data) {
    const { vendor, project, role, contractValue, assignedBy } = data;

    // Get vendor notification recipients
    const recipients = await this.getVendorNotificationRecipients(project.id);

    for (const recipient of recipients) {
      await this.sendNotification(
        NOTIFICATION_TYPES.VENDOR_ASSIGNED,
        NOTIFICATION_CHANNELS.EMAIL,
        recipient.email,
        {
          vendorName: vendor.name,
          vendorRole: role,
          contractValue: contractValue ? this.formatCurrency(contractValue) : 'Not specified',
          assignedBy: `${assignedBy.first_name} ${assignedBy.last_name}`,
          projectName: project.name,
          projectCode: project.code,
          projectUrl: `${process.env.FRONTEND_URL}/projects/${project.id}`
        }
      );
    }
  }

  // Utility methods
  renderTemplate(template, data) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  htmlToText(html) {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  }

  formatDate(date) {
    return new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  getEmailPriority(priority) {
    const priorityMap = {
      [NOTIFICATION_PRIORITIES.LOW]: 'low',
      [NOTIFICATION_PRIORITIES.NORMAL]: 'normal',
      [NOTIFICATION_PRIORITIES.HIGH]: 'high',
      [NOTIFICATION_PRIORITIES.URGENT]: 'high'
    };
    return priorityMap[priority] || 'normal';
  }

  getDefaultTitle(type) {
    const titles = {
      [NOTIFICATION_TYPES.WIZARD_STARTED]: 'Project Creation Started',
      [NOTIFICATION_TYPES.WIZARD_COMPLETED]: 'Project Creation Completed',
      [NOTIFICATION_TYPES.PROJECT_CREATED]: 'New Project Created',
      [NOTIFICATION_TYPES.VALIDATION_ERROR]: 'Validation Error',
      [NOTIFICATION_TYPES.SYSTEM_ERROR]: 'System Error',
      [NOTIFICATION_TYPES.USER_ASSIGNED]: 'Project Assignment',
      [NOTIFICATION_TYPES.VENDOR_ASSIGNED]: 'Vendor Assignment'
    };
    return titles[type] || 'Notification';
  }

  getDefaultMessage(type, data) {
    const messages = {
      [NOTIFICATION_TYPES.WIZARD_STARTED]: 'You have started creating a new project.',
      [NOTIFICATION_TYPES.WIZARD_COMPLETED]: `Your project "${data.projectName}" has been created successfully.`,
      [NOTIFICATION_TYPES.PROJECT_CREATED]: `A new project "${data.projectName}" has been created.`,
      [NOTIFICATION_TYPES.VALIDATION_ERROR]: 'There was a validation error in your project creation.',
      [NOTIFICATION_TYPES.SYSTEM_ERROR]: 'A system error has occurred.',
      [NOTIFICATION_TYPES.USER_ASSIGNED]: `You have been assigned to project "${data.projectName}".`,
      [NOTIFICATION_TYPES.VENDOR_ASSIGNED]: `A vendor has been assigned to project "${data.projectName}".`
    };
    return messages[type] || 'You have a new notification.';
  }

  generateNotificationId() {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  maskSensitiveData(data) {
    if (typeof data === 'string' && data.includes('@')) {
      // Mask email
      const [local, domain] = data.split('@');
      return `${local.substr(0, 2)}***@${domain}`;
    }
    return data;
  }

  // Database operations
  async logNotification(notificationId, type, channel, recipient, data, options) {
    try {
      await query(`
        INSERT INTO notification_logs (
          notification_id, type, channel, recipient, data, options, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW())
      `, [
        notificationId,
        type,
        channel,
        recipient,
        JSON.stringify(data),
        JSON.stringify(options)
      ]);
    } catch (error) {
      logger.error('Failed to log notification', {
        error: error.message,
        notificationId
      });
    }
  }

  async updateNotificationStatus(notificationId, status, result = null) {
    try {
      await query(`
        UPDATE notification_logs 
        SET status = $1, result = $2, updated_at = NOW()
        WHERE notification_id = $3
      `, [status, JSON.stringify(result), notificationId]);
    } catch (error) {
      logger.error('Failed to update notification status', {
        error: error.message,
        notificationId
      });
    }
  }

  async getProjectCreationRecipients() {
    try {
      const result = await query(`
        SELECT email, first_name, last_name
        FROM users 
        WHERE role IN ('admin', 'project_manager') 
        AND is_active = true
        AND notification_preferences->>'project_creation' = 'true'
      `);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get project creation recipients', {
        error: error.message
      });
      return [];
    }
  }

  async getVendorNotificationRecipients(projectId) {
    try {
      const result = await query(`
        SELECT DISTINCT u.email, u.first_name, u.last_name
        FROM users u
        JOIN project_teams pt ON u.id = pt.user_id
        WHERE pt.project_id = $1 
        AND pt.role IN ('project_manager', 'procurement_officer')
        AND u.is_active = true
      `, [projectId]);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get vendor notification recipients', {
        error: error.message,
        projectId
      });
      return [];
    }
  }

  // Public API methods
  async notifyWizardStarted(user, sessionId) {
    this.emit(NOTIFICATION_TYPES.WIZARD_STARTED, { user, sessionId });
  }

  async notifyWizardCompleted(user, project, sessionId) {
    this.emit(NOTIFICATION_TYPES.WIZARD_COMPLETED, { user, project, sessionId });
  }

  async notifyProjectCreated(project, createdBy) {
    this.emit(NOTIFICATION_TYPES.PROJECT_CREATED, { project, createdBy });
  }

  async notifySystemError(error, user, sessionId, correlationId) {
    this.emit(NOTIFICATION_TYPES.SYSTEM_ERROR, { error, user, sessionId, correlationId });
  }

  async notifyUserAssigned(user, project, role, assignedBy) {
    this.emit(NOTIFICATION_TYPES.USER_ASSIGNED, { user, project, role, assignedBy });
  }

  async notifyVendorAssigned(vendor, project, role, contractValue, assignedBy) {
    this.emit(NOTIFICATION_TYPES.VENDOR_ASSIGNED, { vendor, project, role, contractValue, assignedBy });
  }

  // Health check
  async healthCheck() {
    try {
      if (this.emailTransporter) {
        await this.emailTransporter.verify();
      }
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        error: error.message, 
        timestamp: new Date().toISOString() 
      };
    }
  }
}

// Create and export service instance
const notificationService = new NotificationService();

module.exports = {
  notificationService,
  NOTIFICATION_TYPES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_PRIORITIES
};

