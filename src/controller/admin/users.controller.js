const service = require("../../services/admin/users.service");

exports.getUsers = async (req, res) => {
  const data = await service.getUsers();
  res.json(data);
};

exports.createUser = async (req, res) => {
  const result = await service.createUser(req.body);
  res.json(result);
};

exports.updateUser = async (req, res) => {
  const result = await service.updateUser(req.params.id, req.body);
  res.json(result);
};

exports.deleteUser = async (req, res) => {
  const result = await service.deleteUser(req.params.id, req.user.id);
  res.json(result);
};