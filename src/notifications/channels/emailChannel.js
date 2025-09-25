import { logError } from "../../agent/utils.js";

export class EmailChannel {
  constructor(smtpConfig) {
    this.smtpConfig = smtpConfig;
    this.recipients = smtpConfig.recipients || [];
  }

  async send(alert) {
    if (!this.smtpConfig || this.recipients.length === 0) {
      throw new Error("Email configuration not provided");
    }

    const subject = `🚨 UltraViewer Alert: ${alert.type} on ${alert.hostname}`;
    const htmlBody = this.generateEmailBody(alert);

    // For now, we'll use a simple fetch to an email service
    // In production, you'd use nodemailer or similar
    if (process.env.EMAIL_SERVICE_URL) {
      try {
        const response = await fetch(process.env.EMAIL_SERVICE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: this.recipients,
            subject,
            html: htmlBody,
            from: this.smtpConfig.from,
          }),
        });

        if (!response.ok) {
          throw new Error(`Email service error: ${response.status}`);
        }
      } catch (error) {
        logError(`Email sending failed: ${error.message}`);
        throw error;
      }
    } else {
      // Fallback: log the email content
      console.log("\n📧 EMAIL ALERT:");
      console.log(`To: ${this.recipients.join(", ")}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body:\n${htmlBody.replace(/<[^>]*>/g, "")}`);
    }
  }

  generateEmailBody(alert) {
    const timestamp = new Date(alert.timestamp).toLocaleString();
    const severityColor = this.getSeverityColor(alert.severity);

    return `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: ${severityColor}; color: white; padding: 20px; text-align: center;">
            <h1>🚨 UltraViewer Alert</h1>
          </div>
          <div style="padding: 20px; background: #f5f5f5;">
            <h2>Alert Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Type:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${
                  alert.type
                }</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Severity:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${alert.severity.toUpperCase()}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Hostname:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${
                  alert.hostname
                }</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Time:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${timestamp}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Message:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${
                  alert.message
                }</td>
              </tr>
            </table>
            ${
              alert.data && Object.keys(alert.data).length > 1
                ? `
              <h3>Additional Data</h3>
              <pre style="background: #eee; padding: 10px; border-radius: 4px;">${JSON.stringify(
                alert.data,
                null,
                2
              )}</pre>
            `
                : ""
            }
          </div>
        </body>
      </html>
    `;
  }

  getSeverityColor(severity) {
    const colors = {
      low: "#28a745",
      medium: "#ffc107",
      high: "#fd7e14",
      critical: "#dc3545",
    };
    return colors[severity] || "#6c757d";
  }
}
