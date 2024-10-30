const Fee = require('../model/FeeModel');

const bcrypt = require('bcrypt');

const createFees = async (req, res) => {
  const { depositFee, withdrawalFee, serviceFee, anonymityFee, password } = req.body;

  try {
    // Check if a Fee document already exists
    const existingFee = await Fee.findOne();
    if (existingFee) {
      return res.status(400).json({ message: 'Fee document already exists. Use the update endpoint instead.' });
    }

    // Create a new Fee document
    const newFee = new Fee({
      depositFee,
      withdrawalFee,
      serviceFee,
      anonymityFee,
      password // Will be hashed by the pre-save middleware
    });

    // Save to the database
    await newFee.save();

    res.status(201).json({ message: 'Fee document created successfully' });
  } catch (error) {
    console.error('Error creating Fee document:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


  
// Update fees
const updateFees = async (req, res) => {
  const { depositFee, withdrawalFee, serviceFee, anonymityFee, password } = req.body;

  try {
    const feeDoc = await Fee.findOne();
    if (!feeDoc) {
      return res.status(404).json({ message: 'Fee document not found' });
    }

    // Verify password
    const isMatch = await feeDoc.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    // Update fee fields
    feeDoc.depositFee = depositFee;
    feeDoc.withdrawalFee = withdrawalFee;
    feeDoc.serviceFee = serviceFee;
    feeDoc.anonymityFee = anonymityFee;

    await feeDoc.save();

    res.status(200).json({ message: 'Fees updated successfully' });
  } catch (error) {
    console.error('Error updating fees:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


// Controller to get the fees
const getFees = async (req, res) => {
  try {
    // Assuming the fees data is stored in a single document

    const fees = await Fee.findOne(); // Retrieve the fees document from the database
      
    if (!fees) {
      return res.status(404).json({ message: "Fees not found" });
    }

    // Return the fees data
    res.status(200).json(fees);
  } catch (error) {
    // Handle any errors that may occur
    console.error("Error retrieving fees:", error);
    res.status(500).json({ message: "Server error" });
  }
};



module.exports = {
  updateFees,
   createFees,
   getFees
};
