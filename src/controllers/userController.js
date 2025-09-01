import User from "../models/User.js";

// @desc Get all users
// @route GET /api/users
export const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};


// @desc Get single user by id
// @route GET /api/users/:id
export const getUserById = async (req, res) =>{
    try{
        const user = await User.findById(req.params.id);
        if(!user) return res.status(404).json({message:"User not found"});
        res.json(user);
    }catch(error){
        res.status(500).json({message:"Server error"});
    }
};

// @desc Create new user
// @route POST /api/users

export const createUser = async (req, res) =>{
    try{
        const {username,email,balance} = req.body;
        if(!username || !email){
            return res.status(400).json({message:"username and email are required"});
        }
        const user = new User({username,email,balance});
        await user.save();
        res.status(201).json(user);
    }catch(error){
        res.status(500).json({message:"Server error"});
    }
};

// @desc Update user
// @route PUT /api/users/:id
export const updateUser = async (req, res) =>{
    try{
        const {username,email,balance} = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            {username,email,balance},
            {new: true}
        ); 
        if(!user) return res.status(404).json({message:"User not found"});
        res.json(user);
    }catch(error){
        res.status(500).json({message:"Server error"});
    }
};


// @desc Delete user
// @route DELETE /api/users/:id

export const deleteUser = async (req, res) =>{
    try{
        const user = await User.findByIdAndDelete(req.params.id);
        if(!user) return res.status(404).json({message:"User not found"});
        res.json({message:"User deleted"}); 
    }catch(error){
        res.status(500).json({message:"Server error"});
    }
};
