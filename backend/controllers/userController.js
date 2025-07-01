import User from "../models/userModel.js";

export const getUserData = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const user = await User.findById(userId).select('-password'); // Exclude password

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      userData: {
        name: user.name,
        id : user._id,
        isAccountVerified: user.isAccountVerified
      },
      success: true,
    })


  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
