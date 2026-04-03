import SibApiV3Sdk from "sib-api-v3-sdk";

// Initialize Brevo client
const brevo = SibApiV3Sdk.ApiClient.instance;

// Set API key
const apiKey = brevo.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

// Create transactional email instance
export const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();