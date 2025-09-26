const usersService = require("../../users/users.service");
const User = require("../../users/users.model");
const { JWT_TOKEN_TYPES } = require("../../../helpers/constants");
const configs = require("../../../configs");
const JWT = require("../../common/auth/jwt");
const redisClient = require("../../../helpers/redis");
const USERS_EVENTS = require("../../users/constants/users.events.constants");
const EMAIL_VERIFICATION_EVENTS = require("../../users/constants/users.events.constants");
const eventEmitter = require("../../common/events/events.event-emitter");
const CONSTANTS = require("../../common/constants/constants");
const cryptoUtils = require("../../common/crypto/crypto.util");
const { googleAuthenticate } = require("../../common/google/googleAuth");

const otpGenerator = require("otp-generator");

exports.signin = async (signInDto, result = {}) => {
  try {
    const { email, username, password, rememberMe } = signInDto;
    console.log(signInDto, "signInDto");

    const response = await usersService.findUserByEmailOrUsername({
      email,
    });
    if (response.ex) throw response.ex;
    const user = response.data;

    if (user && (await user.isPasswordValid(password))) {
      // extract safe values
      const { password, ...safeUserData } = user._doc;

      // generate tokens
      const [accessToken, refreshToken] = await Promise.all([
        JWT.signToken(
          {
            id: safeUserData._id,
            email: safeUserData?.email,
            role: safeUserData.role,
          },
          JWT_TOKEN_TYPES.ACCESS_TOKEN
        ),
        JWT.signToken(
          {
            id: safeUserData._id,
            email: safeUserData?.email,
            role: safeUserData.role,
          },
          JWT_TOKEN_TYPES.REFRESH_TOKEN
        ),
      ]);

      // save refresh token
      const ttl = rememberMe
        ? configs.jwt.refreshToken.redisRemeberMeTTL
        : configs.jwt.refreshToken.redisTTL;

      await redisClient.set(safeUserData._id.toString(), refreshToken, {
        EX: ttl,
      });

      result.data = {
        ...safeUserData,
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

// exports.signup = async (signUpDto, result = {}) => {
//   try {
//     const response = await usersService.createUser(signUpDto);

//     if (response.ex) throw response.ex;

//     result.data = response.data;
//   } catch (ex) {
//     if (
//       ex.name === CONSTANTS.DATABASE_ERROR_NAMES.MONGO_SERVER_ERROR &&
//       ex.code === CONSTANTS.DATABASE_ERROR_CODES.UNIQUE_VIOLATION
//     ) {
//       const uniqueViolaterMessage = ex.message.split("{ ")[1];
//       const uniqueViolaterField = uniqueViolaterMessage.split(":")[0];
//       result.conflictMessage = `A user with ${uniqueViolaterField} already exist`;
//       result.conflictField = uniqueViolaterField;
//       result.hasConflict = true;
//     } else {
//       result.ex = ex;
//     }
//   } finally {
//     return result;
//   }
// };
exports.signup = async (signUpDto, result = {}) => {
  try {
    const response = await usersService.createUser(signUpDto);

    if (response.ex) throw response.ex;

    const user = response.data;

    // Normalize _id to id (important for JWT)
    const userId = user.id || user._id?.toString();
    if (!userId) {
      throw new Error(
        `User object is invalid. Missing id. Got: ${JSON.stringify(user)}`
      );
    }

    // safe user data
    const safeUserData = {
      id: userId,
      email: user.email,
      role: user.role,
      name: user.name,
      otpExpiresTime: user.otpExpiresTime,
    };

    // generate access & refresh token
    const [accessToken, refreshToken] = await Promise.all([
      JWT.signToken(
        {
          id: safeUserData.id,
          email: safeUserData.email,
          role: safeUserData.role,
        },
        JWT_TOKEN_TYPES.ACCESS_TOKEN
      ),
      JWT.signToken(
        {
          id: safeUserData.id,
          email: safeUserData.email,
          role: safeUserData.role,
        },
        JWT_TOKEN_TYPES.REFRESH_TOKEN
      ),
    ]);

    // merge tokens + otpExpiresTime inside data
    result.data = {
      ...safeUserData,
      accessToken,
      refreshToken,
    };
  } catch (ex) {
    if (
      ex.name === CONSTANTS.DATABASE_ERROR_NAMES.MONGO_SERVER_ERROR &&
      ex.code === CONSTANTS.DATABASE_ERROR_CODES.UNIQUE_VIOLATION
    ) {
      const uniqueViolaterMessage = ex.message.split("{ ")[1];
      const uniqueViolaterField = uniqueViolaterMessage.split(":")[0];
      result.conflictMessage = `A user with ${uniqueViolaterField} already exists`;
      result.conflictField = uniqueViolaterField;
      result.hasConflict = true;
    } else {
      result.ex = ex;
      console.log(ex, "exxxx");
    }
  } finally {
    return result;
  }
};

// exports.registerUser = async (registersDto, result = {}) => {
//   try {
//     const { walletAddress } = registersDto;

//     const existingUser = await usersService.findUserByWalletAddress({
//       walletAddress,
//     });
//     if (existingUser.data) {
//       result.conflictMessage = `User with ${walletAddress} already exist`;
//       result.hasConflict = true;
//     } else {
//       const newuser = await User.create({
//         walletAddress: walletAddress,
//         role: CONSTANTS.ROLES.USER,
//       });

//       result.data = newuser;
//     }
//   } catch (ex) {
//     result.ex = ex;
//   } finally {
//     return result;
//   }
// };

exports.registerUser = async (registersDto, result = {}) => {
  try {
    const { walletAddress } = registersDto;

    const existingUser = await usersService.findUserByWalletAddress({
      walletAddress,
    });

    if (existingUser.data) {
      const user = existingUser.data;

      // Generate tokens for the existing user
      const [accessToken, refreshToken] = await Promise.all([
        JWT.signToken(
          {
            id: user._id,
            walletAddress: user.walletAddress,
            role: user.role,
          },
          JWT_TOKEN_TYPES.ACCESS_TOKEN
        ),
        JWT.signToken(
          {
            id: user._id,
            walletAddress: user.walletAddress,
            role: user.role,
          },
          JWT_TOKEN_TYPES.REFRESH_TOKEN
        ),
      ]);

      // Update Redis with the new refresh token
      await redisClient.set(user._id.toString(), refreshToken, {
        EX: configs.jwt.refreshToken.redisTTL,
      });

      // Include tokens in the result
      result.data = {
        ...user._doc,
        accessToken,
        refreshToken,
      };
      result.conflictMessage = `User with ${walletAddress} already exists`;
      result.hasConflict = true;
      // result.data = existingUser;
      // result.conflictMessage = `User with ${walletAddress} already exists`;
      // result.hasConflict = true;
    } else {
      const newUser = await User.create({
        walletAddress,
        role: CONSTANTS.ROLES.USER,
      });

      // Generate access & refresh tokens
      const [accessToken, refreshToken] = await Promise.all([
        JWT.signToken(
          {
            id: newUser._id,
            walletAddress: newUser.walletAddress,
            role: newUser.role,
          },
          JWT_TOKEN_TYPES.ACCESS_TOKEN
        ),
        JWT.signToken(
          {
            id: newUser._id,
            walletAddress: newUser.walletAddress,
            role: newUser.role,
          },
          JWT_TOKEN_TYPES.REFRESH_TOKEN
        ),
      ]);

      // Store refresh token in Redis
      await redisClient.set(newUser.id.toString(), refreshToken, {
        EX: configs.jwt.refreshToken.redisTTL,
      });

      result.data = {
        ...newUser._doc,
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
exports.loginUser = async (logInDto, result = {}) => {
  try {
    const { walletAddress, sign, rememberMe } = logInDto;
    const response = await usersService.findUserByWalletAddress({
      walletAddress,
    });
    if (!response) {
      result.notFound = true;
    }
    if (response.ex) throw response.ex;

    const user = response.data;

    if (user) {
      // verify sign
      const isSignVerified = cryptoUtils.verifyEthSign(walletAddress, sign);

      if (isSignVerified) {
        // generate access & refresh token
        const [accessToken, refreshToken] = await Promise.all([
          JWT.signToken(
            {
              id: user._id,
              walletAddress: user.walletAddress,
              role: user.role,
            },
            JWT_TOKEN_TYPES.ACCESS_TOKEN
          ),
          JWT.signToken(
            {
              id: user._id,
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
          ...user._doc,
          accessToken,
          refreshToken,
          role: user.role,
          isKycVerified: user.isKycVerified,
          isEmailVerified: user.isEmailVerified,
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

// exports.loginUser = async (logInDto, result = {}) => {
//   try {
//     const { walletAddress, sign, rememberMe } = logInDto;
//     let user;
//     let existingUser = false;
//     const response = await usersService.findUserByWalletAddress({
//       walletAddress,
//     });
//     if (response.ex) throw response.ex;

//     if (response.data) {
//       user = response.data;
//       existingUser = true;
//     } else {
//       const response1 = await User.create(logInDto);
//       if (response.ex) throw response.ex;
//       user = response1;
//     }

//     if (user) {
//       const isSignVerified = cryptoUtils.verifyEthSign(walletAddress, sign);
//       if (isSignVerified) {
//         const [accessToken, refreshToken] = await Promise.all([
//           JWT.signToken(
//             {
//               id: user.id,
//               walletAddress: user.walletAddress,
//               role: user.role,
//             },
//             JWT_TOKEN_TYPES.ACCESS_TOKEN
//           ),
//           JWT.signToken(
//             {
//               id: user.id,
//               walletAddress: user.walletAddress,
//               role: user.role,
//             },
//             JWT_TOKEN_TYPES.REFRESH_TOKEN,
//             rememberMe
//           ),
//         ]);
//         // store refresh token in redis
//         rememberMe
//           ? await redisClient.set(user.id.toString(), refreshToken, {
//               EX: configs.jwt.refreshToken.redisRemeberMeTTL,
//             })
//           : await redisClient.set(user.id.toString(), refreshToken, {
//               EX: configs.jwt.refreshToken.redisTTL,
//             });
//         result.data = {
//           userId: user.id,
//           accessToken,
//           refreshToken,
//           role: user.role,
//           isKycVerified: user.isKycVerified,
//           isEmailVerified: user.isEmailVerified,
//         };
//       } else {
//         result.invalidCreds = true;
//       }
//     }
//   } catch (ex) {
//     result.ex = ex;
//   } finally {
//     return result;
//   }
// };

exports.refreshToken = async (refreshTokenDto, result = {}) => {
  try {
    const { userId } = refreshTokenDto;

    const response = await usersService.findUserById(userId);

    if (response.ex) throw response.ex;

    if (!response.data) {
      result.userNotFound = true;
    } else {
      // generate access token
      const accessToken = await JWT.signToken(
        {
          id: response.data._id,
          accessCode: response.data.accessCode,
          role: response.data.role,
          walletAddress: response.data.walletAddress,
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
    const { userId } = logoutDto;
    const res = await redisClient.del(userId);
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.refreshToken = async (refreshTokenDto, result = {}) => {
  try {
    const { userId } = refreshTokenDto;

    const response = await usersService.findUserById(userId);

    if (response.ex) throw response.ex;

    if (!response.data) {
      result.userNotFound = true;
    } else {
      // generate access token
      const accessToken = await JWT.signToken(
        {
          id: response.data._id,
          accessCode: response.data.accessCode,
          role: response.data.role,
          walletAddress: response.data.walletAddress,
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

exports.forgetPassword = async (forgetPasswordDto, result = {}) => {
  try {
    const { email, rememberMe = false } = forgetPasswordDto;
    console.log(forgetPasswordDto, "forgetPasswordDto");

    const otp = otpGenerator.generate(6, {
      digits: true,
      alphabets: false,
      upperCaseAlphabets: false,
      upperCase: false,
      lowerCaseAlphabets: false,
      lowerCase: false,
      specialChars: false,
    });
    const user = await User.findOne({ email, role: "user" });
    if (!user) {
      result.userNotFound = true;
      return;
    }

    const response = await usersService.findUserByEmail(email);
    const expiryTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    user.otp = otp;
    user.otpExpiresTime = expiryTime;
    user.isEmailVerified = false;
    const data = await user.save();

    // generate tokens
    const [accessToken, refreshToken] = await Promise.all([
      JWT.signToken(
        {
          id: data._id,
          email: data?.email,
          role: data.role,
        },
        JWT_TOKEN_TYPES.ACCESS_TOKEN
      ),
      JWT.signToken(
        {
          id: data._id,
          email: data?.email,
          role: data.role,
        },
        JWT_TOKEN_TYPES.REFRESH_TOKEN
      ),
    ]);

    // save refresh token
    const ttl = rememberMe
      ? configs.jwt.refreshToken.redisRemeberMeTTL
      : configs.jwt.refreshToken.redisTTL;

    await redisClient.set(data._id.toString(), refreshToken, {
      EX: ttl,
    });

    result.data = {
      email: data.email,
      otpExpiresTime: data.otpExpiresTime,
      accessToken,
      refreshToken,
      forget: true,
    };
    if (response.ex) throw response.ex;

    if (!response.data) {
      result.userExist = false;
    } else {
      result.userExist = true;
      const user = response.data;
      await user.save();
    }

    // Trigger email event
    eventEmitter.emit(EMAIL_VERIFICATION_EVENTS.FORGOT_PASSWORD, {
      receiverEmail: email,
      name: user?.userName,
      codeVerify: otp,
    });
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
exports.verifyEmail = async (verifyEmailDto, result = {}) => {
  try {
    const existingUser = await usersService.findUserByWalletAddressForUser({
      walletAddress: verifyEmailDto.walletAddress,
      email: verifyEmailDto.email,
    });
    // if (existingUser.data) {
    //   const userWithEmailPassword = await usersService.findByEmailAndPassword({
    //     email: verifyEmailDto.email,
    //   });

    if (existingUser.data) {
      result.conflictMessage = `wallet, email already exists`;
      result.hasConflict = true;
    } else {
      const updatedUser = await usersService.findByWalletAddressForUpdate(
        verifyEmailDto
      );
      result.data = updatedUser.data;
    }
    // }
    // else {
    //   const response = await usersService.createCreator(verifyEmailDto);
    //   result.data = response.data;
    //   if (response.ex) {
    //     throw response.ex;
    //   } else {
    //     result.data = response.data;
    //   }
    // }
  } catch (ex) {
    if (
      ex.name === CONSTANTS.DATABASE_ERROR_NAMES.MONGO_SERVER_ERROR &&
      ex.code === CONSTANTS.DATABASE_ERROR_CODES.UNIQUE_VIOLATION
    ) {
      const uniqueViolaterMessage = ex.message.split("{ ")[1];
      const uniqueViolaterField = uniqueViolaterMessage.split(":")[0];
      result.conflictMessage = `${uniqueViolaterField} already exists`;
      result.conflictField = uniqueViolaterField;
      result.hasConflict = true;
    } else {
      result.ex = ex;
    }
  } finally {
    return result;
  }
};
exports.verify_Email = async (verifyEmailDto, result = {}) => {
  try {
    const { email, walletAddress } = verifyEmailDto;
    const response = await usersService.findUserByWalletAddress(email);

    if (response.ex) throw response.ex;

    if (!response.data) {
      result.userExist = false;
    } else {
      result.userExist = true;
      const user = response.data;
      user.passwordResetToken = await JWT.signPasswordResetToken();
      await user.save();

      const passwordResetLink = `${configs.frontEndUrl}/reset-password?token=${user.passwordResetToken}`;

      eventEmitter.emit(USERS_EVENTS.FORGOT_PASSWORD, {
        receiverEmail: user.email,
        name: user.name,
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
    const response = await usersService.resetPassword(resetPasswordDto);

    if (response.ex) throw response.ex;

    if (response.userNotExist) {
      result = response;
    } else {
      result = response;

      eventEmitter.emit(USERS_EVENTS.PASSWORD_UPDATE, {
        receiverEmail: response.data.email,
        name: response.data.name,
      });
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
exports.signupWithGoogle = async (code, result = {}) => {
  try {
    const { payload } = await googleAuthenticate(code);
    const { email, name, picture } = payload;
    console.log(payload, "payload670");

    let userResult = await usersService.findUserByEmail(email);

    // normalize: remove the { data: null } problem
    let user = userResult?.data || userResult || null;
    if (user && user.data === null) {
      user = null;
    }
    console.log(user, "user");

    // create if not exists
    if (!user) {
      const createdUser = await usersService.createUser({
        email,
        name,
        profilePicture: picture,
        provider: "google",
      });
      user = createdUser?.data || createdUser || null;
    }

    if (!user) {
      throw new Error("User creation failed, got null user");
    }

    // normalize mongoose doc
    const plainUser = user.toObject?.() || user._doc || user;
    const userId = plainUser.id || plainUser._id?.toString();
    if (!userId) {
      throw new Error(
        `User object is invalid. Got: ${JSON.stringify(plainUser)}`
      );
    }

    const accessToken = await JWT.signToken(
      { id: userId, email: plainUser.email },
      JWT_TOKEN_TYPES.ACCESS_TOKEN,
      true
    );

    result.data = { ...plainUser, accessToken };
  } catch (ex) {
    result.ex = ex;
    result.data = null;
  } finally {
    return result;
  }
};
