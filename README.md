# AI-Powered Personal Finance App

A smart, AI-powered personal finance web application that provides comprehensive financial management and insights—designed for simplicity, engagement, and clarity.

## Features

- Budget Tracking: Set and monitor budgets by category  
- Transaction Management: Record and categorize your expenses  
- AI-Powered Insights: Receive personalized advice and predictions  
- Receipt Scanning: Extract transaction details using AI  
- Expense Analytics: Visualize your spending patterns  
- Bill Reminders: Track upcoming bills and payment deadlines  
- Financial Goals: Set and monitor savings or spending targets  
- Budget Alerts: Get notified when nearing or exceeding budgets  

## Technology Stack

**Frontend:**  
- React.js with TypeScript  
- React Query + Context API  
- Shadcn/UI + Tailwind CSS  

**Backend:**  
- Express.js with TypeScript  
- MongoDB with Mongoose  
- Passport.js (local strategy)  
- WebSockets (for real-time updates)  

**Integrations:**  
- OpenAI API (for AI features)  
- SendGrid API (for email alerts)  

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)  
- MongoDB (local or cloud)  
- OpenAI API key  
- SendGrid API key  

### Environment Variables

Create a `.env` file in the root directory with the following content:

```
# Required
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=your_secure_session_secret

# For AI features
OPENAI_API_KEY=your_openai_api_key

# For email alerts
SENDGRID_API_KEY=your_sendgrid_api_key
```

## Installation

```
git clone <repository-url>
cd personal-finance-app
npm install
```

Start the development server:

```
npm run dev
```

Then open http://localhost:3000 in your browser.

## MongoDB Setup

You can choose between:

- Local Installation: https://www.mongodb.com/docs/manual/installation/  
- Cloud Setup: https://www.mongodb.com/cloud/atlas  

Update your `.env` with the proper `MONGODB_URI`.

## Feedback or Contributions

Feel free to open issues or pull requests to improve this project!
