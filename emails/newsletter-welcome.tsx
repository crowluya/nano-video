import { siteConfig } from "@/config/site";
import * as React from "react";

interface NewsletterWelcomeEmailProps {
  email: string;
  unsubscribeLink: string;
}

const commonStyles = {
  container: {
    fontFamily: "'Inter', sans-serif",
    maxWidth: "600px",
    margin: "0 auto",
  },
  section: {
    marginBottom: "20px",
  },
  title: {
    color: "#3b82f6",
    marginBottom: "16px",
  },
  paragraph: {
    marginBottom: "16px",
    lineHeight: 1.5,
  },
  list: {
    marginBottom: "24px",
    lineHeight: 1.6,
  },
  unsubscribe: {
    fontSize: "12px",
    color: "#6b7280",
  },
  link: {
    color: "#3b82f6",
    textDecoration: "none",
  },
  footer: {
    marginTop: "40px",
    paddingTop: "20px",
    borderTop: "1px solid #e5e7eb",
    textAlign: "center" as const,
    fontSize: "12px",
    color: "#6b7280",
  },
};

const EnglishVersion: React.FC<{ unsubscribeLink: string }> = ({
  unsubscribeLink,
}) => (
  <div style={commonStyles.section}>
    <h2 style={commonStyles.title}>
      You've Successfully Subscribed to {siteConfig.name} Updates!
    </h2>
    <p style={commonStyles.paragraph}>
      Here's what you'll receive in your inbox:
    </p>
    <ul style={commonStyles.list}>
      <li>{siteConfig.name} version updates</li>
      <li>Latest promotions and events from {siteConfig.name}</li>
    </ul>
    <p style={commonStyles.paragraph}>
      If you have any questions, feel free to reply to this email.
    </p>
  </div>
);

export const NewsletterWelcomeEmail: React.FC<NewsletterWelcomeEmailProps> = ({
  unsubscribeLink,
}) => {
  return (
    <div style={commonStyles.container}>
      <EnglishVersion unsubscribeLink={unsubscribeLink} />

      <div style={commonStyles.footer}>
        <p style={commonStyles.unsubscribe}>
          To unsubscribe from these updates,{" "}
          <a href={unsubscribeLink} style={commonStyles.link}>
            click here
          </a>
        </p>
        <p>
          © {new Date().getFullYear()} {siteConfig.name} - All Rights Reserved
        </p>
      </div>
    </div>
  );
};
