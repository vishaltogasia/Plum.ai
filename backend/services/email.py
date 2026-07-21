import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional
from backend.utils.config import settings

logger = logging.getLogger("plum.ai.email")

class EmailService:
    """Email notification service for Plum.ai."""
    
    def __init__(self):
        self.smtp_server = settings.SMTP_SERVER
        self.smtp_port = settings.SMTP_PORT
        self.sender_email = settings.SMTP_USER
        self.sender_password = settings.SMTP_PASSWORD
        self.is_configured = bool(self.sender_email and self.sender_password)
    
    def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        plain_text: Optional[str] = None
    ) -> bool:
        """Send an email via SMTP."""
        if not self.is_configured:
            logger.warning("Email service not configured. Skipping email send.")
            return False
        
        try:
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = self.sender_email
            message["To"] = to_email
            
            # Add plain text version (fallback)
            if plain_text:
                message.attach(MIMEText(plain_text, "plain"))
            
            # Add HTML version
            message.attach(MIMEText(html_content, "html"))
            
            # Send via SMTP
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.sender_email, self.sender_password)
                server.sendmail(self.sender_email, to_email, message.as_string())
            
            logger.info(f"Email sent to {to_email}")
            return True
        
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False
    
    def send_ticket_notification(
        self,
        customer_email: str,
        customer_name: str,
        ticket_id: int,
        issue_description: str,
        business_name: str
    ) -> bool:
        """Send notification that a support ticket was created."""
        subject = f"Support Ticket #{ticket_id} Created - {business_name}"
        
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px;">
                    <h2 style="color: #31103f;">Support Ticket Created</h2>
                    <p>Hi {customer_name},</p>
                    
                    <p>Thank you for contacting {business_name}. Your support request has been received and assigned ticket number <strong>#{ticket_id}</strong>.</p>
                    
                    <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #8b5cf6; margin: 20px 0;">
                        <p><strong>Your Issue:</strong></p>
                        <p>{issue_description}</p>
                    </div>
                    
                    <p>Our support team will review your request and get back to you shortly.</p>
                    
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                    
                    <p style="color: #666; font-size: 12px;">
                        This is an automated message from Plum.ai. Please do not reply to this email.
                    </p>
                </div>
            </body>
        </html>
        """
        
        plain_text = f"""
        Support Ticket Created
        
        Hi {customer_name},
        
        Your support ticket #{ticket_id} has been created for {business_name}.
        
        Issue: {issue_description}
        
        Our support team will review your request shortly.
        """
        
        return self.send_email(customer_email, subject, html_content, plain_text)
    
    def send_registration_confirmation(
        self,
        user_email: str,
        user_name: str,
        confirmation_link: Optional[str] = None
    ) -> bool:
        """Send registration confirmation email."""
        subject = "Welcome to Plum.ai - Your AI Support Agent Platform"
        
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px;">
                    <h2 style="color: #31103f;">Welcome to Plum.ai!</h2>
                    <p>Hi {user_name},</p>
                    
                    <p>Thank you for registering with Plum.ai. You're now ready to create your first AI-powered customer support agent.</p>
                    
                    <h3 style="color: #8b5cf6;">Get Started:</h3>
                    <ul>
                        <li>Create a new workspace/business</li>
                        <li>Upload your knowledge base (PDFs, documents, URLs)</li>
                        <li>Deploy your chat widget to your website</li>
                        <li>Monitor conversations in real-time</li>
                    </ul>
                    
                    <p><a href="{settings.FRONTEND_URL}/dashboard" style="background-color: #8b5cf6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Go to Dashboard</a></p>
                    
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                    
                    <p style="color: #666; font-size: 12px;">
                        If you have any questions, feel free to reach out to our support team.
                    </p>
                </div>
            </body>
        </html>
        """
        
        plain_text = f"""
        Welcome to Plum.ai!
        
        Hi {user_name},
        
        Thank you for registering. Visit {settings.FRONTEND_URL}/dashboard to get started.
        """
        
        return self.send_email(user_email, subject, html_content, plain_text)
    
    def send_password_reset(
        self,
        user_email: str,
        user_name: str,
        reset_link: str
    ) -> bool:
        """Send password reset email."""
        subject = "Reset Your Plum.ai Password"
        
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px;">
                    <h2 style="color: #31103f;">Password Reset Request</h2>
                    <p>Hi {user_name},</p>
                    
                    <p>We received a request to reset your password. Click the button below to set a new password:</p>
                    
                    <p style="text-align: center; margin: 20px 0;">
                        <a href="{reset_link}" style="background-color: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
                    </p>
                    
                    <p style="color: #666; font-size: 12px;">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
                    
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                    
                    <p style="color: #666; font-size: 12px;">
                        This is an automated message from Plum.ai.
                    </p>
                </div>
            </body>
        </html>
        """
        
        plain_text = f"""
        Password Reset Request
        
        Hi {user_name},
        
        Reset your password here: {reset_link}
        
        This link expires in 1 hour.
        """
        
        return self.send_email(user_email, subject, html_content, plain_text)
    
    def send_admin_alert(
        self,
        admin_email: str,
        admin_name: str,
        alert_subject: str,
        alert_details: str
    ) -> bool:
        """Send alert email to admin."""
        subject = f"[ALERT] {alert_subject}"
        
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; border-left: 4px solid #ef4444;">
                    <h2 style="color: #ef4444;">Alert: {alert_subject}</h2>
                    <p>Hi {admin_name},</p>
                    
                    <div style="background-color: #fee2e2; padding: 15px; border-radius: 4px;">
                        <p>{alert_details}</p>
                    </div>
                    
                    <p style="margin-top: 20px;">
                        <a href="{settings.FRONTEND_URL}/dashboard" style="background-color: #8b5cf6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">View Dashboard</a>
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                    
                    <p style="color: #666; font-size: 12px;">
                        This is an automated alert from Plum.ai.
                    </p>
                </div>
            </body>
        </html>
        """
        
        plain_text = f"""
        ALERT: {alert_subject}
        
        {alert_details}
        
        View your dashboard: {settings.FRONTEND_URL}/dashboard
        """
        
        return self.send_email(admin_email, subject, html_content, plain_text)

# Initialize global email service
email_service = EmailService()
