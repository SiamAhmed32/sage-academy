import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // Use SSL
  auth: {
    user: process.env.GMAIL,
    pass: process.env.APP_PASSWORD,
  },
});

export type SendEmailOptions = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  console.log("Attempting to send email to:", to);
  console.log("Using GMAIL:", process.env.GMAIL);
  
  if (!process.env.GMAIL || !process.env.APP_PASSWORD) {
    console.error("Email configuration missing!");
    throw new Error("Email configuration missing");
  }

  const mailOptions = {
    from: `"${process.env.APP_NAME || "SAGE Academy"}" <${process.env.GMAIL}>`,
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
    return info;
  } catch (error) {
    console.error("Nodemailer Error:", error);
    throw error;
  }
}
