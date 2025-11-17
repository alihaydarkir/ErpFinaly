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
    });aconst sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

class EmailService {
  static async sendEmail(to, subject, htmlContent) {
    try {
      if (!process.env.ENABLE_EMAIL_NOTIFICATIONS || process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'true') {
        console.log('[Email] Notifications disabled');
        return { success: false };
      }

      const msg = {
        to,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject,
        html: htmlContent
      };

      const result = await sgMail.send(msg);
      console.log('[Email] Sent to', to, ':', subject);
      return { success: true };
    } catch (error) {
      console.error('[Email] Error:', error.message);
      return { success: false, error: error.message };
    }
  }

  static async sendTestEmail(to) {
    const html = '<h2>Test Email</h2><p>SendGrid successfully configured!</p>';
    return this.sendEmail(to, 'Test Email - ERP', html);
  }

  static async sendDueSoonChequesNotification(cheques, email) {
    const chequeList = cheques.map(c => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${c.check_serial_no}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${c.customer_company_name || 'N/A'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">₺${c.amount.toLocaleString('tr-TR')}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${c.due_date}</td>
      </tr>
    `).join('');

    const html = `
      <h2>Vade Yaklaşan Çekler Uyarısı</h2>
      <p>Merhaba,</p>
      <p>Aşağıdaki çeklerin vadeleri yaklaşmaktadır:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #f0f0f0;">
            <th style="padding: 8px; text-align: left;">Seri No</th>
            <th style="padding: 8px; text-align: left;">Müşteri</th>
            <th style="padding: 8px; text-align: left;">Tutar</th>
            <th style="padding: 8px; text-align: left;">Vade Tarihi</th>
          </tr>
        </thead>
        <tbody>
          ${chequeList}
        </tbody>
      </table>
      <p>Lütfen gerekli işlemleri yapınız.</p>
    `;

    return this.sendEmail(email, ⚠️ Vade Yaklaşan Çekler Uyarısı', html);
  }

  static async sendOverdueChequesNotification(cheques, email) {
    const chequeList = cheques.map(c => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; color: red;">${c.check_serial_no}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${c.customer_company_name || 'N/A'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">₺${c.amount.toLocaleString('tr-TR')}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; color: red;">${c.due_date}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; color: red;">${c.days_overdue || 0} gün</td>
      </tr>
    `).join('');

    const html = `
      <h2 style="color: red;">🚨 VADESİ GEÇEN ÇEKLER</h2>
      <p>Merhaba,</p>
      <p><strong>ACIL:</strong> Aşağıdaki çeklerin vadeleri geçmiştir:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #ffcccc;">
            <th style="padding: 8px; text-align: left;">Seri No</th>
            <th style="padding: 8px; text-align: left;">Müşteri</th>
            <th style="padding: 8px; text-align: left;">Tutar</th>
            <th style="padding: 8px; text-align: left;">Vade Tarihi</th>
            <th style="padding: 8px; text-align: left;">Geç Günler</th>
          </tr>
        </thead>
        <tbody>
          ${chequeList}
        </tbody>
      </table>
      <p><strong>Lütfen derhal gerekli işlemleri yapınız.</strong></p>
    `;

    return this.sendEmail(email, '🚨 VADESİ GEÇEN ÇEKLER - ACİL', html);
  }

  static async sendLowStockAlert(products, email) {
    const productList = products.map(p => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${p.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${p.sku}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; color: red;">${p.stock}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${p.low_stock_threshold}</td>
      </tr>
    `).join('');

    const html = `
      <h2>Düşük Stok Uyarısı</h2>
      <p>Merhaba,</p>
      <p>Aşağıdaki ürünlerin stok seviyeleri düşüktür:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #fff3cd;">
            <th style="padding: 8px; text-align: left;">Ürün Adı</th>
            <th style="padding: 8px; text-align: left;">SKU</th>
            <th style="padding: 8px; text-align: left;">Mevcut Stok</th>
            <th style="padding: 8px; text-align: left;">Min. Eşik</th>
          </tr>
        </thead>
        <tbody>
          ${productList}
        </tbody>
      </table>
      <p>Lütfen stoğu yenileyin.</p>
    `;

    return this.sendEmail(email, '⚠️ Düşük Stok Uyarısı', html);
  }

  static async sendOrderStatusChangeNotification(order, newStatus, email) {
    const html = `
      <h2>Sipariş Durum Değişikliği</h2>
      <p>Merhaba,</p>
      <p>Sipariş #${order.id} numaralı siparişin durumu değişmiştir.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px; background-color: #f0f0f0; font-weight: bold;">Sipariş No:</td>
          <td style="padding: 8px;">${order.id}</td>
        </tr>
        <tr>
          <td style="padding: 8px; background-color: #f0f0f0; font-weight: bold;">Müşteri:</td>
          <td style="padding: 8px;">${order.customer_company_name || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; background-color: #f0f0f0; font-weight: bold;">Eski Durum:</td>
          <td style="padding: 8px;">${order.status}</td>
        </tr>
        <tr>
          <td style="padding: 8px; background-color: #f0f0f0; font-weight: bold;">Yeni Durum:</td>
          <td style="padding: 8px; color: green; font-weight: bold;">${newStatus}</td>
        </tr>
        <tr>
          <td style="padding: 8px; background-color: #f0f0f0; font-weight: bold;">Tutar:</td>
          <td style="padding: 8px;">₺${order.total_amount.toLocaleString('tr-TR')}</td>
        </tr>
      </table>
    `;

    return this.sendEmail(email, `📋 Sipariş Durum Değişikliği - ${newStatus}`, html);
  }
}

module.exports = EmailService;

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
   * Send order status update email
   */
  async sendOrderStatusUpdateEmail(order, user, newStatus) {
    const html = `
      <h1>Order Status Update</h1>
      <p>Hi ${user.username || user.full_name},</p>
      <p>Your order #${order.id} status has been updated.</p>
      <h3>Order Details:</h3>
      <ul>
        <li>Order ID: ${order.id}</li>
        <li>New Status: <strong>${newStatus}</strong></li>
        <li>Total Amount: $${order.total_amount}</li>
        <li>Updated: ${new Date().toLocaleString()}</li>
      </ul>
      <br>
      <p>Thank you for your patience!</p>
      <p>Best regards,<br>ERP Team</p>
    `;

    return await this.sendEmail({
      to: user.email,
      subject: `Order Status Update #${order.id}`,
      html,
      text: `Your order #${order.id} status is now: ${newStatus}`
    });
  }

  /**
   * Send order cancellation email
   */
  async sendOrderCancellationEmail(order, user, reason) {
    const html = `
      <h1>Order Cancelled</h1>
      <p>Hi ${user.username || user.full_name},</p>
      <p>Your order #${order.id} has been cancelled.</p>
      <h3>Order Details:</h3>
      <ul>
        <li>Order ID: ${order.id}</li>
        <li>Total Amount: $${order.total_amount}</li>
        <li>Cancellation Date: ${new Date().toLocaleString()}</li>
        ${reason ? `<li>Reason: ${reason}</li>` : ''}
      </ul>
      <p>The stock has been restored and any charges will be refunded within 5-7 business days.</p>
      <br>
      <p>If you have any questions, please contact our support team.</p>
      <p>Best regards,<br>ERP Team</p>
    `;

    return await this.sendEmail({
      to: user.email,
      subject: `Order Cancelled #${order.id}`,
      html,
      text: `Your order #${order.id} has been cancelled. ${reason ? 'Reason: ' + reason : ''}`,
      priority: 'high'
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
