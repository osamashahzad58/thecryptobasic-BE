const sgMail = require("@sendgrid/mail");
const configs = require("../../../configs");
sgMail.setApiKey(configs.sendgrid.apiKey);
const client = require("@sendgrid/client");
const moment = require("moment");
const axios = require("axios");
const qs = require("qs");

exports.loginCredentialsMail = async (
  loginCredentialsEmailPayload,
  result = {}
) => {
  try {
    const { receiverName, receiverEmail, password, leader } =
      loginCredentialsEmailPayload;

    const msg = {
      to: receiverEmail,
      from: {
        email: configs.sendgrid.sender,
        name: configs.sendgrid.senderName,
      },
      templateId: configs.sendgrid.loginCredentials,
      dynamicTemplateData: {
        name: receiverName,
        email: receiverEmail,
        password,
      },
    };

    const res = await sgMail.send(msg);
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.sendPasswordResetEmail = async function (
  resetPasswordEmailPayload,
  result = {}
) {
  try {
    const { receiverEmail, name, codeVerify } = resetPasswordEmailPayload;

    // Validate input
    if (
      !receiverEmail ||
      typeof receiverEmail !== "string" ||
      !receiverEmail.includes("@")
    ) {
      throw new Error("Invalid recipient email address.");
    }

    if (!codeVerify) {
      throw new Error("OTP Code is required.");
    }

    const emailPayload = {
      to: String(receiverEmail).trim(),
      subject: "Your OTP Code",
      apiKey: configs.elasticEmail.apiKey,
      from: "hashim@thecryptobasic.com",
      fromName: "TheCryptoBasic",
      template: configs.elasticEmail.passwordResetTemplate,
      merge_otpCode: codeVerify,
      merge_userName: name,
      isTransactional: true,
    };
    console.log(
      emailPayload,
      configs.elasticEmail.apiKey,
      configs.elasticEmail.sendOtp,
      "emailPayload"
    );

    const response = await axios.post(
      "https://api.elasticemail.com/v2/email/send",
      qs.stringify(emailPayload),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    result.response = response.data;
  } catch (ex) {
    console.error("Elastic Email Error:", ex.response?.data || ex.message);
    result.ex = ex;
  } finally {
    return result;
  }
};
exports.sendEmail = async function (sendEmailPayload, result = {}) {
  try {
    const { receiverEmail, codeVerify } = sendEmailPayload;
    // Validate input
    if (
      !receiverEmail ||
      typeof receiverEmail !== "string" ||
      !receiverEmail.includes("@")
    ) {
      throw new Error("Invalid recipient email address.");
    }

    if (!codeVerify) {
      throw new Error("OTP Code is required.");
    }

    const emailPayload = {
      to: String(receiverEmail).trim(),
      subject: "Your OTP Code",
      apiKey: configs.elasticEmail.apiKey,
      from: "hashim@thecryptobasic.com",
      fromName: "TheCryptoBasic",
      template: configs.elasticEmail.sendOtp,
      merge_otpCode: codeVerify,
      isTransactional: true,
    };

    const response = await axios.post(
      "https://api.elasticemail.com/v2/email/send",
      qs.stringify(emailPayload),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    result.response = response.data;
    // Check response success
    if (!response.data.success) {
      throw new Error(
        `Elastic Email API Error: ${response.data.error || "Unknown error"}`
      );
    }
  } catch (ex) {
    console.error("Elastic Email Error:", ex.response?.data || ex.message);
    result.ex = ex;
  } finally {
    return result;
  }
};
exports.sendEmailDataRequest = async function (
  confirmEmailPayload,
  result = {}
) {
  try {
    const { emails } = confirmEmailPayload;

    if (!emails || emails.length === 0) {
      return result;
    }
    let emailMessages = [];

    for (let i = 0; i < emails.length; i++) {
      let { email, walletAddress, question, type, reward, date, url } =
        emails[i];

      // Format wallet address (show first 4 and last 4 characters)
      const formattedWalletAddress = `${walletAddress.slice(
        0,
        4
      )}...${walletAddress.slice(-4)}`;
      const formattedDate = moment(date).format("DD/MM/YYYY");

      emailMessages.push({
        to: email,
        from: {
          email: configs.sendgrid.sender,
          name: configs.sendgrid.senderName,
        },
        templateId: configs.sendgrid.dataRequestTemplateId,
        dynamicTemplateData: {
          walletAddress: formattedWalletAddress,
          question,
          type,
          reward,
          url,
          date: formattedDate,
        },
      });
    }

    const res = await sgMail.send(emailMessages);
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
exports.sendEmailDispute = async function (confirmEmailPayload, result = {}) {
  try {
    const { emails } = confirmEmailPayload;
    if (!emails || emails.length === 0) {
      return result;
    }
    let emailMessages = [];

    for (let i = 0; i < emails.length; i++) {
      let { email, walletAddress, question, type, reward, date, parties, url } =
        emails[i];

      // Format wallet address (show first 4 and last 4 characters)
      const formattedWalletAddress = `${walletAddress.slice(
        0,
        4
      )}...${walletAddress.slice(-4)}`;
      // const formattedDate = moment(date).format("DD/MM/YYYY");

      emailMessages.push({
        to: email,
        from: {
          email: configs.sendgrid.sender,
          name: configs.sendgrid.senderName,
        },
        templateId: configs.sendgrid.disputeTemplateId,
        dynamicTemplateData: {
          walletAddress: formattedWalletAddress,
          question,
          type,
          reward,
          parties,
          date: date,
          url,
        },
      });
    }

    const res = await sgMail.send(emailMessages);
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
exports.sendEmailDisputeWin = async function (
  confirmEmailPayload,
  result = {}
) {
  try {
    const { emails } = confirmEmailPayload;
    if (!emails || emails.length === 0) {
      return result;
    }
    let emailMessages = [];

    for (let i = 0; i < emails.length; i++) {
      let {
        email,
        walletAddress,
        question,
        winningAnswer,
        yourAnswer,
        reward,
        date,
        url,
      } = emails[i];

      // Format wallet address (show first 4 and last 4 characters)
      const formattedWalletAddress = `${walletAddress.slice(
        0,
        4
      )}...${walletAddress.slice(-4)}`;
      // const formattedDate = moment(date).format("DD/MM/YYYY");

      emailMessages.push({
        to: email,
        from: {
          email: configs.sendgrid.sender,
          name: configs.sendgrid.senderName,
        },
        templateId: configs.sendgrid.disputeWinTemplateId,
        dynamicTemplateData: {
          walletAddress: formattedWalletAddress,
          question,
          winningAnswer,
          yourAnswer,
          reward,
          date,
          url,
        },
      });
    }

    const res = await sgMail.send(emailMessages);
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
exports.sendEmailDisputeLos = async function (
  confirmEmailPayload,
  result = {}
) {
  try {
    const { emails } = confirmEmailPayload;
    if (!emails || emails.length === 0) {
      return result;
    }
    let emailMessages = [];

    for (let i = 0; i < emails.length; i++) {
      let {
        email,
        walletAddress,
        question,
        winningAnswer,
        yourAnswer,
        reward,
        date,
        url,
      } = emails[i];

      // Format wallet address (show first 4 and last 4 characters)
      const formattedWalletAddress = `${walletAddress.slice(
        0,
        4
      )}...${walletAddress.slice(-4)}`;
      // const formattedDate = moment(date).format("DD/MM/YYYY");

      emailMessages.push({
        to: email,
        from: {
          email: configs.sendgrid.sender,
          name: configs.sendgrid.senderName,
        },
        templateId: configs.sendgrid.disputeLossTemplateId,
        dynamicTemplateData: {
          walletAddress: formattedWalletAddress,
          question,
          winningAnswer,
          yourAnswer,
          reward,
          date,
          url,
        },
      });
    }

    const res = await sgMail.send(emailMessages);
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.sendEmailToAskerWinnerDispute = async function (
  confirmEmailPayload,
  result = {}
) {
  try {
    const { emails } = confirmEmailPayload;

    if (!emails || emails.length === 0) {
      return result;
    }

    let emailMessages = [];

    for (const entry of emails) {
      const { email, walletAddress, question, time, url } = entry;

      if (!email || !walletAddress) continue;

      const formattedWalletAddress = `${walletAddress.slice(
        0,
        4
      )}...${walletAddress.slice(-4)}`;
      const formattedTime = new Date(time).toISOString(); // or use a different format if you prefer

      emailMessages.push({
        to: email,
        from: {
          email: configs.sendgrid.sender,
          name: configs.sendgrid.senderName,
        },
        templateId: configs.sendgrid.disputeAskerWinTemplateId,
        dynamicTemplateData: {
          walletAddress: formattedWalletAddress,
          question,
          time: formattedTime,
          url,
        },
      });
    }

    const res = await sgMail.send(emailMessages);
    // console.log("SendGrid response:", res);
  } catch (ex) {
    console.error("Error sending email:", ex);
    result.ex = ex;
  } finally {
    return result;
  }
};
exports.sendEmailToJury = async function (confirmEmailPayload, result = {}) {
  try {
    const { emails } = confirmEmailPayload;
    if (!emails || emails.length === 0) {
      return result;
    }

    let emailMessages = [];

    for (const entry of emails) {
      const email = entry.email;
      const walletAddress =
        entry.walletAddress || "0x0000000000000000000000000000000000000000";
      const question = entry.question || "No question provided";
      const time = entry.time || new Date().toISOString();
      const url = entry.url || "https://apporacles.dop.org";

      if (!email) continue;

      const formattedWalletAddress = `${walletAddress.slice(
        0,
        4
      )}...${walletAddress.slice(-4)}`;
      const formattedTime = new Date(time).toISOString();

      emailMessages.push({
        to: email,
        from: {
          email: configs.sendgrid.sender,
          name: configs.sendgrid.senderName,
        },
        templateId: configs.sendgrid.jurySelectedTemplateId,
        dynamicTemplateData: {
          walletAddress: formattedWalletAddress,
          question,
          time: formattedTime,
          url,
        },
      });
    }

    const res = await sgMail.send(emailMessages);
  } catch (ex) {
    console.error("Error sending email:", ex);
    result.ex = ex;
  } finally {
    return result;
  }
};
exports.sendEmailToAskerLoserDispute = async function (
  confirmEmailPayload,
  result = {}
) {
  try {
    const { emails } = confirmEmailPayload;

    if (!emails || emails.length === 0) {
      return result;
    }

    let emailMessages = [];

    for (const entry of emails) {
      const { email, walletAddress, question, time, url } = entry;

      if (!email || !walletAddress) continue;

      const formattedWalletAddress = `${walletAddress.slice(
        0,
        4
      )}...${walletAddress.slice(-4)}`;
      const formattedTime = new Date(time).toISOString(); // or use a different format if you prefer

      emailMessages.push({
        to: email,
        from: {
          email: configs.sendgrid.sender,
          name: configs.sendgrid.senderName,
        },
        templateId: configs.sendgrid.disputeAskerLossTemplateId,
        dynamicTemplateData: {
          walletAddress: formattedWalletAddress,
          question,
          time: formattedTime,
          url,
        },
      });
    }

    const res = await sgMail.send(emailMessages);
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

// exports.sendEmailToAskerLoserDispute = async function (
//   confirmEmailPayload,
//   result = {}
// ) {
//   try {
//     const { emails } = confirmEmailPayload;
//     console.log(emails, "sendEmailToAskerWinnerDispute::::::::::::::::::::::");

//     if (!emails || emails.length === 0) {
//       return result;
//     }
//     let emailMessages = [];

//     for (let i = 0; i < emails.length; i++) {
//       let { email, walletAddress, question, time, url } = emails[i];

//       // Format wallet address (show first 4 and last 4 characters)
//       const formattedWalletAddress = `${walletAddress.slice(
//         0,
//         4
//       )}...${walletAddress.slice(-4)}`;
//       // const formattedDate = moment(date).format("DD/MM/YYYY");

//       emailMessages.push({
//         to: email,
//         from: {
//           email: configs.sendgrid.sender,
//           name: configs.sendgrid.senderName,
//         },
//         templateId: configs.sendgrid.disputeAskerLossTemplateId,
//         dynamicTemplateData: {
//           walletAddress: formattedWalletAddress,
//           question,
//           time,
//           url,
//         },
//       });
//     }

//     const res = await sgMail.send(emailMessages);
//     console.log("SendGrid response:", res);
//   } catch (ex) {
//     result.ex = ex;
//   } finally {
//     return result;
//   }
// };
exports.sendEmailSurvey = async function (confirmEmailPayload, result = {}) {
  try {
    const { emails } = confirmEmailPayload;

    if (!emails || emails.length === 0) {
      return result;
    }
    let emailMessages = [];

    for (let i = 0; i < emails.length; i++) {
      let {
        email,
        walletAddress,
        question,
        type,
        reward,
        date,
        questionLength,
        url,
      } = emails[i];
      const formattedWalletAddress = `${walletAddress.slice(
        0,
        4
      )}...${walletAddress.slice(-4)}`;
      const formattedDate = moment(date).format("DD/MM/YYYY");

      emailMessages.push({
        to: email,
        from: {
          email: configs.sendgrid.sender,
          name: configs.sendgrid.senderName,
        },
        templateId: configs.sendgrid.surveysTemplateId,
        dynamicTemplateData: {
          walletAddress: formattedWalletAddress, // Send formatted address
          question,
          type,
          reward,
          questionLength,
          date: formattedDate,
          url,
        },
      });
    }

    const res = await sgMail.send(emailMessages);
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.sendWelcomeEmail = async function (sendWelcomeEmailDto, result = {}) {
  try {
    const { receiverEmail } = sendWelcomeEmailDto;
    const msg = {
      to: receiverEmail,
      from: {
        email: configs.sendgrid.sender,
        name: configs.sendgrid.senderName,
      },
      templateId: configs.sendgrid.welcome,
    };
    const res = await sgMail.send(msg);
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
exports.sendCompleted = async function (sendWelcomeEmailDto, result = {}) {
  try {
    const { receiverEmail, walletAddress } = sendWelcomeEmailDto;

    // Format wallet address (show first 4 and last 4 characters)
    const formattedWalletAddress = `${walletAddress.slice(
      0,
      4
    )}...${walletAddress.slice(-4)}`;
    const msg = {
      to: receiverEmail,
      from: {
        email: configs.sendgrid.sender,
        name: configs.sendgrid.senderName,
      },
      templateId: configs.sendgrid.completed,
      dynamicTemplateData: {
        walletAddress: formattedWalletAddress,
      },
    };
    const res = await sgMail.send(msg);
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
