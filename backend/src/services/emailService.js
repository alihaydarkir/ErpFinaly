const sgMail = require('@sendgrid/mail');

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

    return this.sendEmail(email, '⚠️ Vade Yaklaşan Çekler Uyarısı', html);
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

  static async sendWelcomeEmail(user) {
    const html = `
      <h1>ERP Sistemine Hoş Geldiniz!</h1>
      <p>Merhaba ${user.username},</p>
      <p>Kayıt olduğunuz için teşekkür ederiz. Hesabınız başarıyla oluşturulmuştur.</p>
      <p>Şimdi sisteme giriş yapabilir ve kullanmaya başlayabilirsiniz.</p>
      <br>
      <p>Saygılarımızla,<br>ERP Ekibi</p>
    `;

    return this.sendEmail(user.email, 'ERP Sistemine Hoş Geldiniz', html);
  }

  static async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const html = `
      <h1>Şifre Sıfırlama Talebi</h1>
      <p>Merhaba ${user.username},</p>
      <p>Şifrenizi sıfırlamak için lütfen aşağıdaki bağlantıya tıklayın:</p>
      <p><a href="${resetUrl}">Şifre Sıfırla</a></p>
      <p>Bu bağlantı 1 saat geçerlidir.</p>
      <p>Eğer bu talebi siz yapmadıysanız, lütfen bu e-postayı göz ardı edin.</p>
      <br>
      <p>Saygılarımızla,<br>ERP Ekibi</p>
    `;

    return this.sendEmail(user.email, 'Şifre Sıfırlama Talebi', html);
  }
}

module.exports = EmailService;