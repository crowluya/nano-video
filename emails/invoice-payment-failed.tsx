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
  locale?: "en" | "zh" | "ja";
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

const ChineseVersion: React.FC<InvoicePaymentFailedEmailProps> = ({
  planName,
  amountDue,
  currency,
  nextPaymentAttemptDate,
  updatePaymentMethodLink,
  supportLink,
  invoiceId,
}) => (
  <div style={commonStyles.section}>
    <h2 style={commonStyles.title}>需要你处理：支付失败</h2>
    <p style={commonStyles.paragraph}>
      我们未能成功处理你的{" "}
      <span style={commonStyles.highlight}>{planName}</span> 订阅付款。
    </p>
    <div style={commonStyles.infoBox}>
      <strong>账单 ID:</strong> {invoiceId}
      <br />
      <strong>应付金额:</strong>{" "}
      {new Intl.NumberFormat("zh-CN", {
        style: "currency",
        currency: currency.toUpperCase(),
      }).format(amountDue)}
    </div>
    <p style={commonStyles.paragraph}>
      为避免你的服务中断，请尽快更新你的支付方式。
    </p>
    <a href={updatePaymentMethodLink} style={commonStyles.ctaButton}>
      更新支付方式
    </a>
    {nextPaymentAttemptDate && (
      <p style={commonStyles.paragraph}>
        我们将在 {nextPaymentAttemptDate}{" "}
        左右再次尝试扣款。在此之前更新你的支付信息可以确保你的订阅保持有效。
      </p>
    )}
    <p style={commonStyles.supportText}>
      如果你已经更新了支付信息或认为这是一个错误，请忽略此邮件。如需帮助，请{" "}
      <a href={supportLink} style={commonStyles.link}>
        联系我们的支持团队
      </a>
      。
    </p>
  </div>
);

const JapaneseVersion: React.FC<InvoicePaymentFailedEmailProps> = ({
  planName,
  amountDue,
  currency,
  nextPaymentAttemptDate,
  updatePaymentMethodLink,
  supportLink,
  invoiceId,
}) => (
  <div style={commonStyles.section}>
    <h2 style={commonStyles.title}>要対応：お支払いが失敗しました</h2>
    <p style={commonStyles.paragraph}>
      お客様の <span style={commonStyles.highlight}>{planName}</span>{" "}
      サブスクリプションのお支払いを処理できませんでした。
    </p>
    <div style={commonStyles.infoBox}>
      <strong>請求書 ID:</strong> {invoiceId}
      <br />
      <strong>請求額:</strong>{" "}
      {new Intl.NumberFormat("ja-JP", {
        style: "currency",
        currency: currency.toUpperCase(),
      }).format(amountDue)}
    </div>
    <p style={commonStyles.paragraph}>
      サービスの停止を避けるため、できるだけ早くお支払い方法を更新してください。
    </p>
    <a href={updatePaymentMethodLink} style={commonStyles.ctaButton}>
      お支払い方法を更新する
    </a>
    {nextPaymentAttemptDate && (
      <p style={commonStyles.paragraph}>
        {nextPaymentAttemptDate}{" "}
        頃に再度お支払いを試みます。それまでに情報を更新していただくことで、サブスクリプションが有効に保たれます。
      </p>
    )}
    <p style={commonStyles.supportText}>
      既にお支払い情報を更新された場合、またはこれがエラーであると思われる場合は、このメッセージを無視してください。サポートが必要な場合は、
      <a href={supportLink} style={commonStyles.link}>
        サポートチームにお問い合わせください
      </a>
      。
    </p>
  </div>
);

export const InvoicePaymentFailedEmail: React.FC<
  InvoicePaymentFailedEmailProps
> = (props) => {
  return (
    <div style={commonStyles.container}>
      <EnglishVersion {...props} />
      <ChineseVersion {...props} />
      <JapaneseVersion {...props} />

      <div style={commonStyles.footer}>
        © {new Date().getFullYear()} {siteConfig.name} - All Rights Reserved
      </div>
    </div>
  );
};
