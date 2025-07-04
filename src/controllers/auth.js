import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";
import crypto from 'crypto';
import User from "../models/User.js";
import { secret_key } from "../config/env/index.js";
import { sendPasswordResetEmail, sendPasswordChangedEmail, sendWelcomeEmail } from '../services/emailService.js';

async function register(req, res) {
  try {
    const userBody = req.body;
    const { email, password, fullName } = userBody;

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ error: 'Kullanıcı zaten mevcut' })
    }

    if (password.length < 6)
      return res
        .status(400)
        .json({ error: "Şifreniz en az 6 karakter olmalıdır" });
    if (password.length > 32)
      return res
        .status(400)
        .json({ error: "Şifreniz en fazla 32 karakter olmalıdır" });

    if (!password.match(/[a-z]/g))
      return res
        .status(400)
        .json({ error: "Şifreniz en az bir küçük harf içermelidir" });
    if (!password.match(/[A-Z]/g))
      return res
        .status(400)
        .json({ error: "Şifreniz en az bir büyük harf içermelidir" });
    if (!password.match(/[0-9]/g))
      return res
        .status(400)
        .json({ error: "Şifreniz en az bir rakam içermelidir" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ ...userBody, password: hashedPassword });
    
    await user.save();

    // Hoşgeldin maili gönder (hata olsa da kayıt işlemi devam etsin)
    try {
      await sendWelcomeEmail(email, fullName);
    } catch (emailError) {
      console.error('Hoşgeldin maili gönderilemedi:', emailError);
      // Email hatası olsa da kullanıcı kayıt işlemi başarılı sayılır
    }

    res.status(201).json({ 
      message: "Kullanıcı başarıyla oluşturuldu",
      emailSent: true // Frontend'e email gönderildiğini bildir
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred", message: error.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        error: 'Geçersiz istek, giriş için hem e-posta hem de şifre sağlayın.',
      })
    }

    const user = await User.findOne({ email })

    if (!user) {
      return res.status(401).json({
        error:
          'Kullanıcı bulunamadı, lütfen doğru e-posta adresi girildiğinden emin olun.',
      })
    }

    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      return res
        .status(401)
        .json({ error: 'Hatalı şifre, lütfen şifrenizi kontrol ediniz.' })
    }

    const token = jwt.sign({ userId: user._id }, secret_key, {
      expiresIn: '365d',
    })
    res.status(200).json({ accessToken: token })
  } catch (error) {
    res.status(500).json({ error: 'Giriş başarısız.', message: error.message})
  }
}

// Şifremi unuttum - Email gönder
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email adresi gereklidir' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Güvenlik için kullanıcı bulunamasa da başarılı mesajı döndürüyoruz
      return res.status(200).json({ 
        message: 'Eğer bu email adresi sistemde kayıtlıysa, şifre sıfırlama linki gönderilecektir.' 
      });
    }

    // Şifre sıfırlama token'ı oluştur (güvenli random string)
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Token'ı hash'le ve veritabanına kaydet
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Token'ı ve süresini kullanıcıya kaydet (1 saat geçerli)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 saat
    await user.save();

    // Email gönder
    try {
      await sendPasswordResetEmail(user.email, resetToken, user.fullName);
      
      res.status(200).json({
        message: 'Şifre sıfırlama linki email adresinize gönderildi.',
        // Development ortamı için token'ı da gösterelim
        ...(process.env.NODE_ENV === 'development' && { resetToken })
      });
    } catch (emailError) {
      // Email gönderilemeirse token'ı temizle
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      
      console.error('Email gönderme hatası:', emailError);
      res.status(500).json({ error: 'Email gönderilemedi. Lütfen daha sonra tekrar deneyin.' });
    }

  } catch (error) {
    console.error('Forgot password hatası:', error);
    res.status(500).json({ error: 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.' });
  }
}

// Şifreyi sıfırla
async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token ve yeni şifre gereklidir' });
    }

    // Şifre validasyonu
    if (newPassword.length < 6)
      return res.status(400).json({ error: "Şifreniz en az 6 karakter olmalıdır" });
    if (newPassword.length > 32)
      return res.status(400).json({ error: "Şifreniz en fazla 32 karakter olmalıdır" });
    if (!newPassword.match(/[a-z]/g))
      return res.status(400).json({ error: "Şifreniz en az bir küçük harf içermelidir" });
    if (!newPassword.match(/[A-Z]/g))
      return res.status(400).json({ error: "Şifreniz en az bir büyük harf içermelidir" });
    if (!newPassword.match(/[0-9]/g))
      return res.status(400).json({ error: "Şifreniz en az bir rakam içermelidir" });

    // Token'ı hash'le
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Token'ı ve süresini kontrol et
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        error: 'Şifre sıfırlama token\'ı geçersiz veya süresi dolmuş' 
      });
    }

    // Yeni şifreyi hash'le ve kaydet
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Onay emaili gönder (hata olsa da devam edelim)
    try {
      await sendPasswordChangedEmail(user.email, user.fullName);
    } catch (emailError) {
      console.error('Şifre değişikliği onay emaili gönderilemedi:', emailError);
    }

    res.status(200).json({ 
      message: 'Şifreniz başarıyla değiştirildi. Artık yeni şifrenizle giriş yapabilirsiniz.' 
    });

  } catch (error) {
    console.error('Reset password hatası:', error);
    res.status(500).json({ error: 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.' });
  }
}

// Token'ı doğrula (frontend için)
async function validateResetToken(req, res) {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ error: 'Token gereklidir' });
    }

    // Token'ı hash'le
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Token'ı kontrol et
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        valid: false,
        error: 'Token geçersiz veya süresi dolmuş' 
      });
    }

    res.status(200).json({ 
      valid: true,
      message: 'Token geçerli',
      userEmail: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') // Email'i kısmi göster
    });

  } catch (error) {
    console.error('Token validation hatası:', error);
    res.status(500).json({ error: 'Bir hata oluştu' });
  }
}

