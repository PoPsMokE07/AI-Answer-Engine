// // TODO: Implement the chat API with Groq and web scraping with Cheerio and Puppeteer
// // Refer to the Next.js Docs on how to read the Request body: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
// // Refer to the Groq SDK here on how to use an LLM: https://www.npmjs.com/package/groq-sdk
// // Refer to the Cheerio docs here on how to parse HTML: https://cheerio.js.org/docs/basics/loading
// // Refer to Puppeteer docs here: https://pptr.dev/guides/what-is-puppeteer
import { NextResponse } from "next/server";
import { getGroqResponse } from "@/app/utils/groqClient";
import { scrapeUrl, urlPattern } from "@/app/utils/scraper";


// Main POST function
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, messages } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    console.log("Message received:", message);
    console.log("Messages:", messages);

    // Check if the message contains a URL
    const url = message.match(urlPattern);
    let scrapedContent = "";

    if (url) {
      console.log("URL found:", url[0]);
      const scraperResponse = await scrapeUrl(url[0]);

      if (scraperResponse && scraperResponse.content) {
        scrapedContent = scraperResponse.content;
        console.log("Scraped Content:", scrapedContent);
      } else {
        console.log("Scraper response is undefined or missing 'content'.");
      }
    }

    // Generate the prompt for the LLM
    const userQuery = message.replace(url ? url[0] : "", "").trim();
    const prompt = `
    Answer my question: "${userQuery}"

    Based on the following content:
    <content>
      ${scrapedContent}
    </content>
    `;
    const llmMessages = [...messages, { role: "user", content: prompt }];

    console.log("Generated Prompt:", prompt);

    // Get the response from the Groq LLM
    const response = await getGroqResponse(llmMessages);
    return NextResponse.json({ message: response }, { status: 200 });
  } catch (error) {
    console.error("Error occurred:", error);
    return NextResponse.json({ message: "Error" });
  }
}
