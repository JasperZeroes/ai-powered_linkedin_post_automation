
# AI-Powered LinkedIn Post Automation

## Overview

AI-Powered LinkedIn Post Automation is a developer-focused tool that helps users quickly generate high‑quality LinkedIn posts using artificial intelligence. The system allows users to input a **topic/prompt**, select a **tone**, and define a **goal**. The backend then generates a structured LinkedIn post including:

- Post content
- Hashtags
- Call-to-action (CTA)

The tool is designed to integrate with a **Chrome extension interface** so users can generate content and insert it directly into the LinkedIn editor.

The backend is built with:

- Node.js
- Express.js
- PostgreSQL
- OpenAI API
- Groq API (primary provider with OpenAI fallback)

The architecture follows modern backend best practices with clearly separated layers for:

- routes
- controllers
- services
- validators
- database utilities

---

# Key Features

• AI‑generated LinkedIn posts  
• Tone and goal customization  
• Structured output (post, hashtags, CTA)  
• Groq-first generation with OpenAI fallback  
• Draft storage capability  
• Usage analytics tracking  
• PostgreSQL database persistence  
• Secure authentication using JWT  
• Production‑ready Node.js architecture  

---

# Project Architecture

```
AI-POWERED_LINKEDIN_POST_AUTOMATION/

├── extension/
│   ├── icons/
│   ├── utils/
│   ├── background.js
│   ├── content.js
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
│
├── server/
│   ├── node_modules/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── db/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── validators/
│   │   ├── app.js
│   │   └── server.js
│   │
│   ├── .env
│   ├── .prettierignore
│   ├── .prettierrc
│   └── node_modules/
│
├── contract_doc.md
├── README.md
```

---

# API Contract & Coding Standards

The file:

```
contract_doc.md
```

contains:

• The complete API contract for all backend endpoints  
• Request and response structures  
• Database field standards  
• Industry‑standard Node.js coding conventions  
• Team Git workflow guidelines  

All contributors **must follow the conventions described in `contract_doc.md`.**

---

# Requirements

Install the following on your machine before running the project:

• Node.js (LTS recommended)  
• PostgreSQL  
• Git  

Check installation:

```
node -v
npm -v
```

---

# Project Setup (For New Developers)

Clone the repository:

```
git clone https://github.com/JasperZeroes/ai-powered_linkedin_post_automation.git
cd ai-powered_linkedin_post_automation
```

Install dependencies:

```
npm install
```

---

# Environment Variables

Create a `.env` file in the project root which is also the `server` folder.

Example:

```
PORT=5000

DATABASE_URL=postgresql://username:password@localhost:5432/linkedin_chrome_extension

OPENAI_API_KEY=your_openai_key (You don't need this for now)
GROQ_API_KEY=your_groq_key (You don't need this for now)

JWT_SECRET=your_jwt_secret (You don't need this for now)
```

Never commit `.env` to Git.

---

# Running Database Migrations

This project includes a SQL schema file that defines the database structure.

Tables created:

- users
- drafts
- generated_posts
- usage_events

Run the migration script:

```
npm run migrate
```

or

```
node src/db/migrate.js
```

This will execute the SQL inside:

```
src/db/schema.sql
```

---

# Testing Database Connection

To verify that the database connection works correctly, run:

```
node src/db/test-connection.js
```

* NB: Make sure you're inside the server folder to verify database connection.


Expected output:

```
Database connection successful
Current DB time: ...
```

If the connection fails, verify:

- PostgreSQL is running
- DATABASE_URL is correct
- credentials are valid e.g database name and password

---

# Running the Development Server

Start the server using:

```
npm run dev
```

This runs:

```
nodemon src/server.js
```

Nodemon automatically restarts the server when files change.

Example output:

```
Server running on port 5000
```

---

# Starting the Server in Production

For production environments run:

```
npm start
```

This runs:

```
node src/server.js
```

---

# Health Check Endpoint

You can test if the backend is running by calling the health endpoint.

Open your browser or Postman and visit:

```
http://localhost:5000/health
```

Expected response:

```
{
  "success": true,
  "message": "Server is running"
}
```

---

# Development Scripts

Available npm scripts:

```
npm run dev        → Start development server with nodemon
npm start          → Start production server
npm run migrate    → Run database migrations
npm run lint       → Run ESLint
npm run lint:fix   → Auto fix lint issues
npm run format     → Format code using Prettier
```

---

## Chrome Extension Setup

To run the popup UI in Chrome:

### Step 1: Open Extensions Page

Go to:

```
chrome://extensions/
```

---

### Step 2: Enable Developer Mode

* Toggle **Developer mode** (top right)

---

### Step 3: Load Extension

* Click **Load unpacked**
* Select the folder:

```
/extension
```

---

### Step 4: Pin the Extension

* Click the puzzle icon in Chrome toolbar
* Pin **AI LinkedIn Post Generator**

---

### Step 5: Test the Popup

* Click the extension icon
* You should see:

  * Auth screen (signup/login)
  * Then generator UI after login

---

### ⚠️ Important Notes

* Any changes to extension files require clicking **Reload** in `chrome://extensions/`
* Make sure:

  * `manifest.json` is valid
  * No console errors in popup

---

# Security Practices

This project includes:

• Helmet for HTTP security headers  
• JWT authentication  
• Input validation  
• Structured error responses  

Never expose:

- API keys
- database credentials
- JWT secrets

---

# Contributing

Before contributing:

1. Pull the latest changes
2. Follow the coding conventions in `contract_doc.md`
3. Run linting before committing
4. Use feature branches

Example branch name:

```
feature/post-generation-endpoint
```

Commit style:

```
feat: add draft saving endpoint
fix: correct validation logic
docs: update readme
```

---

# Future Improvements

Planned improvements include:

• Chrome extension publishing  
• LinkedIn auto‑insertion improvements  
• Draft editing interface  
• Analytics dashboard  
• AI cost monitoring  
• Team workspaces  

---

# Maintainers

Project maintained by the development team building the **AI‑Powered LinkedIn Post Automation Tool**.

