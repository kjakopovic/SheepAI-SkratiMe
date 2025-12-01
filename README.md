# Skrati.me - AI-Powered News Intelligence Platform

## Overview

Skrati.me is a next-generation news intelligence platform designed for busy professionals and decision-makers. It combines a robust serverless AWS architecture for content delivery with a cutting-edge AI layer (Gemini 1.5 Flash) to transform raw news into actionable insights. 

Users don't just "read" news; they interact with it—getting instant summaries, bias checks, and executive briefings, all integrated seamlessly into their productivity workflows (Notion, Email).

## 🚀 Key Features for Hackathon Pitch

### 🧠 Generative AI Analyst (Powered by Gemini 1.5 Flash)
Instead of static articles, every piece of content comes with an on-demand AI analyst:
- **Flashpoint Mode:** Instant, high-level summaries for rapid consumption.
- **Executive Brief:** Deep-dive analysis extracting key stakeholders, implications, and timeline.
- **Balance Check:** AI-driven bias detection to identify potential narrative skew.
- **Auto-Categorization:** Real-time classification of incoming RSS feeds using LLMs for superior accuracy.

### 🎯 Intelligent Personalization
- **Behavioral Relevance Engine:** Client-side algorithm that learns from reading habits (click tracking) to bubble up the most relevant stories.
- **Custom Feeds:** Users define their interest vectors (e.g., "Cybersecurity", "Cloud", "AI").

### 🔌 Productivity Integrations
- **One-Click Notion Export:** Instantly save articles, AI summaries, and chat insights directly to a Notion workspace.
- **Smart Briefings:** Automated email newsletters generated via Resend, summarizing top stories.

### 🎧 Multi-Modal Consumption
- **Text-to-Speech:** AWS Polly integration converts any article into an audio stream for on-the-go listening.

## 🛠️ Technology Stack

### AI & Edge Layer (`notion-server`)
- **Runtime:** Node.js with Hono (Lightweight Web Framework)
- **AI Model:** Google Gemini 1.5 Flash (via `@google/generative-ai`)
- **Scraping:** `rss-parser` & `cheerio` for real-time content ingestion
- **Integrations:** Notion API (Block appending), Resend API (Email)

### Core Cloud Infrastructure (AWS Serverless)
- **Compute:** AWS Lambda (Python 3.12)
- **Database:** DynamoDB (News storage & User profiles)
- **Auth:** AWS Cognito (Secure identity management)
- **Storage:** S3 (Audio assets)
- **IaC:** AWS CDK

![skratime](https://github.com/user-attachments/assets/e87f4dd2-a9c1-440a-babb-ce1a863dc258)

### Frontend Experience (`web`)
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Visuals:** WebGL-powered "Aurora" dynamic background
- **State:** TanStack Query + React Router v7
- **Logic:** Custom relevance algorithms & local storage persistence

## 🏗️ Architecture Highlights

The system operates on a hybrid architecture:
1.  **Ingestion Pipeline:** AWS Lambdas fetch and store core news data.
2.  **Intelligence Layer:** The Hono server acts as an intelligent proxy, fetching raw content, passing it through Gemini for enrichment (categorization/summarization), and handling third-party integrations (Notion/Email).
3.  **Delivery:** The React frontend unifies these streams, presenting a polished, high-performance UI with granular control over the reading experience.

## Use Cases

1.  **The C-Suite Executive:** Needs "Executive Briefs" pushed to their Notion dashboard every morning.
2.  **The Commuter:** Uses "Text-to-Speech" to listen to the "Balance Check" of controversial topics while driving.
3.  **The Researcher:** Uses the AI Chatbot to interrogate articles ("What are the sources for this claim?") and exports findings.

## Project Structure

```bash
sheepai/
├── backend/                # AWS Serverless Core
│   ├── skratimeauth.../    # Cognito Auth Stack
│   └── skratimenews.../    # News & Polly Stack
├── notion-server/          # AI & Integration Layer (Hono + Gemini)
└── web/                    # React 19 Frontend
```