async function updateUser(req, res) {
  try {
    const userId = req.userId

    const existingUser = await User.findById(userId)

    if (!existingUser) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' })
    }

    // Model'de tanımlı field'lar (apartmentName -> apartmentNo düzeltmesi)
    const fields = [
      'fullName',
      'email',
      'bankName',
      'IBAN',
      'taxAdministiration',
      'title',
      'mersisNumber',
      'registirationNumber',
      'street',
      'apartmentName',
      'apartmentNo',
      'doorNumber',
      'neighborhood',
      'town',
      'city',
      'postCode',
      'country',
      'phone',
      'fax',
      'website',
      'businnesCenter'
    ];
    
    // Email unique kontrolü
    if (req.body.email && req.body.email !== existingUser.email) {
      const emailExists = await User.findOne({ email: req.body.email });
      if (emailExists) {
        return res.status(400).json({ error: 'Bu email adresi zaten kullanımda' });
      }
    }

    // Field'ları güncelle
    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        existingUser[field] = req.body[field];
      }
    });
     
    // Şifre validasyonu ve güncellemesi
    const { password } = req.body;  
    if (password) {
      if (password.length < 6)
        return res
          .status(400)
          .json({ error: 'Şifreniz en az 6 karakter olmalıdır' });
      if (password.length > 32)
        return res
          .status(400)
          .json({ error: 'Şifreniz en fazla 32 karakter olmalıdır' });

      if (!password.match(/[a-z]/g))
        return res
          .status(400)
          .json({ error: 'Şifreniz en az bir küçük harf içermelidir' });
      if (!password.match(/[A-Z]/g))
        return res
          .status(400)
          .json({ error: 'Şifreniz en az bir büyük harf içermelidir' });
      if (!password.match(/[0-9]/g))
        return res
          .status(400)
          .json({ error: 'Şifreniz en az bir rakam içermelidir' });
      
      existingUser.password = await bcrypt.hash(password, 10);
    }

    // UpdatedAt field'ını güncelle
    existingUser.updatedAt = new Date();

    await existingUser.save();
    
    // Güncellenmiş kullanıcı bilgilerini döndür (şifre hariç)
    const updatedUserResponse = await User.findById(userId).select('-password');
    
    res.status(200).json({ 
      message: 'Kullanıcı başarıyla güncellendi',
      user: updatedUserResponse
    });
  } catch (error) {
    console.error('Kullanıcı güncelleme hatası:', error);
    res.status(500).json({ 
      message: 'Güncelleme başarısız.', 
      error: error.message
    });
  }
}

