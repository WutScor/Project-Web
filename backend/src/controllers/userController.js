const userModel = require("../models/userModel");
const { paginate } = require("../helpers/paginationHelper");
const https = require("https");
const axios = require("axios");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET_SUB_SYSTEM;

exports.getUsers = async (req, res, next) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : null;
    const limit = req.query.limit ? parseInt(req.query.limit) : null;

    let offset = 0;
    if (page && limit) {
      offset = (page - 1) * limit;
    }

    const users = await userModel.getUsers(limit, offset);
    const totalItems = await userModel.getUserCount();

    const transformedUsers = users.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
      payment_account: { balance: user.balance },
    }));

    const result = limit
      ? paginate(transformedUsers, totalItems, page || 1, limit)
      : { data: transformedUsers, totalItems };

    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.insertUser = async (req, res, next) => {
  try {
    const { username, password, email, isAdmin } = req.body;

    if (
      !username ||
      !password ||
      !email ||
      isAdmin === undefined ||
      isAdmin === null
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }

    await userModel.insertUser(username, password, email, isAdmin);

    res.status(201).json({
      username,
      password,
      email,
      isAdmin,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const result = await userModel.deleteUserById(id);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No fields to update." });
    }

    const updatedUser = await userModel.updateUserById(id, updates);
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({
      updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

exports.createPaymentAccount = async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const token = jwt.sign({ system: "backend" }, JWT_SECRET, {
      expiresIn: "1h",
    });

    const httpsAgent = new https.Agent({ rejectUnauthorized: false });

    const response = await axios.post(
      "https://localhost:4001/payments/accounts",
      { userId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        httpsAgent,
      }
    );

    res.status(201).json({
      message: "Payment account created successfully",
      data: response.data,
    });
  } catch (error) {
    next(error);
  }
};
