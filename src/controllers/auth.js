import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { secret_key } from "../config/env/index.js";

async function register(req, res) {
  try {
    const userBody = req.body;
    const { email, password } = userBody;

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
    res.status(201).send("Kullanıcı başarıyla oluşturuldu");
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

async function updateUser(req, res) {
  try {
    const userId = req.userId

    const existingUser = await User.findById(userId)

    if (!existingUser) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' })
    }

    const fields = [
      'fullName',
      'password',
      'email',
      'bankName',
      'IBAN',
      'taxAdministiration',
      'title',
      'mersisNumber',
      'registirationNumber',
      'street',
      'apartmentName',
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
    
    fields.forEach(field => {
      if (req.body[field]) {
        existingUser[field] = req.body[field];
      }
    });
     
    const { password } = req.body;  
    if (password) {
      // Eğer yeni bir şifre verildiyse, şifreyi güncelle
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

    await existingUser.save();
    res.status(200).json({ message: 'Kullanıcı başarıyla güncellendi' });
  } catch (error) {
    res.status(500).json({ message: 'Güncelleme başarısız.', error:error.message});
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

    res.status(200).json(user)
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Kullanıcı bilgileri alınırken bir hata oluştu.' })
  }
}


export { register, login, updateUser, updateNESApiKey, getUser }
