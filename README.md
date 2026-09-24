# 💰 Finlytics AI

> **An AI-powered personal finance management platform that helps users track, analyze, and manage their finances through intelligent automation, budgeting, receipt scanning, and personalized financial insights.**

## 📌 Project Description

**Finlytics AI** is a full-stack personal finance management application designed to simplify the way users manage their day-to-day finances. The platform allows users to maintain multiple financial accounts, record income and expenses, monitor monthly budgets, and visualize their financial activity through interactive charts.

The application also integrates **Google Gemini AI** to provide intelligent features such as **AI-powered receipt scanning** and **personalized financial insights**. Users can scan a receipt and automatically extract important transaction information such as amount, date, description, merchant name, and category, reducing the effort required for manual data entry.

Finlytics AI also supports **recurring transactions**, automated **budget alerts**, and **monthly financial reports**. Background processes are handled using Inngest, allowing recurring transactions and scheduled financial reports to be processed automatically.

The application focuses on providing a simple, responsive, and secure interface while combining conventional financial management features with AI-powered automation.

---

## ✨ Features

### 🏦 Account Management

* Create and manage multiple financial accounts
* Support for **Current** and **Savings** accounts
* Set an account as the default account
* View individual account balances
* Automatically update account balances when transactions are created, edited, or deleted
* Prevent removal of the only default account

### 💸 Transaction Management

* Add income and expense transactions
* Select account and transaction category
* Add transaction descriptions and dates
* Edit existing transactions
* Delete individual transactions
* Select and delete multiple transactions
* Automatic account balance updates
* Transaction ownership validation

### 🤖 AI Receipt Scanner

* Upload or capture a receipt image
* Process receipt images using **Google Gemini AI**
* Automatically extract:

  * Transaction amount
  * Transaction date
  * Description
  * Merchant name
  * Category
* Automatically populate extracted information into the transaction form
* Reduces manual transaction entry

### 📊 Financial Analytics

* Dashboard overview of financial activity
* Recent transaction visualization
* Monthly expense breakdown
* Category-wise expense analysis
* Interactive pie charts
* Income and expense bar charts
* Net income calculation
* Multiple date-range options for account analytics:

  * Last 7 Days
  * Last Month
  * Last 3 Months
  * Last 6 Months
  * All Time

### 🎯 Budget Management

* Set a monthly budget
* Track current monthly expenses
* Display budget utilization through a progress bar
* Dynamically indicate budget usage levels
* Update existing budgets
* Monitor spending against the selected account

### 🔁 Recurring Transactions

* Create recurring transactions
* Support multiple recurrence intervals:

  * Daily
  * Weekly
  * Monthly
  * Yearly
* Automatically calculate the next recurring date
* Automatically process transactions using scheduled background jobs
* Display recurring status and next transaction date

### 📧 Automated Financial Reports

* Generate monthly financial reports automatically
* Analyze previous month's income and expenses
* Calculate category-wise spending
* Generate **AI-powered financial insights using Gemini**
* Provide three concise and actionable insights
* Deliver personalized reports through email

### 🚨 Budget Alerts

* Automatically monitor monthly budget usage
* Check budget status periodically
* Trigger an email alert when spending reaches **80% of the budget**
* Prevent repeated alerts within the same month
* Include budget amount, current spending, and usage percentage in the alert

### 🔍 Transaction Search & Filtering

* Search transactions by description
* Filter by:

  * Income
  * Expense
  * Recurring
  * Non-recurring
* Sort transactions by:

  * Date
  * Amount
  * Category
* Clear filters easily
* Paginate transaction results

### 🔐 Security

* Secure authentication using **Clerk**
* User-specific data access
* Account ownership verification
* Transaction ownership verification
* Request rate limiting using **Arcjet**
* Protection against excessive requests
* Atomic database operations for maintaining financial data consistency

### ⚡ User Experience

* Responsive interface
* Interactive UI components
* Loading indicators during asynchronous operations
* Toast notifications for success and error states
* Calendar-based date selection
* Responsive transaction tables
* Clean dashboard-oriented design



## 🎯 Project Goal

The primary goal of **Finlytics AI** is to combine traditional personal finance management with AI-powered automation, allowing users to spend less time manually managing financial records and gain clearer insights into their spending and budgeting habits.





This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
