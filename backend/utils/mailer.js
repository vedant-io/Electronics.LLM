const nodemailer = require("nodemailer");

let transporter;

async function initMailer() {
  if (transporter) return transporter;

  // Use real Gmail if configured, otherwise fallback to Ethereal testing
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    return transporter;
  }

  console.log("No EMAIL_PASS found in .env, falling back to Ethereal Mock Mailer.");
  let account = await nodemailer.createTestAccount();

  transporter = nodemailer.createTransport({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    auth: {
      user: account.user,
      pass: account.pass,
    },
  });

  return transporter;
}

const sendAssignmentEmails = async (student, faculty, projectName) => {
  try {
    const tp = await initMailer();

    // To Teacher
    const mailToTeacher = await tp.sendMail({
      from: '"Electronics LLM Platform" <electronicsllm44@gmail.com>',
      to: faculty.email || "teacher@example.com",
      subject: `New Student Assigned: ${student.username}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #4F46E5;">New Assignment Notification</h2>
          <p>Hello <strong>${faculty.name}</strong>,</p>
          <p>You have been assigned as the faculty guide for the project: <strong>${projectName}</strong>.</p>
          <p>Student: <strong>${student.username}</strong></p>
          <p>Please check your faculty dashboard to review their progress.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #888;">This is an automated message from the Electronics LLM Platform.</p>
        </div>
      `,
    });

    // To Student
    const mailToStudent = await tp.sendMail({
      from: '"Electronics LLM Platform" <electronicsllm44@gmail.com>',
      to: student.email,
      subject: `Faculty Guide Assigned: ${faculty.name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #4F46E5;">Guide Assigned</h2>
          <p>Hello <strong>${student.username}</strong>,</p>
          <p><strong>${faculty.name}</strong> has been assigned as your faculty guide for your project: <strong>${projectName}</strong>.</p>
          <p>They will now be able to monitor your progress and provide feedback on your modules.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #888;">This is an automated message from the Electronics LLM Platform.</p>
        </div>
      `,
    });

    console.log("------------------------------------------");
    console.log("Emails sent successfully!");
    console.log(`Teacher Email Preview URL: ${nodemailer.getTestMessageUrl(mailToTeacher)}`);
    console.log(`Student Email Preview URL: ${nodemailer.getTestMessageUrl(mailToStudent)}`);
    console.log("------------------------------------------");
  } catch (error) {
    console.error("Error sending assignment emails:", error);
  }
};

module.exports = { sendAssignmentEmails };
