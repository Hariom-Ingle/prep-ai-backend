import transporter from '../config/nodemailer.js';
import User from '../models/userModel.js';
import generateToken from '../utils/generateToken.js';
import dotenv from 'dotenv'

dotenv.config()
// Helper functions for validation
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPassword = (password) => {
  return password.length >= 6;
};


// ********************************************* Register Function *******************************************************
export const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        // Assuming isValidEmail and isValidPassword are defined elsewhere
        if (!isValidEmail(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email format.' });
        }

        if (!isValidPassword(password)) { 
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.' });
        }

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ success: false, message: 'User with this email already exists.' });
        }

        const user = await User.create({ name, email, password });

        if (user) {
            // Assuming generateToken handles setting the cookie and token correctly
            generateToken(res, user._id);

            // Beautiful Welcome Email Template
            const mailOption = {
                from: process.env.SENDER_EMAIL,
                to: email,
                subject: 'Welcome to PrepAI - Your Interview Success Partner!',
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; padding: 25px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <img src="https://via.placeholder.com/150x50.png?text=PrepAI+Logo" alt="PrepAI Logo" style="max-width: 180px; height: auto; margin-bottom: 15px;">
                            <h2 style="color: #2c3e50; margin: 0; font-size: 28px;">Welcome to PrepAI! 🎉</h2>
                        </div>
                        <p style="font-size: 16px; margin-bottom: 20px;">
                            Hello ${name || 'there'},
                        </p>
                        <p style="font-size: 16px; margin-bottom: 25px;">
                            We're thrilled to have you join the PrepAI community! Your account has been successfully created.
                        </p>
                        <p style="font-size: 16px; margin-bottom: 25px;">
                            At PrepAI, we're dedicated to helping you ace your interviews with confidence. Get ready to transform your interview preparation with our intelligent tools and resources.
                        </p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="https://your-prepai-app-url.com/dashboard" style="display: inline-block; padding: 15px 30px; font-size: 18px; color: #ffffff; background-color: #3498db; border-radius: 5px; text-decoration: none; font-weight: bold; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                                Start Your Prep Journey!
                            </a>
                        </div>
                        <p style="font-size: 16px; margin-top: 25px; text-align: center;">
                            Your login email: <strong>${email}</strong>
                        </p>
                        <p style="font-size: 14px; color: #777; text-align: center; margin-top: 20px;">
                            If you have any questions or need assistance, feel free to visit our <a href="https://your-prepai-app-url.com/help" style="color: #3498db; text-decoration: none;">Help Center</a>.
                        </p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 35px 0;">
                        <p style="text-align: center; font-size: 12px; color: #aaa;">
                            Happy Preparing!
                            <br>
                            The PrepAI Team
                            <br>
                            © ${new Date().getFullYear()} PrepAI. All rights reserved.
                            <br>
                            <a href="https://your-prepai-app-url.com/privacy" style="color: #3498db; text-decoration: none;">Privacy Policy</a> |
                            <a href="https://your-prepai-app-url.com/terms" style="color: #3498db; text-decoration: none;">Terms of Service</a>
                        </p>
                    </div>
                `
            };

            await transporter.sendMail(mailOption);

            return res.status(201).json({
                success: true,
                message: "Signup Successfully! Welcome to PrepAI."
            });
        } else {
            return res.status(400).json({ success: false, message: 'Invalid user data provided.' });
        }
    } catch (error) {
        console.error("Error during user registration:", error);
        res.status(500).json({ success: false, message: 'Server Error during registration. Please try again.' });
    }
};
// ********************************************* Login Function *******************************************************
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log(password)
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      const token = generateToken(res, user._id);
      // console.log(token);
      return res.json({      
        _id: user._id,
        name: user.name,
        email: user.email,
        success: true,
        message: "Logged in Sucessfully"
      });
    } else {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ********************************************* GetUser Function *******************************************************

export const logout = async (req, res) => {
  try {
    // Clear the JWT cookie

    console.log("1", process.env.NODE_ENV === 'production')
    console.log("2", process.env.NODE_ENV === 'production' ? 'none' : 'Strict')

    res.clearCookie('jwt', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'Strict',
      path: '/', // ✅ ensure path is consistent
    });

    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed' });
  }
};


// ********************************************* SEND OTP Function *******************************************************


export const sendVerifyOtp = async (req, res) => {
  console.log('req.body:', req.userId); // 🔍 Debug log

  const userId = req.userId;
  console.log("api hit")

  try {
    const user = await User.findById(userId);

    if (user.isAccountVerified) {
      return res.json({
        success: false,
        message: "Account Already verified"
      });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.verifyOtp = otp;
    user.verifyOtpExpireAt = Date.now() + 60 * 60 * 1000; // OTP expires in 1 hour

    await user.save();

    const mailOption = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: 'Account Verification OTP',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
          <h2 style="color: #0056b3; text-align: center; margin-bottom: 20px;">Verify Your Account</h2>
          <p style="text-align: center; font-size: 16px;">
            Thank you for registering with us! To complete your account verification, please use the One-Time Password (OTP) below.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <p style="font-size: 28px; font-weight: bold; color: #4CAF50; letter-spacing: 5px; padding: 15px 25px; background-color: #e0ffe0; border-radius: 5px; display: inline-block; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
              ${otp}
            </p>
          </div>
          <p style="text-align: center; font-size: 14px; color: #777;">
            This OTP is valid for <strong>1 hour</strong>. Please do not share this OTP with anyone.
          </p>
          <p style="text-align: center; font-size: 14px; color: #777; margin-top: 20px;">
            If you did not request this verification, please ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="text-align: center; font-size: 12px; color: #aaa;">
            © ${new Date().getFullYear()} Your Company Name. All rights reserved.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOption);
    res.json({
      success: true,
      message: 'Verification OTP sent to your Email'
    });

  } catch (error) {
    console.error("Error in sendVerifyOtp:", error); // Use console.error for errors
    res.status(500).json({ success: false, message: "Failed to send OTP. Please try again later." }); // Send a more informative error response
  }
};

// ******************************************** Verify Email Function *******************************************************

export const verifyEmail = async (req, res) => {

  const { otp } = req.body;
  const userId = req.userId;

  console.log(userId, otp)

  if (!userId || !otp) {

    return res.json({
      success: false, message: "Missing Details"
    });
  }
  try {

    const user = await User.findById(userId);

    if (!user) {
      return res.json({
        success: false, message: 'User not found'
      })
    }

    if (user.verifyOtp === '' || user.verifyOtp !== otp) {

      console.log("inside function")
      return res.json({
        success: false, message: 'Invalid OTP'
      })

    }

    if (user.verifyOtpExpireAt < Date.now) {
      return res.json({
        success: false, message: 'OTP Expired'
      })
    }

    user.isAccountVerified = true;
    user.verifyOtp = ''
    user.verifyOtpExpireAt = 0;

    await user.save();
    return res.json({
      success: true, message: 'Email Verified Succesfully'
    })


  } catch (error) {

    console.log(error)

  }

}


// ********************************************* isAuthenticated Function *******************************************************

export const isAuthticated = async (req, res) => {

  try {
    res.json({
      success: true, message: "User Authenticated"
    })

  } catch (error) {
    console.log(error)
    res.json({
      success: false, message: error.message
    })
  }
}

//   
// ********************************************* RESET PASSWORD Function *******************************************************


export const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  console.log(email, newPassword);

  if (!newPassword) {
    return res.json({
      success: false,
      message: "New Password are required"
    });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        success: false,
        message: "User not found"
      });
    }


    // Hash the new password
    // const salt = await bcrypt.genSalt(10);
    // const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the user details
    user.password = newPassword;


    // Save changes to the database
    await user.save();

    return res.json({
      success: true,
      message: "Password reset successfully"
    });

  } catch (error) {
    console.error(error);
    return res.json({
      success: false,
      message: error.message
    });
  }
};


//   Verify reset otp controller function 


export const verifyResetOTP = async (req, res) => {
  const { email, otp } = req.body;
  console.log(email, otp);


  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        success: false,
        message: "User not found"
      });
    }

    if (!user.resetOtp || user.resetOtp !== otp) {
      return res.json({
        success: false,
        message: "Invalid OTP"
      });
    }

    if (user.resetOtpExpireAt < Date.now()) {
      return res.json({
        success: false,
        message: "OTP Expired"
      });
    }


    user.resetOtp = '';
    user.resetOtpExpireAt = 0;

    // Save changes to the database
    await user.save();

    return res.json({
      success: true,
      message: "OTP Verified Successfully"
    });

  } catch (error) {
    console.error(error);
    return res.json({
      success: false,
      message: error.message
    });
  }
};



//  reset password otp controller function 


export const sendResetPasswordOTP = async (req, res) => {
    const { email } = req.body;
    console.log("Request to send reset OTP for email:", email);

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User with this email does not exist."
            });
        }

        // Generate a 6-digit OTP
        const otp = String(Math.floor(100000 + Math.random() * 900000));

        // Save the OTP and its expiration to the user document
        user.resetOtp = otp;
        // Set OTP to expire in, say, 15 minutes (15 * 60 * 1000 milliseconds)
        user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000;

        await user.save();

        // Email content with beautiful HTML
        const mailOption = {
            from: process.env.SENDER_EMAIL, // Your sender email from environment variables
            to: user.email,
            subject: 'Password Reset OTP',
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; padding: 25px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                    <div style="text-align: center; margin-bottom: 30px;">
                        

                        <h1 style="color: #1a73e8; margin: 0; font-size: 26px;">PrepAI</h1>
                        <h2 style="color: #1a73e8; margin: 0; font-size: 26px;">Password Reset Request</h2>
                    </div>
                    <p style="font-size: 16px; margin-bottom: 20px;">
                        Hi ${user.name || 'there'},
                    </p>
                    <p style="font-size: 16px; margin-bottom: 25px;">
                        We received a request to reset your password. Please use the following One-Time Password (OTP) to proceed:
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <p style="font-size: 32px; font-weight: bold; color: #e91e63; letter-spacing: 6px; padding: 18px 30px; background-color: #fff0f5; border-radius: 8px; display: inline-block; border: 1px dashed #e91e63; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                            ${otp}
                        </p>
                    </div>
                    <p style="font-size: 14px; color: #777; text-align: center; margin-top: 25px;">
                        This OTP is valid for <strong>15 minutes</strong>. If you did not request a password reset, please ignore this email.
                    </p>
                    <p style="font-size: 14px; color: #777; text-align: center; margin-top: 15px;">
                        For security reasons, this OTP can only be used once.
                    </p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 35px 0;">
                    <p style="text-align: center; font-size: 12px; color: #aaa;">
                        © ${new Date().getFullYear()} PrepAI. All rights reserved.
                        <br>
                        <a href="https://yourcompany.com/privacy" style="color: #1a73e8; text-decoration: none;">Privacy Policy</a> |
                        <a href="https://yourcompany.com/terms" style="color: #1a73e8; text-decoration: none;">Terms of Service</a>
                    </p>
                </div>
            `
        };

        await transporter.sendMail(mailOption);
        res.json({
            success: true,
            message: 'Password reset OTP sent to your email.'
        });

    } catch (error) {
        console.error("Error sending reset password OTP:", error);
        res.status(500).json({ success: false, message: "Failed to send password reset OTP. Please try again later." });
    }
};


// get  user controller function 

export const getUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
    console.log("--------- req user -----------")
    console.log(req.user)
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};



