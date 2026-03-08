import { siteConfig } from "@/config/site";

interface CreditUpgradeFailedEmailProps {
  userId: string;
  orderId: string;
  planId: string;
  errorMessage: string;
  errorStack?: string;
  webhookUrl?: string;
}

const CreditUpgradeFailedEmail = ({
  userId,
  orderId,
  planId,
  errorMessage,
  errorStack,
  webhookUrl = "https://dashboard.stripe.com/webhooks",
}: CreditUpgradeFailedEmailProps) => (
  <div style={main}>
    <div style={card}>
      <div style={logo}>
        <img
          src={`${process.env.NEXT_PUBLIC_SITE_URL}/logo.png`}
          alt={`${siteConfig.name} logo`}
          width={80}
          height={80}
        />
      </div>

      <h1 style={heading}>🚨 Critical Error: Credit Upgrade Failed</h1>
      <p style={paragraph}>
        The system failed to automatically grant or upgrade credits for a user
        after a successful payment, even after multiple retries. Manual
        intervention is required.
      </p>
      <hr style={hr} />
      <h3 style={subHeading}>Failure Details:</h3>
      <p style={paragraph}>
        <strong>User ID:</strong> <code style={code}>{userId}</code>
      </p>
      <p style={paragraph}>
        <strong>Order ID:</strong> <code style={code}>{orderId}</code>
      </p>
      <p style={paragraph}>
        <strong>Plan ID:</strong> <code style={code}>{planId}</code>
      </p>
      <hr style={hr} />
      <h3 style={subHeading}>Error Information:</h3>
      <p style={paragraph}>
        <strong>Error Message:</strong>
      </p>
      <div style={errorBox}>{errorMessage}</div>
      {errorStack && (
        <>
          <p style={paragraph}>
            <strong>Stack Trace:</strong>
          </p>
          <pre style={codeBlock}>{errorStack}</pre>
        </>
      )}
      <hr style={hr} />
      <h3 style={subHeading}>Next Steps:</h3>
      <p style={list}>
        1. <strong>Verify Order:</strong> Go to the{" "}
        <a href={`${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/orders`}>
          Dashboard
        </a>{" "}
        to confirm the order record exists.
      </p>
      <p style={list}>
        2. <strong>Check User Credits:</strong> Inspect the <code>usage</code>{" "}
        and <code>credit_logs</code> tables to confirm that no credit records
        were created for this order.
      </p>
      <p style={list}>
        3. <strong>Manually Grant Credits:</strong> If the payment was
        successful, manually insert the corresponding records into the{" "}
        <code>usage</code> and <code>credit_logs</code> tables.
      </p>
      {siteConfig.socialLinks?.discord && (
        <p style={list}>
          4. <strong>Seek Support:</strong> If you are unable to resolve the
          issue, please contact the {siteConfig.name} team on{" "}
          <a href={siteConfig.socialLinks?.discord}>Discord</a> for assistance.
        </p>
      )}
    </div>

    <div style={footer}>
      <p style={footerText}>
        © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
      </p>
    </div>
  </div>
);

export { CreditUpgradeFailedEmail };

const main = {
  fontFamily:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  maxWidth: "600px",
  margin: "0 auto",
  backgroundColor: "#f8fafc",
  padding: "40px 20px",
};

const card = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  padding: "40px",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
};

const heading = {
  color: "#dc2626", // Red-600
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "0 0 24px 0",
};

const subHeading = {
  fontSize: "20px",
  fontWeight: "600",
  color: "#1f2937",
  margin: "24px 0 16px 0",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#4b5563",
  margin: "0 0 16px 0",
};

const list = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#4b5563",
  margin: "0 0 16px 0",
  paddingLeft: "10px",
};

const hr = {
  border: "none",
  borderTop: "1px solid #e5e7eb",
  margin: "24px 0",
};

const code = {
  fontFamily: "monospace",
  backgroundColor: "#f4f4f4",
  padding: "2px 6px",
  borderRadius: "4px",
  color: "#333",
};

const errorBox = {
  backgroundColor: "#fee2e2", // Red-100
  border: "1px solid #fecaca", // Red-200
  color: "#b91c1c", // Red-700
  padding: "12px",
  borderRadius: "6px",
  whiteSpace: "pre-wrap" as const,
  wordBreak: "break-all" as const,
  margin: "16px 0",
};

const codeBlock = {
  backgroundColor: "#fee2e2", // Red-100
  border: "1px solid #fecaca", // Red-200
  color: "#b91c1c", // Red-700
  padding: "12px",
  borderRadius: "6px",
  whiteSpace: "pre-wrap" as const,
  wordBreak: "break-all" as const,
  fontFamily: "monospace",
  fontSize: "12px",
  overflowX: "auto" as const,
  margin: "16px 0",
};

const footer = {
  marginTop: "32px",
  paddingTop: "24px",
  borderTop: "1px solid #e5e7eb",
  textAlign: "center" as const,
};

const footerText = {
  fontSize: "12px",
  color: "#9ca3af",
  margin: "0",
};

const logo = {
  width: "80px",
  height: "80px",
  backgroundColor: "#000000",
  borderRadius: "50%",
  margin: "0 auto 24px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "36px",
  fontWeight: "bold",
  color: "#ffffff",
};
