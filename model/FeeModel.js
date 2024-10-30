const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const FeeSchema = new mongoose.Schema({
  depositFee: {
    type: Number,
    required: true,
  },
  withdrawalFee: {
    type: Number,
    required: true,
  },
  serviceFee: {
    type: Number,
    required: true,
  },
  anonymityFee: {
    type: Number,
    required: true,
  },
  password: {
    type: String, // Hashed password should be stored as a string
    required: true,
  },
}, { timestamps: true });

// Pre-save middleware to hash password
FeeSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password.toString(), salt);
  }
  next();
});

// Method to compare passwords
FeeSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword.toString(), this.password);
};

module.exports = mongoose.model('Fee', FeeSchema);
