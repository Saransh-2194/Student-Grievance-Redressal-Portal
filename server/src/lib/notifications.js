import nodemailer from 'nodemailer';
import prisma from './db.js';
import { getIo } from './socket.js';

// Internal system notification helper
export const createNotification = async (userId, type, message, link) => {
  try {
    const notification = await prisma.notification.create({
      data: { userId, type, message, link }
    });
    
    // Emit real-time socket event to the user
    getIo().emit(`notification-${userId}`, notification);
    
    return notification;
  } catch (err) {
    console.error('[Notification-DB] Error:', err);
  }
};
// For production, use SendGrid, SES, or Gmail
// For development, we'll use a mock account if no env vars are provided
const createTransporter = async () => {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT == 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Fallback: Use Ethereal for testing
  let testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

export const sendNotification = async (to, subject, text, html) => {
  try {
    const transporter = await createTransporter();
    const info = await transporter.sendMail({
      from: '"Grievance Portal" <noreply@grievance.edu>',
      to,
      subject,
      text,
      html,
    });

    console.log(`[Notification] Message sent: ${info.messageId}`);
    if (info.envelope?.to?.[0].includes('ethereal.email')) {
      console.log(`[Notification] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
    return info;
  } catch (err) {
    console.error('[Notification] Error:', err);
  }
};

export const notifyStatusChange = async (userId, email, ticketTitle, oldStatus, newStatus) => {
  const subject = `Ticket Update: ${ticketTitle}`;
  const message = `Ticket "${ticketTitle}" status changed to ${newStatus}.`;
  
  await createNotification(userId, 'INFO', message, `/tickets`);
  
  const text = `Your ticket "${ticketTitle}" status has changed from ${oldStatus} to ${newStatus}.`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
      <h2 style="color: #3b82f6;">Ticket Status Update</h2>
      <p>Hello,</p>
      <p>The status of your ticket <strong>"${ticketTitle}"</strong> has been updated.</p>
      <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <span style="color: #6b7280;">${oldStatus}</span> 
        <span style="margin: 0 10px;">→</span> 
        <span style="color: #3b82f6; font-weight: bold;">${newStatus}</span>
      </div>
      <p>Log in to the portal to view details and communicate with the admin.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <small style="color: #9ca3af;">This is an automated message from the Student Grievance Redressal Portal.</small>
    </div>
  `;
  return sendNotification(email, subject, text, html);
};

export const notifyAssignment = async (userId, email, ticketTitle, adminName) => {
  const subject = `New Ticket Assigned: ${ticketTitle}`;
  const message = `Admin ${adminName} has been assigned to your ticket.`;
  
  await createNotification(userId, 'SUCCESS', message, `/tickets`);
  
  const text = `Admin ${adminName} has been assigned to your ticket "${ticketTitle}".`;
  return sendNotification(email, subject, text, ""); 
};

export const notifySlaBreach = async (userId, email, ticketId, severity) => {
  const subject = `CRITICAL: SLA Breach - Ticket #${ticketId}`;
  const message = `CRITICAL: SLA Breach detected for ticket #${ticketId.substring(0,8)}. Immediate action required.`;
  
  await createNotification(userId, 'DANGER', message, `/oversight`);
  
  const text = `A ${severity} priority ticket (#${ticketId}) has breached its SLA deadline and requires immediate escalation.`;
  return sendNotification(email, subject, text, "");
};
