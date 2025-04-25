# Nexty - Modern Full-Stack SaaS Template

Nexty is a feature-rich full-stack SaaS application template built with Next.js 15, React 19, and Supabase, providing developers with a complete solution for rapidly building and deploying SaaS applications.

🚀 Get Started Now 👉: https://nexty.dev

> Documentation for Nexty.dev is being prepared. Please read this README to get started. If you encounter any issues, please contact me for support:
> Email: hi@nexty.dev
> Twitter (Chinese): https://x.com/weijunext
> Twitter (English): https://x.com/judewei_dev

## ✨ Key Features

- 🚀 **Next.js 15 & React 19** - Built on the latest tech stack
- 💳 **Stripe Integration** - Complete subscription payment system
- 🔒 **Supabase Authentication** - Secure and reliable user management
- 🌍 **Internationalization** - Built-in support for English, Chinese, and Japanese
- 🧠 **AI Integration** - Support for multiple AI providers (OpenAI, Anthropic, DeepSeek, Google, etc.)
- 📊 **Admin Dashboard** - User management, pricing plans, content management, and more
- 📱 **Responsive Design** - Perfect adaptation to various devices
- 🎨 **Tailwind CSS** - Modern UI design
- 📧 **Email System** - Notification and marketing emails based on Resend
- 🖼️ **R2/S3 Storage** - Cloud storage support for media files

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Domain email configured in CloudFlare
- Supabase, Upstash, and Resend accounts registered with your domain email
- Stripe account for payment integration (optional)
  - Set environment variable NEXT_PUBLIC_ENABLE_STRIPE to false to disable payment features

### Installation Steps

1. **Clone the project**

```bash
git clone git@github.com:WeNextDev/nexty.dev.git
cd nexty
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Environment configuration**

Copy the `.env.example` file and rename it to `.env.local`, then configure the necessary environment variables:

```bash
cp .env.example .env.local
```

4. **Configure Supabase**

Create a new project in Supabase and add the generated URL and anonymous key to your `.env.local` file.

5. **Configure Supabase auth**

Follow the screenshot tutorial in `/README/supabase/auth` (related documentation will be published soon).

6. **Execute database commands**

Log in to Supabase and execute all SQL files in the `/data` folder in the SQL Editor.

7. **Generate Supabase types.ts locally**

Run the following commands in your terminal:
```
supabase login

supabase gen types typescript --project-id <your-project-id> --schema public > lib/supabase/types.ts
```

You'll need to run this command again whenever you update Supabase tables, policies, triggers, or functions.

8. **Configure Stripe (optional)**

If you need payment functionality, follow the screenshot tutorial in `/README/stripe` (related documentation will be published soon), then add the Stripe API keys to your `.env.local` file.

9. **Run the development server**

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to view your application.

## 📂 Project Structure

```
app/                  # Next.js application directory
├── [locale]/         # Internationalization routes
├── api/              # API endpoints
├── auth/             # Authentication-related components
components/           # Shared UI components
config/               # Website configuration
lib/                  # Utility functions and services
emails/               # Email templates
i18n/                 # Internationalization configuration and translation files
public/               # Static assets
```

## 💡 Main Functional Modules

- **User Authentication** - Google OAuth, GitHub OAuth, Magic Link
- **Subscription Management** - Plan selection, payment processing, billing management
- **Content Management** - Blog, showcases, static pages (CMS is under development)
- **User Dashboard** - Account settings, subscription management, usage statistics
- **Admin Backend** - User management, pricing plans, content management
- **AI Feature Demos** - Learn to develop AI features faster through various AI function demonstrations

## 🌍 Internationalization

The project has built-in support for English, Chinese, and Japanese:

1. `i18n/messages/`
2. `i18n/routing.ts`

## 🔧 Troubleshooting

### Invalid API Keys

Make sure you have correctly configured the API keys for Supabase and other services in your `.env.local` file.

### Payment Testing

In Stripe test mode, you can use the test card number `4242 4242 4242 4242` for payment testing.
