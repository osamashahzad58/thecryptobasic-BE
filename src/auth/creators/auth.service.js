const creatorsService = require("../users/auth.service");
const { JWT_TOKEN_TYPES } = require("../../../helpers/constants");
const configs = require("../../../configs");
const JWT = require("../../common/auth/jwt");
const redisClient = require("../../../helpers/redis");
const eventEmitter = require("../../common/events/events.event-emitter");
const CONSTANTS = require("../../common/constants/constants");
const usersService = require("../../users/users.service");
const cryptoUtils = require("../../common/crypto/crypto.util");

const User = require("../../users/users.model");

exports.refreshToken = async (refreshTokenDto, result = {}) => {
  try {
    const { userId } = refreshTokenDto;

    const response = await creatorsService.findById(userId);

    if (response.ex) throw response.ex;

    if (!response.data) {
      result.creatorNotFound = true;
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
    const { creatorId } = logoutDto;
    const res = await redisClient.del(creatorId);
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.forgetPassword = async (forgetPasswordDto, result = {}) => {
  try {
    const { email } = forgetPasswordDto;

    const response = await creatorsService.findCreator({ email });

    if (response.ex) throw response.ex;

    if (!response.data) {
      result.creatorExist = false;
    } else {
      result.creatorExist = true;
      const creator = response.data;
      creator.passwordResetToken = await JWT.signPasswordResetToken();
      await creator.save();

      const passwordResetLink = `${configs.creatorFrontEndUrl}reset-password?token=${creator.passwordResetToken}`;

      eventEmitter.emit(CREATORS_EVENTS.CREATOR_FORGOT_PASSWORD, {
        receiverEmail: creator.email,
        name: creator.name,
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
    const response = await creatorsService.resetPassword(resetPasswordDto);

    if (response.ex) throw response.ex;

    if (response.creatorNotExist) {
      result = response;
    } else {
      result = response;

      // eventEmitter.emit(CREATORS_EVENTS.CREATOR_PASSWORD_UPDATE, {
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

exports.loginUser = async (logInDto, result = {}) => {
  try {
    const { walletAddress, sign, rememberMe } = logInDto;
    let user;
    let existingUser = false;
    const response = await usersService.findUserByWalletAddressForCreator({
      walletAddress,
    });
    if (response.ex) throw response.ex;

    if (response.data) {
      user = response.data;
      existingUser = true;
    } else {
      const response1 = await User.create({ ...logInDto, role: "creator" });
      if (response.ex) throw response.ex;
      user = response1;
    }

    if (user) {
      const isSignVerified = cryptoUtils.verifyEthSign(walletAddress, sign);
      if (isSignVerified) {
        const [accessToken, refreshToken] = await Promise.all([
          JWT.signToken(
            {
              id: user.id,
              walletAddress: user.walletAddress,
              role: user.role,
            },
            JWT_TOKEN_TYPES.ACCESS_TOKEN
          ),
          JWT.signToken(
            {
              id: user.id,
              walletAddress: user.walletAddress,
              role: user.role,
            },
            JWT_TOKEN_TYPES.REFRESH_TOKEN,
            rememberMe
          ),
        ]);
        // store refresh token in redis
        rememberMe
          ? await redisClient.set(user.id.toString(), refreshToken, {
              EX: configs.jwt.refreshToken.redisRemeberMeTTL,
            })
          : await redisClient.set(user.id.toString(), refreshToken, {
              EX: configs.jwt.refreshToken.redisTTL,
            });
        result.data = {
          userId: user.id,
          accessToken,
          refreshToken,
          role: user.role,
          kycStatus: user.kycStatus,
          isKycSubmited: user.isKycSubmited,
        };
      } else {
        result.invalidCreds = true;
      }
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
