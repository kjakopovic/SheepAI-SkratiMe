import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Client } from '@notionhq/client';
import { Resend } from 'resend';
import 'dotenv/config';

const app = new Hono();

// CORS configuration - adjust origins for production
app.use('/*', cors({
  origin: (origin) => {
    // Allow all localhost origins for development
    if (origin?.includes('localhost') || origin?.includes('127.0.0.1')) {
      return origin;
    }
    // Allow your production domains
    const allowedOrigins = [
      'https://your-production-domain.com',
      'https://your-vercel-app.vercel.app',
    ];
    return allowedOrigins.includes(origin || '') ? origin : allowedOrigins[0];
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_KEY,
});

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

const NOTION_PAGE_ID = process.env.NOTION_SUMMARY_PAGE_ID;

// Health check endpoint
app.get('/', (c) => {
  return c.json({ message: 'Notion API server is running' });
});

// Endpoint to append content to Notion page
app.post('/api/notion/append', async (c) => {
  try {
    const body = await c.req.json();
    const { text, title, url } = body;

    if (!text) {
      return c.json({ error: 'Text is required' }, 400);
    }

    if (!NOTION_PAGE_ID) {
      return c.json({ error: 'Notion page ID not configured' }, 500);
    }

    // Build blocks array
    const blocks: any[] = [
      {
        object: 'block',
        type: 'divider',
        divider: {},
      },
    ];

    // Add title if provided
    if (title) {
      blocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [
            {
              type: 'text',
              text: { content: title },
            },
          ],
        },
      });
    }

    // Add main text content
    blocks.push({
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [
          {
            type: 'text',
            text: { content: text },
          },
        ],
      },
    });

    // Add source URL if provided
    if (url) {
      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: { content: 'Source: ' },
            },
            {
              type: 'text',
              text: {
                content: url,
                link: { url },
              },
            },
          ],
        },
      });
    }

    // Append blocks to Notion page
    const response = await notion.blocks.children.append({
      block_id: NOTION_PAGE_ID,
      children: blocks,
    });

    return c.json({
      success: true,
      message: 'Content added to Notion',
      data: response,
    });
  } catch (error: any) {
    console.error('Notion API error:', error);
    return c.json(
      {
        error: 'Failed to add content to Notion',
        details: error.message,
      },
      500
    );
  }
});

// Endpoint to send email briefing
app.post('/api/email/send', async (c) => {
  try {
    const body = await c.req.json();
    const { to, subject, html, text } = body;

    console.log('Received email request:', {
      hasTo: !!to,
      hasSubject: !!subject,
      hasHtml: !!html,
      hasText: !!text,
    });

    if (!to || !subject) {
      return c.json(
        { error: 'Missing required fields: to, subject' },
        400
      );
    }

    if (!html && !text) {
      return c.json(
        { error: 'Either html or text content is required' },
        400
      );
    }

    console.log('Sending email via Resend');

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'Skrati.me <info@mail.skrati-me.com>',
      to: Array.isArray(to) ? to : [to],
      subject: subject,
      html: html,
      text: text,
    });

    if (error) {
      console.error('Resend API error:', error);
      return c.json({ error: 'Failed to send email', details: error }, 500);
    }

    console.log('Email sent successfully:', data);

    return c.json({
      success: true,
      message: 'Email sent successfully',
      data,
    });
  } catch (error: any) {
    console.error('Email send error:', error);
    return c.json(
      {
        error: 'Failed to send email',
        details: error.message,
      },
      500
    );
  }
});

// Start server
const port = Number(process.env.PORT) || 3001;

console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
