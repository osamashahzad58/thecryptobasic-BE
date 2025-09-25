let User = require("./users.model");
let Watchlist = require("../watchlist/watchlist.model");
const mongoose = require("mongoose");
const eventEmitter = require("../common/events/events.event-emitter");
const configs = require("../../configs");
const { ObjectId } = require("mongodb");
const emailUtils = require("../common/email/email.util");
const { KYC_STATUS } = require("./constants/users.constants");

const otpGenerator = require("otp-generator");
const EMAIL_VERIFICATION_EVENTS = require("./constants/users.constants");
exports.profile = async (profileDto, result = {}) => {
  try {
    const { id, picture, coverPicture, ...rest } = profileDto;
    const user = await User.findById(id);
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: id,
      },
      { $set: { ...profileDto } },
      {
        new: true,
      }
    );
    result.data = updatedUser;
    const existingImages = [];
    if (picture && user.picture != configs.defaultUserPicture) {
      existingImages.push(user.picture);
    }

    if (coverPicture && user.coverPicture != configs.defaultUserCoverPictre) {
      existingImages.push(user.coverPicture);
    }
    if (existingImages.length > 0) {
      eventEmitter.emit(USER_EVENTS.UPDATED, {
        keys: existingImages,
      });
    }
  } catch (ex) {
    if (
      ex.name === CONSTANTS.DATABASE_ERROR_NAMES.MONGO_SERVER_ERROR &&
      ex.code === CONSTANTS.DATABASE_ERROR_CODES.UNIQUE_VIOLATION
    ) {
      const uniqueViolaterMessage = ex.message.split("{ ")[1];
      const uniqueViolaterField = uniqueViolaterMessage.split(":")[0];
      result.conflictMessage = `${uniqueViolaterField} already exist`;
      result.conflictField = uniqueViolaterField;
      result.hasConflict = true;
    } else {
      result.ex = ex;
    }
  } finally {
    return result;
  }
};
// const mongoose = require("mongoose");
exports.createUser = async (createUserDto, result = {}) => {
  try {
    // Add default role
    const userPayload = {
      ...createUserDto,
      role: "user",
    };

    const savedUser = await User.create(userPayload);

    const email = userPayload.email;

    const otp = otpGenerator.generate(6, {
      digits: true,
      alphabets: false,
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    const expiryTime = new Date(Date.now() + 10 * 60 * 1000);
    savedUser.otp = otp;
    savedUser.otpExpiresTime = expiryTime;
    await savedUser.save();

    eventEmitter.emit(EMAIL_VERIFICATION_EVENTS.SEND_OTP, {
      receiverEmail: email,
      codeVerify: otp,
    });

    const {
      password,
      otp: _otp,
      otpExpiresTime,
      ...safeUserData
    } = savedUser.toObject();

    result.data = safeUserData;
  } catch (ex) {
    console.error("[createUser] Error occurred:", ex);
    result.ex = ex;
  } finally {
    console.log("[createUser] Process finished.");
    return result;
  }
};

exports.sendOtp = async (sendOtpDto, result = {}) => {
  try {
    const { email } = sendOtpDto;
    const user = await User.findOne({ email, role: "user" });
    if (!user) {
      result.userNotFound = true;
      return;
    }

    // if (user && !user.email) {
    //   user.email = email;
    //   await user.save();
    // }

    if (user?.isEmailVerified) {
      result.userAlreadyVerified = true;
      return;
    }

    const otp = otpGenerator.generate(6, {
      digits: true,
      alphabets: false,
      upperCaseAlphabets: false,
      upperCase: false,
      lowerCaseAlphabets: false,
      lowerCase: false,
      specialChars: false,
    });

    const currentDate = new Date();
    currentDate.setMinutes(currentDate.getMinutes() + 10);
    user.otp = otp;
    user.otpExpiresTime = currentDate;
    await user.save();

    // eventEmitter.emit(USERS_EVENTS.SEND_OTP, {
    //   receiverEmail: user?.email,
    //   otp: otp,
    // });
    eventEmitter.emit(EMAIL_VERIFICATION_EVENTS.SEND_OTP, {
      receiverEmail: email,
      codeVerify: otp,
    });
  } catch (ex) {
    if (ex.code === 11000) {
      // Mongoose duplicate key error
      const keyName = Object.keys(ex.keyPattern)[0];
      result.conflictMessage = `${keyName} already exists`;
      result.conflictField = keyName;
      result.hasConflict = true;
    } else {
      result.ex = ex;
    }
  } finally {
    return result;
  }
};

exports.verifyOtp = async (verifyOtpDto, result = {}) => {
  try {
    const { id, walletAddress, otp } = verifyOtpDto;
    const user = await User.findOne({ id, walletAddress, role: "user" });
    if (!user) {
      result.userNotFound = true;
      return;
    }

    if (user?.otp !== otp) {
      result.optCodeIncorrect = true;
      return;
    }

    if (user?.otpExpiresTime < new Date()) {
      result.otpExpired = true;
      return;
    }
    await User.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id), walletAddress },
      {
        $set: { isEmailVerified: true },
        $unset: { otp: "", otpExpiresTime: "" },
      },
      { new: true }
    );
    await user.save();
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.userById = async (getUsersDto, result = {}) => {
  try {
    const { userId } = getUsersDto;
    const user = await User.findOne({ _id: userId });
    if (!user) result.UserNotFound = true;
    else {
      result.data = user;
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
exports.getUserWatchlist = async (getUsersDto, result = {}) => {
  try {
    const { userId } = getUsersDto;

    const userProfile = await Watchlist.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    })
      .populate("userId")
      .lean();

    if (userProfile) {
      result.data = userProfile;
    } else {
      result.error = true;
      result.message = "User watchlist not found.";
    }
  } catch (ex) {
    console.error("Error while fetching the question:", ex.message);
    result.error = true;
    result.ex = ex.message;
  } finally {
    return result;
  }
};

exports.getUserById = async ({ creatorId }, result = {}) => {
  try {
    const user = await User.findById(creatorId);
    if (!user) {
      result.userNotFound = true;
    } else {
      result.data = user;
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.getProfile = async ({ id }, result = {}) => {
  try {
    result.data = await User.findById(id).select(
      "name walletAddress email bio picture coverPicture verified"
    );
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
exports.findUserByEmailOrUsername = async ({ email }, result = {}) => {
  try {
    result.data = await User.findOne({ email });
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.findUserByWalletAddress = async ({ walletAddress }) => {
  const result = {};
  try {
    const user = await User.findOne({ walletAddress, role: "user" });

    if (!user) {
      result.notFound = true;
    } else {
      result.data = user;
    }
  } catch (ex) {
    result.ex = ex;
  }
  return result;
};

exports.findUserByWalletAddressForUser = async (
  { walletAddress, email },
  result = {}
) => {
  try {
    result.data = await User.findOne({ walletAddress, email, role: "user" });
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
exports.findUserByWalletAddressForCreator = async (
  { walletAddress },
  result = {}
) => {
  try {
    result.data = await User.findOne({ walletAddress, role: "creator" });
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.findByWalletAddress = async ({ walletAddress }, result = {}) => {
  try {
    result.data = await User.findOne({ walletAddress });
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
exports.findByEmailAndPassword = async ({ email, password }, result = {}) => {
  try {
    result.data = await User.findOne({ email, password });
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
exports.findByWalletAddressForUpdate = async (
  { walletAddress, email },
  result = {}
) => {
  try {
    const updatedCreator = await User.findOneAndUpdate(
      { walletAddress },
      { $set: { email } },
      { new: true }
    );

    if (updatedCreator) {
      result.message = "Email updated successfully.";
    } else {
      result.message = "User not found with the provided wallet address.";
    }
  } catch (ex) {
    result.error = ex.message;
  } finally {
    return result;
  }
};
