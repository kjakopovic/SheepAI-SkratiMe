import { Hono } from "hono";
import { cors } from "hono/cors";
import { Client } from "@notionhq/client";
import { handle } from "hono/vercel";
import { Resend } from "resend";
import Parser from "rss-parser";
import * as cheerio from "cheerio";

const app = new Hono().basePath("/api");

// CORS configuration - allow localhost for development
app.use(
  "/*",
  cors({
    origin: (origin) => {
      console.log("Request origin:", origin);
      // Allow all localhost origins for development
      if (
        !origin ||
        origin.includes("localhost") ||
        origin.includes("127.0.0.1")
      ) {
        return origin || "*";
      }
      // Allow your production domains (update these with your actual domains)
      const allowedOrigins = ["https://skrati-me.com"];

      // If origin is in allowed list, return it, otherwise return first allowed origin
      return allowedOrigins.includes(origin) ? origin : "*";
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 86400,
  }),
);

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_KEY,
});

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Initialize RSS parser
const rssParser = new Parser();

const NOTION_PAGE_ID = process.env.NOTION_SUMMARY_PAGE_ID;
const RSS_FEED_URL = "https://feeds.feedburner.com/TheHackersNews";

// Health check endpoint
app.get("/", (c) => {
  return c.json({
    message: "Notion API server is running",
    configured: !!NOTION_PAGE_ID,
  });
});

// Endpoint to append content to Notion page
app.post("/notion/append", async (c) => {
  try {
    const body = await c.req.json();
    const { text, title, url } = body;

    console.log("Received request:", {
      hasText: !!text,
      hasTitle: !!title,
      hasUrl: !!url,
    });

    if (!text) {
      return c.json({ error: "Text is required" }, 400);
    }

    if (!NOTION_PAGE_ID) {
      console.error("NOTION_SUMMARY_PAGE_ID not configured");
      return c.json({ error: "Notion page ID not configured" }, 500);
    }

    // Build blocks array
    const blocks: any[] = [
      {
        object: "block",
        type: "divider",
        divider: {},
      },
    ];

    // Add title if provided
    if (title) {
      blocks.push({
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [
            {
              type: "text",
              text: { content: title },
            },
          ],
        },
      });
    }

    // Add main text content
    blocks.push({
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [
          {
            type: "text",
            text: { content: text },
          },
        ],
      },
    });

    // Add source URL if provided
    if (url) {
      blocks.push({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [
            {
              type: "text",
              text: { content: "Source: " },
            },
            {
              type: "text",
              text: {
                content: url,
                link: { url },
              },
            },
          ],
        },
      });
    }

    console.log("Appending blocks to Notion page:", NOTION_PAGE_ID);

    // Append blocks to Notion page
    const response = await notion.blocks.children.append({
      block_id: NOTION_PAGE_ID,
      children: blocks,
    });

    console.log("Successfully added content to Notion");

    return c.json({
      success: true,
      message: "Content added to Notion",
      data: response,
    });
  } catch (error: any) {
    console.error("Notion API error:", error);
    return c.json(
      {
        error: "Failed to add content to Notion",
        details: error.message,
      },
      500,
    );
  }
});

