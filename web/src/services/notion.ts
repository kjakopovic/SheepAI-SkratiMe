import ky from 'ky';

const NOTION_SERVER_URL = import.meta.env.VITE_NOTION_SERVER_URL || 'http://localhost:3001';

interface ExportToNotionParams {
  text: string;
  title?: string;
  url?: string;
}

export const exportToNotion = async ({ text, title, url }: ExportToNotionParams) => {
  try {
    const response = await ky.post(`${NOTION_SERVER_URL}/api/notion/append`, {
      json: {
        text,
        title,
        url,
      },
    }).json<{ success: boolean; message: string }>();

    return response;
  } catch (error) {
    console.error('Error exporting to Notion:', error);
    throw error;
  }
};
