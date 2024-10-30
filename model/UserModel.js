const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    walletAddress: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    
    mixerObject: {
        wallet: { type: String },  
        mixerAmount: { type: Number, default: 0 },
    },
    mixer: { type: Boolean, default: false ,required: true}, 
    cashOut: {  type: Boolean, default: false , required: true },
    image: {
        url: { type: String },
        public_id: { type: String }
    }
});

// Hash the password before saving the user
userSchema.pre('save', async function (next) {
    try {
        if (!this.isModified('password')) return next(); // Skip if the password is not modified
        const salt = await bcrypt.genSalt(10); // Generate a salt
        this.password = await bcrypt.hash(this.password, salt); // Hash the password
        next();
    } catch (error) {
        next(error); // Pass the error to the next middleware
    }
});

// Compare password for login
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
