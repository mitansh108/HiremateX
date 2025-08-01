# 🤖 HireMateX – AI Agent-Powered Job Application Automation (SaaS)  
**Status:** 🚧 In Development | **Started:** July 2025  

**HireMateX** is an intelligent SaaS platform that automates the *entire job application process* using a coordinated system of AI agents. At its core, it leverages **LangGraph** and **LangChain** to orchestrate powerful workflows—turning resume parsing, job scraping, skill matching, and content generation into a fully autonomous pipeline.

---

## 🌐 What Makes HireMateX Different?

While most platforms help manage applications, **HireMateX acts as your AI assistant**, performing end-to-end tasks like:

- 🔍 Scraping job listings based on your profile
- 🧾 Parsing resumes and extracting structured data
- 📊 Matching your skills to job descriptions with 92%+ accuracy
- ✉️ Generating tailored cover letters & emails using Groq + LLaMA APIs
- 🧠 Executing everything as a **LangGraph-orchestrated agent workflow**

This project is a **real-world implementation of autonomous agents and AI workflow orchestration**—wrapped in a full-stack SaaS product.

---

## ⚙️ Tech Stack Overview

| Layer              | Tech Used                                                |
|--------------------|-----------------------------------------------------------|
| 🔁 AI Workflow Engine | **LangGraph**, **LangChain**, OpenAI, Groq, LLaMA        |
| 📦 Backend           | FastAPI, Supabase PostgreSQL, PyMuPDF                   |
| 💻 Frontend          | Next.js, React, Tailwind CSS                            |
| 🔐 Auth & Storage    | Supabase Auth, Supabase Storage                         |
| 💳 Billing           | Stripe API (pay-as-you-go credit system)               |

---

<pre lang="markdown"> ### 🧠 Core AI Workflow ```mermaid flowchart TD A[User Uploads Resume] --> B[Resume Parser Agent] B --> C[Job Scraper Agent] C --> D[Skill Matcher Agent] D --> E[Cover Letter Generator Agent] E --> F[Application Tracker & Dashboard] ``` Each step above represents an **autonomous LangChain agent**, coordinated through **LangGraph** for robust, memory-aware task orchestration. </pre>


Each node is an autonomous LangChain agent, orchestrated using LangGraph to ensure smooth task transitions, memory sharing, and error handling.
Key Features

✅ Fully automated end-to-end job application pipeline
📎 Resume parsing with custom extractors
🔍 Smart job scraping based on preferences
🤖 Multi-agent orchestration using LangGraph (resume → scrape → match → generate)
✉️ Personalized content generation (cover letters, outreach emails)
📊 Application tracking dashboard
💳 Stripe-powered credit-based billing system
🚧 Project Status

Core agent workflows are functional and under refinement.
UI + dashboard features and analytics are actively being built.
Stripe billing and token metering are live and tested.