// Email template generator function
function generateEmailHTML(data: {
  breakingArticle: any;
  relatedArticles: any[];
  preheaderText: string;
}): string {
  const { breakingArticle, relatedArticles, preheaderText } = data;

  const relatedItemsHTML = relatedArticles
    .map(
      (article, index) => `
    <div class="relevant-item" ${index === relatedArticles.length - 1 ? 'style="border-bottom: 0"' : ""}>
      <div class="thumb">
        <a href="${article.url}">
          <img src="${article.image}" alt="${article.title}" />
        </a>
      </div>
      <div class="ri-body">
        <a href="${article.url}" style="text-decoration: none; color: inherit">
          <div class="ri-title">${article.title}</div>
        </a>
        <div class="ri-meta">
          ${article.summary} &nbsp;•&nbsp;
          <span class="muted">${article.author || "The Hacker News"}</span>
        </div>
      </div>
    </div>
  `,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta http-equiv="x-ua-compatible" content="ie=edge" />
    <title>${breakingArticle.title}</title>
    <style>
      body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}img{-ms-interpolation-mode:bicubic;border:0;outline:none;text-decoration:none;display:block}a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important}body{margin:0;padding:0;width:100%!important;background-color:#f4f6f8;font-family:"Inter",Arial,sans-serif}.wrapper{width:100%;table-layout:fixed;background-color:#f4f6f8;padding-bottom:40px}.main{background-color:#ffffff;margin:0 auto;width:100%;max-width:680px;border-radius:12px;overflow:hidden}h1{font-size:20px;margin:0 0 8px 0;line-height:1.2;color:#0f1724}p{margin:0;color:#334155;line-height:1.5;font-size:14px}.muted{color:#64748b;font-size:13px}.btn{display:inline-block;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600;background-color:#0ea5e9;color:#fff}.container{padding:20px}.breaking{display:block}.breaking-image{width:100%;height:auto;border-radius:8px}.breaking-meta{margin-top:12px}.relevant-list{margin-top:18px}.relevant-item{display:flex;gap:12px;padding:12px 0;border-top:1px solid #eef2f6;align-items:center}.thumb{width:84px;height:56px;border-radius:8px;overflow:hidden;flex-shrink:0;background-color:#e2e8f0}.thumb img{width:100%;height:100%;object-fit:cover;display:block}.ri-body{flex:1}.ri-title{font-size:15px;color:#0f1724;margin-bottom:6px}.ri-meta{font-size:12px;color:#64748b}.footer{padding:16px 20px;color:#94a3b8;font-size:12px;text-align:center}@media screen and (max-width:520px){.container{padding:14px}.thumb{width:68px;height:48px}h1{font-size:18px}}
    </style>
  </head>
  <body>
    <span style="display:none;font-size:1px;color:#f4f6f8;max-height:0;max-width:0;opacity:0;overflow:hidden">${preheaderText}</span>
    <table class="wrapper" cellpadding="0" cellspacing="0" role="presentation" width="100%">
      <tr><td align="center"><table class="main" cellpadding="0" cellspacing="0" role="presentation">
        <tr><td style="background:linear-gradient(90deg,#0ea5e9 0%,#7c3aed 100%);padding:16px 20px"><table width="100%"><tr>
          <td style="vertical-align:middle"><span style="color:#fff;font-weight:700;letter-spacing:0.2px">Skrati.me</span></td>
          <td style="text-align:right;vertical-align:middle"><span style="color:#e6f7ff;font-size:13px">Breaking • ${breakingArticle.title}</span></td>
        </tr></table></td></tr>
        <tr><td class="container">
          <a href="${breakingArticle.url}" class="breaking" style="text-decoration:none;color:inherit">
            <img src="${breakingArticle.image}" alt="${breakingArticle.title}" class="breaking-image"/>
            <div class="breaking-meta" style="padding-top:8px">
              <h1>${breakingArticle.title}</h1>
              <p class="muted" style="margin-bottom:8px">${breakingArticle.summary}</p>
              <div style="display:flex;gap:8px;align-items:center">
                <a href="${breakingArticle.url}" class="btn">Read full story</a>
                <span style="font-size:13px;color:#64748b">&nbsp;•&nbsp;${breakingArticle.source || "The Hacker News"}</span>
              </div>
            </div>
          </a>
          <div class="relevant-list" aria-labelledby="related-heading" role="region">
            <h2 id="related-heading" style="font-size:14px;margin:18px 0 8px 0;color:#0f1724">Related stories</h2>
            ${relatedItemsHTML}
          </div>
          <div style="margin-top:18px;display:flex;gap:10px;align-items:center">
            <a href="https://skrati-me.com" class="btn">View full briefing</a>
            <a href="https://skrati-me.com/preferences" style="font-size:13px;color:#64748b;text-decoration:underline">Manage preferences</a>
          </div>
        </td></tr>
        <tr><td class="footer" style="background:#f8fafc;border-top:1px solid #eef2f6"><div style="max-width:560px;margin:0 auto;padding:12px 20px">
          <div style="margin-bottom:8px">You're receiving this because you subscribed to NewsFlash alerts.</div>
          <div><a href="https://skrati-me.com/unsubscribe" style="color:#94a3b8;text-decoration:underline">Unsubscribe</a> • <a href="https://skrati-me.com/privacy" style="color:#94a3b8;text-decoration:underline">Privacy policy</a></div>
          <div style="margin-top:10px;color:#9aa6b2">Skrati.me • Your personalized news briefing</div>
        </div></td></tr>
      </table></td></tr>
    </table>
  </body>
</html>`;
}

// Endpoint to send email briefing
app.post("/email/send", async (c) => {
  try {
    const body = await c.req.json();
    const { to, breakingArticle, relatedArticles, preheaderText } = body;

    console.log("Received email request:", {
      hasTo: !!to,
      hasBreakingArticle: !!breakingArticle,
      hasRelatedArticles: !!relatedArticles,
    });

    if (!to || !breakingArticle || !relatedArticles) {
      return c.json(
        {
          error:
            "Missing required fields: to, breakingArticle, relatedArticles",
        },
        400,
      );
    }

    // Generate email HTML from template
    const emailHTML = generateEmailHTML({
      breakingArticle,
      relatedArticles,
      preheaderText:
        preheaderText || breakingArticle.summary?.substring(0, 100) || "",
    });

    console.log("Sending email via Resend");

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: "Skrati.me <info@mail.skrati-me.com>",
      to: Array.isArray(to) ? to : [to],
      subject: `[Breaking] ${breakingArticle.title} — Top related stories`,
      html: emailHTML,
    });

    if (error) {
      console.error("Resend API error:", error);
      return c.json({ error: "Failed to send email", details: error }, 500);
    }

    console.log("Email sent successfully:", data);

    return c.json({
      success: true,
      message: "Email sent successfully",
      data,
    });
  } catch (error: any) {
    console.error("Email send error:", error);
    return c.json(
      {
        error: "Failed to send email",
        details: error.message,
      },
      500,
    );
  }
});

// Endpoint to fetch and scrape Hacker News RSS feed
app.get("/rss/fetch", async (c) => {
  try {
    console.log("Fetching RSS feed from:", RSS_FEED_URL);

    // Fetch RSS feed
    const feed = await rssParser.parseURL(RSS_FEED_URL);
    console.log(`Found ${feed.items.length} items in RSS feed`);

    // Process each article (limit to 10 for performance)
    const articles = await Promise.all(
      feed.items.slice(0, 10).map(async (item) => {
        try {
          const articleUrl = item.link || "";
          console.log(`Scraping article: ${articleUrl}`);

          // Fetch the article HTML with timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

          const response = await fetch(articleUrl, {
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          const html = await response.text();

          // Load HTML with Cheerio
          const $ = cheerio.load(html);

          // Remove unwanted elements
          $(".dog_two").remove();
          $(".separator").remove();
          $(".cf.note-b").remove();

          // Extract article body
          const articleBody = $("#articlebody");

          // Get clean text content
          let bodyText = "";
          articleBody.find("p, h2, ul, li").each((_, element) => {
            const text = $(element).text().trim();
            if (text) {
              bodyText += text + " ";
            }
          });

          // Extract image from article body
          const firstImage = articleBody.find("img").first();
          const imageUrl = firstImage.attr("src") || item.enclosure?.url || "";

          return {
            title: item.title || "",
            link: articleUrl,
            pubDate: item.pubDate || "",
            summary: item.contentSnippet?.substring(0, 300) || "",
            fullContent: bodyText
              .trim()
              .replace(/\n/g, " ")
              .replace(/\s+/g, " "),
            image: imageUrl,
            author: item.creator || "The Hacker News",
            categories: item.categories || [],
          };
        } catch (error) {
          console.error(`Error scraping article ${item.link}:`, error);
          return {
            title: item.title || "",
            link: item.link || "",
            pubDate: item.pubDate || "",
            summary: item.contentSnippet || "",
            fullContent: "",
            image: item.enclosure?.url || "",
            author: item.creator || "The Hacker News",
            categories: item.categories || [],
            error: "Failed to scrape article content",
          };
        }
      }),
    );

    return c.json({
      success: true,
      feedTitle: feed.title,
      feedDescription: feed.description,
      totalArticles: articles.length,
      articles,
    });
  } catch (error: any) {
    console.error("RSS fetch error:", error);
    return c.json(
      {
        error: "Failed to fetch RSS feed",
        details: error.message,
      },
      500,
    );
  }
});

// Endpoint to scrape single article
app.post("/rss/scrape", async (c) => {
  try {
    const body = await c.req.json();
    const { url } = body;

    if (!url) {
      return c.json({ error: "Article URL is required" }, 400);
    }

    console.log(`Scraping single article: ${url}`);

    // Fetch the article HTML with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    const html = await response.text();

    // Load HTML with Cheerio
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $(".dog_two").remove();
    $(".separator").remove();
    $(".cf.note-b").remove();

    // Extract article body
    const articleBody = $("#articlebody");

    // Get clean text content
    let bodyText = "";
    articleBody.find("p, h2, ul, li").each((_, element) => {
      const text = $(element).text().trim();
      if (text) {
        bodyText += text + " ";
      }
    });

    // Extract metadata
    const title =
      $('meta[property="og:title"]').attr("content") || $("title").text();
    const description =
      $('meta[property="og:description"]').attr("content") || "";
    const image =
      $('meta[property="og:image"]').attr("content") ||
      articleBody.find("img").first().attr("src") ||
      "";
    const pubDate =
      $('meta[property="article:published_time"]').attr("content") || "";

    return c.json({
      success: true,
      article: {
        title,
        url,
        description,
        fullContent: bodyText.trim().replace(/\n/g, " ").replace(/\s+/g, " "),
        image,
        pubDate,
      },
    });
  } catch (error: any) {
    console.error("Article scrape error:", error);
    return c.json(
      {
        error: "Failed to scrape article",
        details: error.message,
      },
      500,
    );
  }
});

export default handle(app);
