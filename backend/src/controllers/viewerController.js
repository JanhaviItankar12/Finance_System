import User from "../models/userModel.js";


// Viewer: request account activation
export const requestAccountActivation = async (req, res) => {
  try {
    const {email}=req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user=await User.findOne({email:email.toLowerCase()});

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }


    if (user.isActive) {
      return res.status(400).json({ message: "Account is already active" });
    }

    if (user.activationRequested) {
      return res.status(400).json({ message: "Activation request already sent" });
    }

    // mark request
    user.activationRequested = true;
    await user.save();

    return res.status(200).json({ message: "Activation request sent to admin" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};