async function updateNESApiKey(req, res) {
  try {
    const userId = req.userId;

    const { nesApiKey } = req.body;
    
    if (!nesApiKey) {
      return res.status(400).json({ error: 'NES API anahtarı sağlanmadı' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { nesApiKey: nesApiKey } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    res.status(200).json({ 
      message: 'NES API anahtarı başarıyla güncellendi',
      user: {
        nesApiKey: updatedUser.nesApiKey
      }
    });
  }
  catch (error) {
    console.error("Hata detayı:", error);
    res.status(500).json({ 
      message: 'Güncelleme başarısız.',
      error: error.message
    });
  }
}


async function getUser(req, res) {
  try {
    const userId = req.userId
    
    const user = await User.findById(userId).select('-password')

    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' })
    }

    // Eğer options alanı yoksa otomatik olarak boş array ekle
    if (!user.options) {
      user.options = [];
      await user.save();
    }

    res.status(200).json(user)
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Kullanıcı bilgileri alınırken bir hata oluştu.' })
  }
}

async function changePassword(req, res) {
  try {
    const userId = req.userId;
    const { currentPassword, newPassword } = req.body;

    // Validasyon kontrolleri
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Mevcut şifre ve yeni şifre gereklidir' 
      });
    }

    // Kullanıcıyı bul
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    // Mevcut şifreyi kontrol et
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ 
        error: 'Mevcut şifre yanlış' 
      });
    }

    // Yeni şifre mevcut şifre ile aynı mı?
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ 
        error: 'Yeni şifre mevcut şifre ile aynı olamaz' 
      });
    }

    // Yeni şifre validasyonu
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'Yeni şifre en az 6 karakter olmalıdır' 
      });
    }
    
    if (newPassword.length > 32) {
      return res.status(400).json({ 
        error: 'Yeni şifre en fazla 32 karakter olmalıdır' 
      });
    }

    if (!newPassword.match(/[a-z]/g)) {
      return res.status(400).json({ 
        error: 'Yeni şifre en az bir küçük harf içermelidir' 
      });
    }

    if (!newPassword.match(/[A-Z]/g)) {
      return res.status(400).json({ 
        error: 'Yeni şifre en az bir büyük harf içermelidir' 
      });
    }

    if (!newPassword.match(/[0-9]/g)) {
      return res.status(400).json({ 
        error: 'Yeni şifre en az bir rakam içermelidir' 
      });
    }

    // Yeni şifreyi hash'le ve kaydet
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    user.updatedAt = new Date();
    
    await user.save();

    // Başarı mesajı
    res.status(200).json({ 
      message: 'Şifreniz başarıyla değiştirildi',
      changedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Şifre değiştirme hatası:', error);
    res.status(500).json({ 
      error: 'Şifre değiştirme sırasında bir hata oluştu',
      message: error.message
    });
  }
}

async function updateUserOptions(req, res) {
  try {
    const userId = req.userId;
    const { option, action } = req.body; // action: 'add' veya 'remove'

    // Validasyon
    if (!option) {
      return res.status(400).json({ error: 'Option gereklidir' });
    }

    if (!['add', 'remove'].includes(action)) {
      return res.status(400).json({ error: 'Action add veya remove olmalıdır' });
    }

    // Geçerli option değerleri
    const validOptions = ['nesApiWarningShown'];
    if (!validOptions.includes(option)) {
      return res.status(400).json({ error: 'Geçersiz option değeri' });
    }

    // Kullanıcıyı bul
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    // Eğer options alanı yoksa otomatik olarak boş array ekle
    if (!user.options) {
      user.options = [];
    }

    // Options array'ini güncelle
    if (action === 'add') {
      if (!user.options.includes(option)) {
        user.options.push(option);
      }
    } else if (action === 'remove') {
      user.options = user.options.filter(opt => opt !== option);
    }

    user.updatedAt = new Date();
    await user.save();

    res.status(200).json({ 
      message: 'Kullanıcı seçenekleri başarıyla güncellendi',
      options: user.options
    });

  } catch (error) {
    console.error('Options güncelleme hatası:', error);
    res.status(500).json({ 
      error: 'Options güncellenirken bir hata oluştu',
      message: error.message
    });
  }
}

export { register, login, updateUser, updateNESApiKey, getUser, forgotPassword, resetPassword, validateResetToken, changePassword, updateUserOptions }
