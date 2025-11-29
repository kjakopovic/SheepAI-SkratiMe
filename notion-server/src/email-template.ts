interface BreakingArticle {
  title: string;
  summary: string;
  image: string;
  url: string;
  source: string;
}

interface RelatedArticle {
  title: string;
  summary: string;
  image: string;
  url: string;
  author: string;
}

interface EmailData {
  breakingArticle: BreakingArticle;
  relatedArticles: RelatedArticle[];
  preheaderText: string;
}

export function generateEmailHTML(data: EmailData): string {
  const { breakingArticle, relatedArticles, preheaderText } = data;

  const relatedItemsHTML = relatedArticles
    .map(
      (article, index) => `
    <div class="relevant-item" ${index === relatedArticles.length - 1 ? 'style="border-bottom: 0"' : ''}>
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
          <span class="muted">${article.author}</span>
        </div>
      </div>
    </div>
  `
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta http-equiv="x-ua-compatible" content="ie=edge" />
    <title>${breakingArticle.title}</title>
    <style>
      /* CLIENT-SAFE STYLES */
      body,
      table,
      td,
      a {
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
      }
      table,
      td {
        mso-table-lspace: 0pt;
        mso-table-rspace: 0pt;
      }
      img {
        -ms-interpolation-mode: bicubic;
        border: 0;
        outline: none;
        text-decoration: none;
        display: block;
      }
      a[x-apple-data-detectors] {
        color: inherit !important;
        text-decoration: none !important;
      }

      /* RESET */
      body {
        margin: 0;
        padding: 0;
        width: 100% !important;
        background-color: #f4f6f8;
        font-family: "Inter", Arial, sans-serif;
      }
      .wrapper {
        width: 100%;
        table-layout: fixed;
        background-color: #f4f6f8;
        padding-bottom: 40px;
      }
      .main {
        background-color: #ffffff;
        margin: 0 auto;
        width: 100%;
        max-width: 680px;
        border-radius: 12px;
        overflow: hidden;
      }

      /* TYPOGRAPHY */
      h1 {
        font-size: 20px;
        margin: 0 0 8px 0;
        line-height: 1.2;
        color: #0f1724;
      }
      p {
        margin: 0;
        color: #334155;
        line-height: 1.5;
        font-size: 14px;
      }
      .muted {
        color: #64748b;
        font-size: 13px;
      }

      /* BUTTON */
      .btn {
        display: inline-block;
        padding: 10px 16px;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 600;
        background-color: #0ea5e9;
        color: #fff;
      }

      /* LAYOUT */
      .container {
        padding: 20px;
      }
      .breaking {
        display: block;
      }
      .breaking-image {
        width: 100%;
        height: auto;
        border-radius: 8px;
      }
      .breaking-meta {
        margin-top: 12px;
      }

      .relevant-list {
        margin-top: 18px;
      }
      .relevant-item {
        display: flex;
        gap: 12px;
        padding: 12px 0;
        border-top: 1px solid #eef2f6;
        align-items: center;
      }
      .thumb {
        width: 84px;
        height: 56px;
        border-radius: 8px;
        overflow: hidden;
        flex-shrink: 0;
        background-color: #e2e8f0;
      }
      .thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .ri-body {
        flex: 1;
      }
      .ri-title {
        font-size: 15px;
        color: #0f1724;
        margin-bottom: 6px;
      }
      .ri-meta {
        font-size: 12px;
        color: #64748b;
      }

      /* FOOTER */
      .footer {
        padding: 16px 20px;
        color: #94a3b8;
        font-size: 12px;
        text-align: center;
      }

      /* RESPONSIVE */
      @media screen and (max-width: 520px) {
        .container {
          padding: 14px;
        }
        .thumb {
          width: 68px;
          height: 48px;
        }
        h1 {
          font-size: 18px;
        }
      }
    </style>
  </head>
  <body>
    <span style="display: none; font-size: 1px; color: #f4f6f8; max-height: 0; max-width: 0; opacity: 0; overflow: hidden;">
      ${preheaderText}
    </span>

    <table class="wrapper" cellpadding="0" cellspacing="0" role="presentation" width="100%">
      <tr>
        <td align="center">
          <table class="main" cellpadding="0" cellspacing="0" role="presentation">
            <!-- HEADER -->
            <tr>
              <td style="background: linear-gradient(90deg, #0ea5e9 0%, #7c3aed 100%); padding: 16px 20px;">
                <table width="100%">
                  <tr>
                    <td style="vertical-align: middle">
                      <span style="color: #fff; font-weight: 700; letter-spacing: 0.2px;">Skrati.me</span>
                    </td>
                    <td style="text-align: right; vertical-align: middle">
                      <span style="color: #e6f7ff; font-size: 13px">Breaking • ${breakingArticle.title}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- CONTENT -->
            <tr>
              <td class="container">
                <!-- Breaking article -->
                <a href="${breakingArticle.url}" class="breaking" style="text-decoration: none; color: inherit">
                  <img src="${breakingArticle.image}" alt="${breakingArticle.title}" class="breaking-image" />
                  <div class="breaking-meta" style="padding-top: 8px">
                    <h1>${breakingArticle.title}</h1>
                    <p class="muted" style="margin-bottom: 8px">
                      ${breakingArticle.summary}
                    </p>
                    <div style="display: flex; gap: 8px; align-items: center">
                      <a href="${breakingArticle.url}" class="btn">Read full story</a>
                      <span style="font-size: 13px; color: #64748b">&nbsp; • &nbsp; ${breakingArticle.source}</span>
                    </div>
                  </div>
                </a>

                <!-- Related articles -->
                <div class="relevant-list" aria-labelledby="related-heading" role="region">
                  <h2 id="related-heading" style="font-size: 14px; margin: 18px 0 8px 0; color: #0f1724;">
                    Related stories
                  </h2>
                  ${relatedItemsHTML}
                </div>

                <!-- CTA -->
                <div style="margin-top: 18px; display: flex; gap: 10px; align-items: center;">
                  <a href="https://skrati-me.com" class="btn">View full briefing</a>
                  <a href="https://skrati-me.com/preferences" style="font-size: 13px; color: #64748b; text-decoration: underline;">Manage preferences</a>
                </div>
              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td class="footer" style="background: #f8fafc; border-top: 1px solid #eef2f6">
                <div style="max-width: 560px; margin: 0 auto; padding: 12px 20px">
                  <div style="margin-bottom: 8px">
                    You're receiving this because you subscribed to NewsFlash alerts.
                  </div>
                  <div>
                    <a href="https://skrati-me.com/unsubscribe" style="color: #94a3b8; text-decoration: underline">Unsubscribe</a>
                    •
                    <a href="https://skrati-me.com/privacy" style="color: #94a3b8; text-decoration: underline">Privacy policy</a>
                  </div>
                  <div style="margin-top: 10px; color: #9aa6b2">
                    Skrati.me • Your personalized news briefing
                  </div>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
