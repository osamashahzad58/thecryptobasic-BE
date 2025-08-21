const Admin = require("./admins.model");
const bcrypt = require("bcrypt");
const usersService = require("../users/users.service");

exports.findAdmin = async (findAdminDto, result = {}) => {
  try {
    result.data = await Admin.findOne(findAdminDto);
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.findById = async (adminId, result = {}) => {
  try {
    result.data = await Admin.findById(adminId);
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.resetPassword = async (resetPasswordDto, result = {}) => {
  try {
    const { passwordResetToken, password } = resetPasswordDto;

    const pass = await bcrypt.hash(password, 10);

    const admin = await Admin.findOneAndUpdate(
      {
        passwordResetToken,
      },
      { $unset: { passwordResetToken: "" }, password: pass }
    );

    if (admin) {
      result.data = {
        ...(admin && { name: admin.name }),
        ...(admin && { email: admin.email }),
      };
    } else {
      result.adminNotExist = true;
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
