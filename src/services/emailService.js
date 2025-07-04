import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// SMTP Email yapılandırması - Muhasebia.com için optimized
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mail.muhasebia.com',
  port: parseInt(process.env.SMTP_PORT) || 587, // 587 (STARTTLS) önerilen
  secure: process.env.SMTP_SECURE === 'true', // false for port 587 (STARTTLS)
  requireTLS: true, // STARTTLS zorunlu
  auth: {
    user: process.env.SMTP_USER || 'no-reply@muhasebia.com',
    pass: process.env.SMTP_PASS || 'newpassword123'
  },
  // Bağlantı ayarları
  connectionTimeout: 60000, // 60 saniye
  greetingTimeout: 30000,   // 30 saniye
  socketTimeout: 60000,     // 60 saniye
  // TLS ayarları
  tls: {
    rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false',
    ciphers: 'SSLv3'
  },
  // Debug için
  debug: process.env.NODE_ENV === 'development',
  logger: process.env.NODE_ENV === 'development'
});

// Şifre sıfırlama maili gönder
export const sendPasswordResetEmail = async (email, resetToken, userName) => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: `"Faturabia" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@muhasebia.com'}>`,
      to: email,
      subject: 'Şifre Sıfırlama Talebi - Faturabia',
      html: getPasswordResetEmailTemplate(userName, resetUrl, resetToken),
      // Text alternatifi (HTML desteklemeyen emailler için)
      text: `
        Merhaba ${userName},
        
        Hesabınız için şifre sıfırlama talebinde bulundunuz.
        
        Şifrenizi sıfırlamak için aşağıdaki linki tarayıcınızda açın:
        ${resetUrl}
        
        Alternatif olarak şu kodu kullanabilirsiniz: ${resetToken.slice(-6).toUpperCase()}
        
        Bu link 1 saat içinde geçersiz hale gelecektir.
        Bu talebi siz yapmadıysanız, bu emaili görmezden gelin.
        
        Faturabia Ekibi
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Şifre sıfırlama maili gönderildi:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ SMTP mail gönderme hatası:', error);
    throw new Error(`Email gönderilemedi: ${error.message}`);
  }
};

// Şifre değişikliği onay maili gönder
export const sendPasswordChangedEmail = async (email, userName) => {
  try {
    const mailOptions = {
      from: `"Faturabia" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@muhasebia.com'}>`,
      to: email,
      subject: 'Şifreniz Başarıyla Değiştirildi - Faturabia',
      html: getPasswordChangedEmailTemplate(userName),
      text: `
        Merhaba ${userName},
        
        Şifreniz başarıyla değiştirildi!
        
        Hesabınızın güvenliği için şifreniz ${new Date().toLocaleString('tr-TR')} tarihinde güncellendi.
        
        Bu değişikliği siz yapmadıysanız, lütfen derhal bizimle iletişime geçin.
        
        Faturabia Ekibi
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Şifre değişikliği onay maili gönderildi:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ SMTP onay maili gönderme hatası:', error);
    // Bu mail gönderilmese de hata vermiyoruz
    return { success: false, error: error.message };
  }
};

// Hoşgeldin maili gönder
export const sendWelcomeEmail = async (email, userName) => {
  try {
    const mailOptions = {
      from: `"Faturabia" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@muhasebia.com'}>`,
      to: email,
      subject: 'Hoşgeldiniz! Hesabınız Başarıyla Oluşturuldu - Faturabia',
      html: getWelcomeEmailTemplate(userName, email),
      text: `
        Merhaba ${userName},
        
        Faturabia'ya hoş geldiniz! 🎉
        
        Hesabınız başarıyla oluşturuldu ve artık tüm özelliklerimizden yararlanabilirsiniz.
        
        Email: ${email}
        
        Faturabia ile neler yapabilirsiniz:
        • E-Fatura ve E-Arşiv entegrasyonu
        • Müşteri yönetimi
        • Fatura takibi ve raporlama
        • Gelir-gider analizi
        • Kar/zarar hesaplama
        
        Herhangi bir sorunuz olursa bizimle iletişime geçmekten çekinmeyin.
        
        Faturabia Ekibi
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Hoşgeldin maili gönderildi:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ SMTP hoşgeldin maili gönderme hatası:', error);
    // Bu mail gönderilmese de kullanıcı kayıt işlemi devam etsin
    return { success: false, error: error.message };
  }
};

// Şifre sıfırlama email template'i - Modern tasarım
const getPasswordResetEmailTemplate = (userName, resetUrl, resetToken) => {
  
  return `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Şifre Sıfırlama - Faturabia</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                line-height: 1.6;
                color: #333333;
                background-color: #f8f9fa;
                padding: 20px;
            }
            
            .email-container {
                max-width: 600px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 16px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.1);
                overflow: hidden;
            }
            
            .header {
                background: linear-gradient(135deg, #2C9F1B 0%, #34a85a 100%);
                padding: 40px 30px;
                text-align: center;
                color: white;
            }
            
            .logo {
                width: 80px;
                height: 80px;
                margin: 0 auto 20px;
                background: rgba(255,255,255,0.95);
                border-radius: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 10px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            }
            
            .logo img {
                width: 100%;
                height: 100%;
                object-fit: contain;
                border-radius: 12px;
            }
            
            .header h1 {
                font-size: 28px;
                font-weight: 700;
                margin-bottom: 10px;
                text-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .header p {
                font-size: 16px;
                opacity: 0.9;
                font-weight: 400;
            }
            
            .content {
                padding: 40px 30px;
            }
            
            .greeting {
                font-size: 18px;
                color: #2C9F1B;
                font-weight: 600;
                margin-bottom: 20px;
            }
            
            .message {
                font-size: 16px;
                color: #555555;
                margin-bottom: 30px;
                line-height: 1.7;
            }
            
            .cta-section {
                text-align: center;
                margin: 40px 0;
            }
            
            .reset-button {
                display: inline-block;
                background: linear-gradient(135deg, #2C9F1B 0%, #34a85a 100%) !important;
                color: white !important;
                padding: 16px 32px;
                text-decoration: none;
                border-radius: 50px;
                font-weight: 600;
                font-size: 16px;
                box-shadow: 0 4px 15px rgba(44, 159, 27, 0.3);
                transition: all 0.3s ease;
                border: none;
                cursor: pointer;
            }
            
            a[href] {
                color: #2C9F1B !important;
            }
            
            .reset-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(44, 159, 27, 0.4);
            }
            
            .code-section {
                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                padding: 30px;
                border-radius: 12px;
                margin: 30px 0;
                text-align: center;
                border: 3px solid #2C9F1B;
                box-shadow: 0 4px 15px rgba(44, 159, 27, 0.2);
            }
            
            .instruction-box {
                background: linear-gradient(135deg, #e8f5e8 0%, #f0f9f0 100%);
                border: 1px solid #2C9F1B;
                border-radius: 12px;
                padding: 25px;
                margin: 30px 0;
            }
            
            .instruction-box h3 {
                color: #2C9F1B;
                font-size: 18px;
                margin-bottom: 15px;
                font-weight: 600;
            }
            
            .instruction-box ol {
                color: #2d5016;
                font-size: 15px;
                line-height: 1.6;
                margin-left: 20px;
            }
            
            .instruction-box li {
                margin-bottom: 8px;
                font-weight: 500;
            }
            
            .code-label {
                font-size: 14px;
                color: #666666;
                margin-bottom: 10px;
                text-transform: uppercase;
                letter-spacing: 1px;
                font-weight: 600;
            }
            
            .reset-code {
                font-size: 32px;
                font-weight: 700;
                color: #2C9F1B;
                letter-spacing: 6px;
                font-family: 'Courier New', monospace;
                text-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .security-warning {
                background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
                border-left: 4px solid #ffc107;
                padding: 20px;
                border-radius: 8px;
                margin: 30px 0;
            }
            
            .security-warning h3 {
                color: #856404;
                font-size: 16px;
                margin-bottom: 10px;
                display: flex;
                align-items: center;
            }
            
            .security-warning ul {
                color: #856404;
                margin-left: 20px;
            }
            
            .security-warning li {
                margin-bottom: 5px;
            }
            
            .divider {
                height: 1px;
                background: linear-gradient(to right, transparent, #e9ecef, transparent);
                margin: 30px 0;
            }
            
            .footer {
                background: #f8f9fa;
                padding: 30px;
                text-align: center;
                border-top: 1px solid #e9ecef;
            }
            
            .footer p {
                color: #666666;
                font-size: 14px;
                margin-bottom: 5px;
            }
            
            .footer .company {
                color: #2C9F1B;
                font-weight: 600;
            }
            
            .url-section {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
                border: 1px solid #e9ecef;
            }
            
            .url-section p {
                font-size: 13px;
                color: #666666;
                margin-bottom: 5px;
            }
            
            .url-text {
                font-size: 12px;
                color: #2C9F1B;
                word-break: break-all;
                font-family: 'Courier New', monospace;
            }
            
            @media (max-width: 600px) {
                .email-container {
                    margin: 0;
                    border-radius: 0;
                }
                
                .content, .header, .footer {
                    padding: 20px;
                }
                
                .reset-code {
                    font-size: 24px;
                    letter-spacing: 3px;
                }
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <div class="logo">
                    <img src="https://i.hizliresim.com/b2svrer.png" alt="Faturabia Logo" />
                </div>
                <h1>Faturabia</h1>
                <p>Profesyonel Fatura Yönetim Sistemi</p>
            </div>
            
            <div class="content">
                <div class="greeting">Merhaba ${userName}! 👋</div>
                
                <div class="message">
                    Hesabınız için şifre sıfırlama talebinde bulundunuz. Güvenliğiniz bizim için önemli, 
                    bu nedenle aşağıdaki <strong>6 haneli kodu</strong> mobil uygulamanızda girerek şifrenizi güvenli bir şekilde sıfırlayabilirsiniz.
                </div>
                
                <div class="code-section">
                    <div class="code-label">Şifre Sıfırlama Kodu</div>
                    <div class="reset-code">${resetToken.slice(-6).toUpperCase()}</div>
                </div>
                
                <div class="instruction-box">
                    <h3>📱 Nasıl Kullanılır?</h3>
                    <ol>
                        <li>Faturabia mobil uygulamanızı açın</li>
                        <li>"Şifremi Unuttum" bölümüne gidin</li>
                        <li>Yukarıdaki <strong>6 haneli kodu</strong> girin</li>
                        <li>Yeni şifrenizi belirleyin</li>
                    </ol>
                </div>
                
                <div class="security-warning">
                    <h3>🛡️ Güvenlik Bilgilendirmesi</h3>
                    <ul>
                        <li><strong>1 saat</strong> içinde geçersiz hale gelecektir</li>
                        <li>Bu talebi siz yapmadıysanız, bu emaili <strong>görmezden gelin</strong></li>
                        <li>Şifrenizi <strong>kimseyle paylaşmayın</strong></li>
                        <li>Faturabia asla telefon/email ile şifre sormaz</li>
                    </ul>
                                 </div>
             </div>
            
            <div class="footer">
                <p>Bu email otomatik olarak gönderilmiştir, lütfen yanıtlamayın.</p>
                <p>© 2024 <span class="company">Faturabia</span> - Tüm hakları saklıdır.</p>
                <p>Muhasebia Teknoloji çözümleri</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Şifre değiştirildi email template'i - Modern tasarım
const getPasswordChangedEmailTemplate = (userName) => {
  return `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Şifre Değiştirildi - Faturabia</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                line-height: 1.6;
                color: #333333;
                background-color: #f8f9fa;
                padding: 20px;
            }
            
            .email-container {
                max-width: 600px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 16px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.1);
                overflow: hidden;
            }
            
            .header {
                background: linear-gradient(135deg, #2C9F1B 0%, #34a85a 100%);
                padding: 40px 30px;
                text-align: center;
                color: white;
            }
            
            .logo {
                width: 80px;
                height: 80px;
                margin: 0 auto 20px;
                background: rgba(255,255,255,0.95);
                border-radius: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 10px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            }
            
            .logo img {
                width: 100%;
                height: 100%;
                object-fit: contain;
                border-radius: 12px;
            }
            
            .header h1 {
                font-size: 28px;
                font-weight: 700;
                margin-bottom: 10px;
                text-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .content {
                padding: 40px 30px;
            }
            
            .success-section {
                background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
                border-left: 4px solid #2C9F1B;
                padding: 30px;
                border-radius: 12px;
                margin: 30px 0;
                text-align: center;
            }
            
            .success-icon {
                font-size: 48px;
                margin-bottom: 15px;
            }
            
            .success-title {
                font-size: 24px;
                color: #2C9F1B;
                font-weight: 700;
                margin-bottom: 10px;
            }
            
            .success-message {
                color: #155724;
                font-size: 16px;
                line-height: 1.6;
            }
            
            .details-box {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                border: 1px solid #e9ecef;
            }
            
            .detail-item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                font-size: 14px;
            }
            
            .detail-label {
                color: #666666;
                font-weight: 600;
            }
            
            .detail-value {
                color: #2C9F1B;
                font-weight: 600;
            }
            
            .warning-section {
                background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
                border-left: 4px solid #dc3545;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
            }
            
            .warning-section h3 {
                color: #721c24;
                font-size: 16px;
                margin-bottom: 10px;
            }
            
            .warning-section p {
                color: #721c24;
                font-size: 14px;
            }
            
            .footer {
                background: #f8f9fa;
                padding: 30px;
                text-align: center;
                border-top: 1px solid #e9ecef;
            }
            
            .footer p {
                color: #666666;
                font-size: 14px;
                margin-bottom: 5px;
            }
            
            .footer .company {
                color: #2C9F1B;
                font-weight: 600;
            }
            
            @media (max-width: 600px) {
                .email-container {
                    margin: 0;
                    border-radius: 0;
                }
                
                .content, .header, .footer {
                    padding: 20px;
                }
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <div class="logo">
                    <img src="https://i.hizliresim.com/b2svrer.png" alt="Faturabia Logo" />
                </div>
                <h1>Faturabia</h1>
            </div>
            
            <div class="content">
                <div class="success-section">
                    <div class="success-icon">✅</div>
                    <div class="success-title">Şifreniz Başarıyla Değiştirildi!</div>
                    <div class="success-message">
                        Merhaba <strong>${userName}</strong>, hesabınızın güvenliği için şifreniz başarıyla güncellendi.
                    </div>
                </div>
                
                <div class="details-box">
                    <div class="detail-item">
                        <span class="detail-label">📅 Değişiklik Tarihi:</span>
                        <span class="detail-value">${new Date().toLocaleString('tr-TR')}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">🔐 Güvenlik Durumu:</span>
                        <span class="detail-value">Aktif</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">📧 Hesap:</span>
                        <span class="detail-value">Doğrulanmış</span>
                    </div>
                </div>
                
                <div class="warning-section">
                    <h3>🚨 Önemli Güvenlik Uyarısı</h3>
                    <p>
                        Bu değişikliği siz yapmadıysanız, hesabınız tehlike altında olabilir. 
                        Lütfen derhal bizimle iletişime geçin ve hesabınızı güvence altına alın.
                    </p>
                </div>
                
                <p style="margin-top: 30px; font-size: 16px; color: #555;">
                    Faturabia'yı kullandığınız için teşekkür ederiz. Hesabınızın güvenliği bizim önceliğimizdir.
                </p>
            </div>
            
            <div class="footer">
                <p>Bu email otomatik olarak gönderilmiştir, lütfen yanıtlamayın.</p>
                <p>© 2024 <span class="company">Faturabia</span> - Tüm hakları saklıdır.</p>
                <p>Muhasebia Teknoloji çözümleri</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Hoşgeldin maili template'i - Şifre sıfırlama ile aynı tasarım
const getWelcomeEmailTemplate = (userName, userEmail) => {
  return `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Hoşgeldiniz - Faturabia</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                line-height: 1.6;
                color: #333333;
                background-color: #f8f9fa;
                padding: 20px;
            }
            
            .email-container {
                max-width: 600px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 16px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.1);
                overflow: hidden;
            }
            
            .header {
                background: linear-gradient(135deg, #2C9F1B 0%, #34a85a 100%);
                padding: 40px 30px;
                text-align: center;
                color: white;
            }
            
            .logo {
                width: 80px;
                height: 80px;
                margin: 0 auto 20px;
                background: rgba(255,255,255,0.95);
                border-radius: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 10px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            }
            
            .logo img {
                width: 100%;
                height: 100%;
                object-fit: contain;
                border-radius: 12px;
            }
            
            .header h1 {
                font-size: 28px;
                font-weight: 700;
                margin-bottom: 10px;
                text-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .header p {
                font-size: 16px;
                opacity: 0.9;
            }
            
            .content {
                padding: 40px 30px;
            }
            
            .welcome-section {
                background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
                border-left: 4px solid #2C9F1B;
                padding: 30px;
                border-radius: 12px;
                margin: 30px 0;
                text-align: center;
            }
            
            .welcome-icon {
                font-size: 48px;
                margin-bottom: 15px;
            }
            
            .welcome-title {
                font-size: 24px;
                color: #2C9F1B;
                font-weight: 700;
                margin-bottom: 10px;
            }
            
            .welcome-message {
                color: #155724;
                font-size: 16px;
                line-height: 1.6;
            }
            
            .features-section {
                background: #f8f9fa;
                padding: 30px;
                border-radius: 12px;
                margin: 30px 0;
            }
            
            .features-title {
                font-size: 20px;
                color: #2C9F1B;
                font-weight: 700;
                margin-bottom: 20px;
                text-align: center;
            }
            
            .feature-item {
                display: flex;
                align-items: center;
                margin-bottom: 15px;
                padding: 15px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            }
            
            .feature-icon {
                font-size: 24px;
                margin-right: 15px;
                width: 40px;
                text-align: center;
            }
            
            .feature-text {
                font-size: 16px;
                color: #333;
            }
            
            .account-info {
                background: #e8f5e8;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                border: 1px solid #c3e6cb;
            }
            
            .info-item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                font-size: 14px;
            }
            
            .info-label {
                color: #666666;
                font-weight: 600;
            }
            
            .info-value {
                color: #2C9F1B;
                font-weight: 600;
            }
            
            .footer {
                background: #f8f9fa;
                padding: 30px;
                text-align: center;
                border-top: 1px solid #e9ecef;
            }
            
            .footer p {
                color: #666666;
                font-size: 14px;
                margin-bottom: 5px;
            }
            
            .footer .company {
                color: #2C9F1B;
                font-weight: 600;
            }
            
            @media (max-width: 600px) {
                .email-container {
                    margin: 0;
                    border-radius: 0;
                }
                
                .content, .header, .footer {
                    padding: 20px;
                }
                
                .features-section {
                    padding: 20px;
                }
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <div class="logo">
                    <img src="https://i.hizliresim.com/b2svrer.png" alt="Faturabia Logo" />
                </div>
                <h1>Faturabia</h1>
                <p>E-Fatura ve Muhasebe Çözümleri</p>
            </div>
            
            <div class="content">
                <div class="welcome-section">
                    <div class="welcome-icon">🎉</div>
                    <div class="welcome-title">Hoş Geldiniz!</div>
                    <div class="welcome-message">
                        Merhaba <strong>${userName}</strong>, Faturabia ailesine katıldığınız için çok mutluyuz! 
                        Hesabınız başarıyla oluşturuldu ve artık tüm özelliklerimizden yararlanabilirsiniz.
                    </div>
                </div>
                
                <div class="account-info">
                    <div class="info-item">
                        <span class="info-label">📧 Email Adresiniz:</span>
                        <span class="info-value">${userEmail}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">📅 Hesap Oluşturma:</span>
                        <span class="info-value">${new Date().toLocaleString('tr-TR')}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">✅ Hesap Durumu:</span>
                        <span class="info-value">Aktif</span>
                    </div>
                </div>
                
                <div class="features-section">
                    <div class="features-title">Faturabia ile Neler Yapabilirsiniz?</div>
                    
                    <div class="feature-item">
                        <div class="feature-icon">📊</div>
                        <div class="feature-text"><strong>E-Fatura Entegrasyonu:</strong> Gelen ve giden e-faturalarınızı otomatik senkronize edin</div>
                    </div>
                    
                    <div class="feature-item">
                        <div class="feature-icon">📁</div>
                        <div class="feature-text"><strong>E-Arşiv Yönetimi:</strong> E-arşiv faturalarınızı kolayca yönetin</div>
                    </div>
                    
                    <div class="feature-item">
                        <div class="feature-icon">👥</div>
                        <div class="feature-text"><strong>Müşteri Yönetimi:</strong> Müşterilerinizi organize edin ve takip edin</div>
                    </div>
                    
                    <div class="feature-item">
                        <div class="feature-icon">📈</div>
                        <div class="feature-text"><strong>Gelir-Gider Analizi:</strong> Kar/zarar hesaplama ve detaylı raporlar</div>
                    </div>
                    
                    <div class="feature-item">
                        <div class="feature-icon">📋</div>
                        <div class="feature-text"><strong>Fatura İstatistikleri:</strong> Toplam tutarlar ve performans göstergeleri</div>
                    </div>
                </div>
                
                <p style="margin-top: 30px; font-size: 16px; color: #555; text-align: center;">
                    Faturabia'yı seçtiğiniz için teşekkür ederiz. Herhangi bir sorunuz olursa bizimle iletişime geçmekten çekinmeyin.
                </p>
            </div>
            
            <div class="footer">
                <p>Bu email otomatik olarak gönderilmiştir, lütfen yanıtlamayın.</p>
                <p>© 2024 <span class="company">Faturabia</span> - Tüm hakları saklıdır.</p>
                <p>Muhasebia Teknoloji çözümleri</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

export default { sendPasswordResetEmail, sendPasswordChangedEmail, sendWelcomeEmail }; 