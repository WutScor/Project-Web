const createAccount = (req, res) => {
  res.status(200).json({
    message: "Access granted to protected data.",
    user: req.user,
  });
};

module.exports = {
  createAccount,
};
