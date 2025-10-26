const nodemailer = require('nodemailer');
const Bull = require('bull');

class EmailService {
  constructor() {
    // Email transporter configuration
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });

    // Email queue for background processing
    this.emailQueue = new Bull('email', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379
      }
    });

    // Process email queue
    this.emailQueue.process(async (job) => {
      return await this.sendEmailDirect(job.data);
    });

    this.emailQueue.on('completed', (job) => {
      console.log(`Email sent successfully: ${job.id}`);
    });

    this.emailQueue.on('failed', (job, err) => {
      console.error(`Email failed: ${job.id}`, err.message);
    });
  }

  /**
   * Send email directly (without queue)
   */
  async sendEmailDirect({ to, subject, html, text }) {
    try {
      const info = await this.transporter.sendMail({
        from: `"ERP System" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text,
        html
      });

      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      console.error('Email send error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send email via queue (recommended for production)
   */
  async sendEmail({ to, subject, html, text, priority = 'normal' }) {
    try {
      const job = await this.emailQueue.add(
        { to, subject, html, text },
        {
          priority: priority === 'high' ? 1 : 5,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000
          }
        }
      );

      return {
        success: true,
        jobId: job.id
      };
    } catch (error) {
      console.error('Email queue error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(user) {
    const html = `
      <h1>Welcome to ERP System!</h1>
      <p>Hi ${user.username},</p>
      <p>Thank you for registering. Your account has been created successfully.</p>
      <p>You can now log in and start using the system.</p>
      <br>
      <p>Best regards,<br>ERP Team</p>
    `;

    return await this.sendEmail({
      to: user.email,
      subject: 'Welcome to ERP System',
      html,
      text: `Welcome to ERP System! Hi ${user.username}, your account has been created successfully.`
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const html = `
      <h1>Password Reset Request</h1>
      <p>Hi ${user.username},</p>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <br>
      <p>Best regards,<br>ERP Team</p>
    `;

    return await this.sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      html,
      text: `Password reset link: ${resetUrl}`,
      priority: 'high'
    });
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmationEmail(order, user) {
    const html = `
      <h1>Order Confirmation</h1>
      <p>Hi ${user.username},</p>
      <p>Your order #${order.id} has been confirmed.</p>
      <h3>Order Details:</h3>
      <ul>
        <li>Order ID: ${order.id}</li>
        <li>Total Amount: $${order.total_amount}</li>
        <li>Status: ${order.status}</li>
        <li>Date: ${new Date(order.created_at).toLocaleString()}</li>
      </ul>
      <h3>Items:</h3>
      <ul>
        ${order.items.map(item => `<li>${item.name} x ${item.quantity} - $${item.price}</li>`).join('')}
      </ul>
      <br>
      <p>Thank you for your order!</p>
      <p>Best regards,<br>ERP Team</p>
    `;

    return await this.sendEmail({
      to: user.email,
      subject: `Order Confirmation #${order.id}`,
      html,
      text: `Your order #${order.id} has been confirmed. Total: $${order.total_amount}`
    });
  }

  /**
   * Send low stock alert email
   */
  async sendLowStockAlert(products, adminEmail) {
    const html = `
      <h1>Low Stock Alert</h1>
      <p>The following products are running low on stock:</p>
      <table border="1" cellpadding="10">
        <tr>
          <th>Product</th>
          <th>SKU</th>
          <th>Current Stock</th>
        </tr>
        ${products.map(p => `
          <tr>
            <td>${p.name}</td>
            <td>${p.sku}</td>
            <td style="color: red;">${p.stock}</td>
          </tr>
        `).join('')}
      </table>
      <br>
      <p>Please restock these items soon.</p>
      <p>Best regards,<br>ERP System</p>
    `;

    return await this.sendEmail({
      to: adminEmail,
      subject: 'Low Stock Alert',
      html,
      text: `Low stock alert: ${products.length} products need restocking`,
      priority: 'high'
    });
  }

  /**
   * Send daily report email
   */
  async sendDailyReport(reportData, recipientEmail) {
    const html = `
      <h1>Daily Report</h1>
      <h3>Summary for ${new Date().toLocaleDateString()}</h3>
      <ul>
        <li>Total Orders: ${reportData.totalOrders}</li>
        <li>Total Revenue: $${reportData.totalRevenue}</li>
        <li>New Products: ${reportData.newProducts}</li>
        <li>Low Stock Items: ${reportData.lowStockCount}</li>
      </ul>
      <br>
      <p>Full report is available in the dashboard.</p>
      <p>Best regards,<br>ERP System</p>
    `;

    return await this.sendEmail({
      to: recipientEmail,
      subject: `Daily Report - ${new Date().toLocaleDateString()}`,
      html,
      text: `Daily report: ${reportData.totalOrders} orders, $${reportData.totalRevenue} revenue`
    });
  }

  /**
   * Verify email configuration
   */
  async verifyConnection() {
    try {
      await this.transporter.verify();
      return { success: true, message: 'Email server connection successful' };
    } catch (error) {
      console.error('Email verification error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    try {
      const waiting = await this.emailQueue.getWaitingCount();
      const active = await this.emailQueue.getActiveCount();
      const completed = await this.emailQueue.getCompletedCount();
      const failed = await this.emailQueue.getFailedCount();

      return {
        success: true,
        stats: { waiting, active, completed, failed }
      };
    } catch (error) {
      console.error('Queue stats error:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();
