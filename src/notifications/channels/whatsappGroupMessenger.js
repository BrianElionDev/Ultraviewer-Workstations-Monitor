import axios from "axios";

export class WhatsAppGroupMessenger {
  constructor(apiUrl, apiKey, channel) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
    this.channel = channel;
  }

  async sendGroupMessage(message) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/messages/text`,
        {
          to: this.channel,
          body: message,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      console.log("WhatsApp group message sent:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "Error sending WhatsApp group message:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  isConfigured() {
    return !!(this.apiUrl && this.apiKey && this.channel);
  }
}
