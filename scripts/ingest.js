import path from "path";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer";
import { Document } from "langchain/document";
import { fileURLToPath } from "url";

// add website and excel file scraping functionalities
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function parse_docs() {
    const loader = new DirectoryLoader(
        path.join(__dirname, "../data"),
        {
            ".pdf": (filePath) => new PDFLoader(filePath),
            ".docx": (filePath) => new DocxLoader(filePath),
            ".doc": (filePath) => new DocxLoader(filePath, { type: "doc" }),
            //".url": (filePath) => new URLLoader(filePath),
        },
        { recursive: true }
    );
    const docs = await loader.load();

    for (const doc of docs) {
        const fullPath = doc.metadata.source;
        const parts = fullPath.split(path.sep);
        const region = parts[parts.length - 2];
        doc.metadata.region = region;
    }

    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });

    const splitDocs = await splitter.splitDocuments(docs);
    return splitDocs;
}

/*
class URLLoader {
    constructor(filePath) {
        this.filePath = filePath;
    }

    async load() {
        // 1) read the .url file
        const raw = await fs.readFile(this.filePath, "utf-8");

        // 2) parse out the URL= line
        const lines = raw.split(/\r?\n/);
        const urlLine = lines.find((l) => l.trim().toUpperCase().startsWith("URL="));
        if (!urlLine) {
            throw new Error(`No URL= line found in ${this.filePath}`);
        }
        const url = urlLine.replace(/^URL=/i, "").trim();

        // 3) fetch & clean the page with Puppeteer
        const loader = new PuppeteerWebBaseLoader(url, {
            launchOptions: { headless: true },
            gotoOptions: { waitUntil: "domcontentloaded" },
            evaluate: async (page, browser) => {
                const html = await page.evaluate(() => document.body.innerHTML);
                await browser.close();
                return html;
            }
        });

        const text = (await loader.scrape())
            .replace(/<[^>]*>?/gm, "")   // strip tags
            .trim();

        // 4) wrap it in a LangChain Document
        return [
            new Document({
                pageContent: text,
                metadata: { source: url }
            })
        ];
    }
}
*/

