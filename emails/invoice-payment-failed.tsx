import { siteConfig } from "@/config/site";
import * as React from "react";

interface InvoicePaymentFailedEmailProps {
  invoiceId: string;
  subscriptionId: string;
  planName: string;
  amountDue: number;
  currency: string;
  nextPaymentAttemptDate?: string;
  updatePaymentMethodLink: string;
  supportLink: string;
}

const commonStyles = {
  container: {
    fontFamily: "'Inter', sans-serif",
    maxWidth: "600px",
    margin: "0 auto",
    padding: "20px",
    backgroundColor: "#ffffff",
  },
  section: {
    marginBottom: "30px",
    paddingBottom: "20px",
    borderBottom: "1px solid #e5e7eb",
  },
  title: {
    color: "#ef4444",
    marginBottom: "16px",
    fontSize: "20px",
    fontWeight: "bold",
  },
  paragraph: {
    marginBottom: "16px",
    lineHeight: 1.6,
    color: "#374151",
  },
  highlight: {
    fontWeight: "bold" as const,
  },
  ctaButton: {
    display: "inline-block",
    padding: "12px 24px",
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    textDecoration: "none",
    borderRadius: "6px",
    fontWeight: "bold",
    marginTop: "10px",
    marginBottom: "20px",
  },
  infoBox: {
    backgroundColor: "#f9fafb",
    padding: "15px",
    borderRadius: "6px",
    border: "1px solid #e5e7eb",
    marginBottom: "16px",
    fontSize: "14px",
  },
  supportText: {
    fontSize: "14px",
    color: "#6b7280",
  },
  link: {
    color: "#3b82f6",
    textDecoration: "underline",
  },
  footer: {
    marginTop: "30px",
    paddingTop: "20px",
    borderTop: "1px solid #e5e7eb",
    textAlign: "center" as const,
    fontSize: "12px",
    color: "#9ca3af",
  },
};

const EnglishVersion: React.FC<InvoicePaymentFailedEmailProps> = ({
  planName,
  amountDue,
  currency,
  nextPaymentAttemptDate,
  updatePaymentMethodLink,
  supportLink,
  invoiceId,
}) => (
  <div style={commonStyles.section}>
    <h2 style={commonStyles.title}>Action Required: Payment Failed</h2>
    <p style={commonStyles.paragraph}>
      We were unable to process the payment for your{" "}
      <span style={commonStyles.highlight}>{planName}</span> subscription.
    </p>
    <div style={commonStyles.infoBox}>
      <strong>Invoice ID:</strong> {invoiceId}
      <br />
      <strong>Amount Due:</strong>{" "}
      {new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency.toUpperCase(),
      }).format(amountDue)}
    </div>
    <p style={commonStyles.paragraph}>
      To avoid any disruption to your service, please update your payment method
      as soon as possible.
    </p>
    <a href={updatePaymentMethodLink} style={commonStyles.ctaButton}>
      Update Payment Method
    </a>
    {nextPaymentAttemptDate && (
      <p style={commonStyles.paragraph}>
        We will attempt to charge your payment method again on approximately{" "}
        {nextPaymentAttemptDate}. Updating your details before then will ensure
        your subscription remains active.
      </p>
    )}
    <p style={commonStyles.supportText}>
      If you have already updated your payment details or believe this is an
      error, please disregard this message. If you need assistance, please{" "}
      <a href={supportLink} style={commonStyles.link}>
        contact our support team
      </a>
      .
    </p>
  </div>
);

export const InvoicePaymentFailedEmail: React.FC<
  InvoicePaymentFailedEmailProps
> = (props) => {
  return (
    <div style={commonStyles.container}>
      <EnglishVersion {...props} />

      <div style={commonStyles.footer}>
        © {new Date().getFullYear()} {siteConfig.name} - All Rights Reserved
      </div>
    </div>
  );
};
