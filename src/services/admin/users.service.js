const bcrypt = require("bcrypt");
const worker = require("../../services/admin/worker.service");

exports.getUsers = async () => {
    return await worker.get("/users");
};

exports.createUser = async ({ name, email, password }) => {

    if (!name || !email || !password) {
        throw new Error("All fields required");
    }

    const password_hash = await bcrypt.hash(password, 10);
    console.log(password_hash);
    

    const payload = {
        name,
        email,
        password_hash
    };

    return await worker.post("/users", payload);
};

exports.updateUser = async (id, data) => {
    const payload = { ...data };

    if (data.password) {
        payload.password_hash = await bcrypt.hash(data.password, 10);
        delete payload.password;
    }

    return await worker.put(`/users/${id}`, payload);
};
exports.deleteUser = async (id, currentUserId) => {

    if (parseInt(id) === currentUserId) {
        throw new Error("Cannot delete yourself");
    }

    return await worker.delete(`/users/${id}`);
};