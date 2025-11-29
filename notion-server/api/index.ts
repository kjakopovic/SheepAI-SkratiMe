import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Client } from '@notionhq/client';
import { handle } from 'hono/vercel';

const app = new Hono().basePath('/api');

// CORS configuration - allow localhost for development
app.use('/*', cors({
  origin: (origin) => {
    console.log('Request origin:', origin);
    // Allow all localhost origins for development
    if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return origin || '*';
    }
    // Allow your production domains (update these with your actual domains)
    const allowedOrigins = [
      'https://your-production-domain.com',
      'https://your-vercel-app.vercel.app',
    ];

    // If origin is in allowed list, return it, otherwise return first allowed origin
    return allowedOrigins.includes(origin) ? origin : '*';
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400,
}));

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_KEY,
});

const NOTION_PAGE_ID = process.env.NOTION_SUMMARY_PAGE_ID;

// Health check endpoint
app.get('/', (c) => {
  return c.json({
    message: 'Notion API server is running',
    configured: !!NOTION_PAGE_ID,
  });
});

// Endpoint to append content to Notion page
app.post('/notion/append', async (c) => {
  try {
    const body = await c.req.json();
    const { text, title, url } = body;

    console.log('Received request:', { hasText: !!text, hasTitle: !!title, hasUrl: !!url });

    if (!text) {
      return c.json({ error: 'Text is required' }, 400);
    }

    if (!NOTION_PAGE_ID) {
      console.error('NOTION_SUMMARY_PAGE_ID not configured');
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

    console.log('Appending blocks to Notion page:', NOTION_PAGE_ID);

    // Append blocks to Notion page
    const response = await notion.blocks.children.append({
      block_id: NOTION_PAGE_ID,
      children: blocks,
    });

    console.log('Successfully added content to Notion');

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

export default handle(app);
