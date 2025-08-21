const adminsService = require("../../admins/admins.service");
const { JWT_TOKEN_TYPES } = require("../../../helpers/constants");
const configs = require("../../../configs");
const JWT = require("../../common/auth/jwt");
const redisClient = require("../../../helpers/redis");
const ADMINS_EVENTS = require("../../admins/constants/admins.events.constant");
const eventEmitter = require("../../common/events/events.event-emitter");

exports.signin = async (signInDto, result = {}) => {
  try {
    const { email, password, rememberMe } = signInDto;

    const response = await adminsService.findAdmin({ email });

    if (response.ex) throw response.ex;

    const admin = response.data;

    if (admin && (await admin.isPasswordValid(password))) {
      // extract safe values from user
      const { password, passwordResetToken, ...safeAdminData } = admin._doc;
      // generate access & refresh token
      const [accessToken, refreshToken] = await Promise.all([
        JWT.signToken(
          {
            id: safeAdminData._id,
            email: safeAdminData.email,
            role: safeAdminData.role,
          },
          JWT_TOKEN_TYPES.ACCESS_TOKEN
        ),
        JWT.signToken(
          {
            id: safeAdminData._id,
            email: safeAdminData.email,
            role: safeAdminData.role,
          },
          JWT_TOKEN_TYPES.REFRESH_TOKEN,
          rememberMe
        ),
      ]);

      // store refresh token in redis
      rememberMe
        ? await redisClient.set(safeAdminData._id.toString(), refreshToken, {
            EX: configs.jwt.refreshToken.redisRemeberMeTTL,
          })
        : await redisClient.set(safeAdminData._id.toString(), refreshToken, {
            EX: configs.jwt.refreshToken.redisTTL,
          });

      result.data = {
        admin: {
          ...safeAdminData,
        },
        accessToken,
        refreshToken,
      };
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.refreshToken = async (refreshTokenDto, result = {}) => {
  try {
    const { userId } = refreshTokenDto;

    const response = await adminsService.findById(userId);

    if (response.ex) throw response.ex;

    if (!response.data) {
      result.adminNotFound = true;
    } else {
      // generate access token
      const accessToken = await JWT.signToken(
        {
          id: response.data._id,
          role: response.data.role,
          email: response.data.email,
        },
        JWT_TOKEN_TYPES.ACCESS_TOKEN
      );

      result.data = {
        accessToken,
      };
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.logout = async (logoutDto, result = {}) => {
  try {
    const { adminId } = logoutDto;
    const res = await redisClient.del(adminId);
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.forgetPassword = async (forgetPasswordDto, result = {}) => {
  try {
    const { email } = forgetPasswordDto;

    const response = await adminsService.findAdmin({ email });

    if (response.ex) throw response.ex;

    if (!response.data) {
      result.adminExist = false;
    } else {
      result.adminExist = true;
      const admin = response.data;
      admin.passwordResetToken = await JWT.signPasswordResetToken();
      await admin.save();

      const passwordResetLink = `${configs.adminFrontEndUrl}/create?token=${admin.passwordResetToken}`;

      eventEmitter.emit(ADMINS_EVENTS.ADMIN_FORGOT_PASSWORD, {
        receiverEmail: admin.email,
        name: admin.name,
        passwordResetLink,
      });
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.resetPassword = async (resetPasswordDto, result = {}) => {
  try {
    const response = await adminsService.resetPassword(resetPasswordDto);

    if (response.ex) throw response.ex;

    if (response.adminNotExist) {
      result = response;
    } else {
      result = response;

      // eventEmitter.emit(ADMINS_EVENTS.ADMIN_PASSWORD_UPDATE, {
      //   receiverEmail: response.data.email,
      //   name: response.data.name
      // });
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
