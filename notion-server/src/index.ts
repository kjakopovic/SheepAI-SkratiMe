import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Client } from '@notionhq/client';
import 'dotenv/config';

const app = new Hono();

// CORS configuration - adjust origins for production
app.use('/*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Add your frontend URLs
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}));

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_KEY,
});

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

// Start server
const port = Number(process.env.PORT) || 3001;

console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
