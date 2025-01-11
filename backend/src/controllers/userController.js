const userModel = require("../models/userModel");
const { paginate } = require("../helpers/paginationHelper");
const https = require("https");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const { pass } = require("../strategies/localStrat");
const { supabase } = require("../config/supabase");
const { BUCKET_NAME: bucketName } = require("../config/constant");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET_SUB_SYSTEM;

exports.getUsers = async (req, res, next) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : null;
    console.log('page at userController:', page);
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    console.log('limit at userController:', limit);
    const offset = page && limit ? (page - 1) * limit : null;
    console.log('offset at userController:', offset);

    const filters = {
      username: req.query.username,
      email: req.query.email,
      isAdmin:
        req.query.isAdmin !== undefined && req.query.isAdmin !== ""
          ? req.query.isAdmin === "true"
          : undefined,
    };

    const items = await userModel.getUsers(limit, offset, filters);

    const totalItems = await userModel.getUserCount(filters);

    const mappedItems = items.map(({ password, ...item }) => item);

    const transformedUsers = users.map((user) => ({
      id: user.id,
      username: user.username,
      password: user.password,
      email: user.email,
      isAdmin: user.isAdmin,
      avatar: user.avatar,
      payment_account: { balance: user.balance },
    }));

    const result = limit
      ? paginate(mappedItems, totalItems, page || 1, limit)
      : { data: mappedItems, totalItems };
    console.log('paginate at userController:', result);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching users." });
  }
};

exports.insertUser = async (req, res, next) => {
  try {
    const { username, password, email, isAdmin } = req.body;
    const avatar = req.file;

    if (!username || !password || isAdmin === undefined || isAdmin === null) {
      return res
        .status(400)
        .json({ message: "Username and password are required." });
    }

    let publicUrl = null;
    if (avatar) {
      const fileName = `${Date.now()}-${avatar.originalname}`;
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, avatar.buffer, {
          contentType: avatar.mimetype,
        });

      if (uploadError) {
        console.log(uploadError);
        return res.status(500).json({ message: "Error uploading avatar." });
      }

      const supabaseUrl = process.env.SUPABASE_URL;
      publicUrl = `https://${supabaseUrl.replace(
        "https://",
        ""
      )}/storage/v1/object/public/${bucketName}/${fileName}`;
    }

    await userModel.insertUser(username, password, email, isAdmin, publicUrl);

    res.status(201).json({
      username,
      password,
      email,
      isAdmin,
      avatar: publicUrl,
    });
  } catch (error) {
    next(error);
  }
}

exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deletedUser = await userModel.deleteUserById(id);
    console.log('deletedUser', deletedUser);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({
      deletedUser,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log('req.body', req.body);
    const { username, email, password, isAdmin } = req.body;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No fields to update." });
    }

    const avatar = req.file;

    if (avatar) {
      const fileName = `${Date.now()}-${avatar.originalname}`;
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, avatar.buffer, {
          contentType: avatar.mimetype,
        });

      if (uploadError) {
        console.log(uploadError);
        return res.status(500).json({ message: "Error uploading image." });
      }

      const supabaseUrl = process.env.SUPABASE_URL;
      const publicUrl = `https://${supabaseUrl.replace(
        "https://",
        ""
      )}/storage/v1/object/public/${bucketName}/${fileName}`;
      if (publicUrl) updates.avatar = publicUrl;
    }

    const updatedUser = await userModel.updateUserById(id, updates);
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    const updatedUser = await userModel.updateUserById(id, username, email, password, isAdmin);

    res.status(200).json({ updatedUser });
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
