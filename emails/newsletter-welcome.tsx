import { siteConfig } from "@/config/site";
import * as React from "react";

interface NewsletterWelcomeEmailProps {
  email: string;
  unsubscribeLinkEN: string;
  unsubscribeLinkZH: string;
  unsubscribeLinkJA: string;
  locale?: "en" | "zh" | "ja";
}

const commonStyles = {
  container: {
    fontFamily: "'Inter', sans-serif",
    maxWidth: "600px",
    margin: "0 auto",
  },
  section: {
    marginBottom: "40px",
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: "30px",
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
      <li>{siteConfig.name} updates</li>
    </ul>
    <p style={commonStyles.paragraph}>
      If you have any questions, feel free to reply to this email.
    </p>
    <p style={commonStyles.unsubscribe}>
      To unsubscribe from these updates,{" "}
      <a href={unsubscribeLink} style={commonStyles.link}>
        click here
      </a>
    </p>
  </div>
);

const ChineseVersion: React.FC<{ unsubscribeLink: string }> = ({
  unsubscribeLink,
}) => (
  <div style={commonStyles.section}>
    <h2 style={commonStyles.title}>
      你已成功订阅 {siteConfig.name} 邮件通知！
    </h2>
    <p style={commonStyles.paragraph}>接下来，你将通过邮件获得：</p>
    <ul style={commonStyles.list}>
      <li>{siteConfig.name} 版本更新通知</li>
    </ul>
    <p style={commonStyles.paragraph}>
      如有任何问题，欢迎直接回复此邮件与我们联系。
    </p>
    <p style={commonStyles.unsubscribe}>
      如果你想取消订阅，请
      <a href={unsubscribeLink} style={commonStyles.link}>
        点击这里
      </a>
    </p>
  </div>
);

const JapaneseVersion: React.FC<{ unsubscribeLink: string }> = ({
  unsubscribeLink,
}) => (
  <div style={commonStyles.section}>
    <h2 style={commonStyles.title}>
      {siteConfig.name} メールマガジンのご登録ありがとうございます！
    </h2>
    <p style={commonStyles.paragraph}>
      今後、以下の情報をメールにてお届けいたします：
    </p>
    <ul style={commonStyles.list}>
      <li>{siteConfig.name} のバージョンアップデート情報</li>
    </ul>
    <p style={commonStyles.paragraph}>
      ご不明な点がございましたら、このメールに直接返信してお問い合わせください。
    </p>
    <p style={commonStyles.unsubscribe}>
      配信停止をご希望の場合は、
      <a href={unsubscribeLink} style={commonStyles.link}>
        こちら
      </a>
      をクリックしてください
    </p>
  </div>
);

export const NewsletterWelcomeEmail: React.FC<NewsletterWelcomeEmailProps> = ({
  unsubscribeLinkEN,
  unsubscribeLinkZH,
  unsubscribeLinkJA,
}) => {
  return (
    <div style={commonStyles.container}>
      <EnglishVersion unsubscribeLink={unsubscribeLinkEN} />
      <ChineseVersion unsubscribeLink={unsubscribeLinkZH} />
      <JapaneseVersion unsubscribeLink={unsubscribeLinkJA} />

      <div style={commonStyles.footer}>
        © {new Date().getFullYear()} {siteConfig.name} - All Rights Reserved
      </div>
    </div>
  );
};
