# Notion Server

A simple Hono server to handle Notion API calls server-side, keeping your Notion API key secure.

## Setup

### 1. Install Dependencies

```bash
cd notion-server
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and add your Notion credentials:
```env
NOTION_KEY=secret_your_notion_integration_key
NOTION_SUMMARY_PAGE_ID=your_page_id_here
PORT=3001
```

### 3. Get Notion Credentials

#### Get Notion Integration Key:
1. Go to https://www.notion.so/my-integrations
2. Click "+ New integration"
3. Give it a name (e.g., "SheepAI")
4. Copy the "Internal Integration Token" (starts with `secret_`)

#### Get Page ID:
1. Open your Notion page
2. Click "Share" in the top right
3. Click "Invite" and add your integration
4. Copy the page ID from the URL:
   - URL format: `https://www.notion.so/Your-Page-Title-{PAGE_ID}?...`
   - The page ID is the 32-character string (with dashes)

## Running Locally

### Development Mode (with hot reload)
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

## Running with Docker

### Using Docker Compose (Recommended)
```bash
# Create .env file first
cp .env.example .env
# Edit .env with your credentials

# Start server
docker-compose up -d

# View logs
docker-compose logs -f

# Stop server
docker-compose down
```

### Using Docker directly
```bash
docker build -t notion-server .
docker run -p 3001:3001 \
  -e NOTION_KEY=your_key \
  -e NOTION_SUMMARY_PAGE_ID=your_page_id \
  notion-server
```

## API Endpoints

### POST /api/notion/append

Append content to your Notion page.

**Request Body:**
```json
{
  "text": "Your content here",
  "title": "Optional title",
  "url": "https://optional-source-url.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Content added to Notion",
  "data": { ... }
}
```

## Frontend Integration

Update your React app's `.env`:
```env
VITE_NOTION_SERVER_URL=http://localhost:3001
```

Use the service:
```typescript
import { exportToNotion } from '@/services/notion';

// In your component
const handleExport = async () => {
  try {
    await exportToNotion({
      text: 'Your summary text',
      title: 'News Article Title',
      url: 'https://example.com/article'
    });
    toast.success('Exported to Notion!');
  } catch (error) {
    toast.error('Failed to export');
  }
};
```

## Testing

```bash
# Test the endpoint
curl -X POST http://localhost:3001/api/notion/append \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Test content",
    "title": "Test Title",
    "url": "https://example.com"
  }'
```

## Production Deployment

For production, update the CORS origins in `src/index.ts`:
```typescript
app.use('/*', cors({
  origin: ['https://your-production-domain.com'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}));
```
