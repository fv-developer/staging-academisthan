import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Email configuration
export const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASSWORD || '',
  },
};

// Create transporter
export const createTransporter = () => {
  return nodemailer.createTransport(emailConfig);
};

// Email sender info
export const emailFrom = {
  name: 'Academisthan',
  address: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@academisthan.org',
};

// Frontend URL for links
export const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
