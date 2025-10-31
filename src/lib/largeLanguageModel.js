import {
  GoogleGenAI,
  FunctionCallingConfigMode,
  Type,
  Modality,
} from "@google/genai";
import axios from "axios";
import { QUEST_SYSTEM_PROMPT } from "./quest-ai-system-prompt.js";
import { uploadGeneratedImageToFirebase } from "./firebase.js";

////////////////////////////////////////////////////////////////////////////////
// UTILITY FUNCTIONS
////////////////////////////////////////////////////////////////////////////////

/** Throws if any of the named fields is missing in obj */
function requireParams(obj, ...fields) {
  fields.forEach((f) => {
    if (obj[f] == null) {
      throw new Error(`Missing required parameter: ${f}`);
    }
  });
}

/** Sleep utility for retry delays */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

////////////////////////////////////////////////////////////////////////////////
// CONFIG & STATE
////////////////////////////////////////////////////////////////////////////////

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const QUICK_WHISPER_MCP_API_KEY = process.env.QUICK_WHISPER_MCP_API_KEY;

if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is required");

const GOOGLE_SEARCH_MCP_SERVER =
  "https://mcp-red-xi.vercel.app/api/google";

const GOOGLE_WORKSPACE_SERVER =
  "https://mcp-red-xi.vercel.app/api/google-workspace";

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

////////////////////////////////////////////////////////////////////////////////
// MCP TOOL DEFINITIONS
////////////////////////////////////////////////////////////////////////////////

const mcpTools = [
  {
    name: "googleSearch",
    description:
      "Use this tool to search Google and return relevant results from the web",
    parameters: {
      type: "OBJECT",
      properties: {
        query: { type: "STRING", description: "Search query" },
        num: { type: "NUMBER", description: "Results to return (1–10)" },
        page: { type: "NUMBER", description: "Page number (1-based)" },
        site: { type: "STRING", description: "Limit to a website" },
        language: { type: "STRING", description: "ISO 639-1 code" },
        dateRestrict: {
          type: "STRING",
          description: "e.g., 'm6' = last 6 months",
        },
        exactTerms: { type: "STRING", description: "Exact phrase" },
        resultType: { type: "STRING", description: "news | images" },
      },
      required: ["query"],
    },
    execute: async (params) => {
      requireParams(params, "query");
      const { data } = await axios.post(
        `${GOOGLE_SEARCH_MCP_SERVER}/search`,
        params,
        {
          headers: {
            "x-api-key": QUICK_WHISPER_MCP_API_KEY,
          },
        }
      );
      return data;
    },
  },
  {
    name: "googleImageSearch",
    description:
      "Use this tool to search for images using Google's image search capabilities",
    parameters: {
      type: "OBJECT",
      properties: {
        query: { type: "STRING", description: "Search query for images" },
        num: {
          type: "NUMBER",
          description: "Number of images to return (1-10)",
        },
        page: { type: "NUMBER", description: "Page number (1-based)" },
        imageSize: {
          type: "STRING",
          description: "Filter by image size (e.g., 'large', 'medium', 'icon')",
        },
        imageType: {
          type: "STRING",
          description:
            "Filter by image type (e.g., 'face', 'photo', 'clipart', 'lineart')",
        },
        imageColor: {
          type: "STRING",
          description:
            "Filter by predominant color (e.g., 'red', 'blue', 'green', 'black', 'white')",
        },
        safe: {
          type: "STRING",
          description: "Safe search setting ('active' or 'off')",
        },
      },
      required: ["query"],
    },
    execute: async (params) => {
      requireParams(params, "query");
      const { data } = await axios.post(
        `${GOOGLE_SEARCH_MCP_SERVER}/image-search`,
        params,
        {
          headers: {
            "x-api-key": QUICK_WHISPER_MCP_API_KEY,
          },
        }
      );
      return data;
    },
  },
  {
    name: "extractWebpageContent",
    description:
      "Use this tool to extract and analyze content from a webpage, converting it to readable text",
    parameters: {
      type: "OBJECT",
      properties: {
        url: { type: "STRING", description: "Webpage URL" },
        format: {
          type: "STRING",
          description: "markdown | html | text (default markdown)",
        },
      },
      required: ["url"],
    },
    execute: async (params) => {
      requireParams(params, "url");
      const { data } = await axios.post(
        `${GOOGLE_SEARCH_MCP_SERVER}/extract-content`,
        { url: params.url, format: params.format || "markdown" },
        {
          headers: {
            "x-api-key": QUICK_WHISPER_MCP_API_KEY,
          },
        }
      );
      return data;
    },
  },
  {
    name: "extractMultipleWebpages",
    description:
      "Use this tool to extract and analyze content from multiple webpages in a single request",
    parameters: {
      type: "OBJECT",
      properties: {
        urls: {
          type: "ARRAY",
          items: { type: "STRING" },
          description: "Array of URLs (max 5)",
        },
        format: {
          type: "STRING",
          description: "markdown | html | text (default markdown)",
        },
      },
      required: ["urls"],
    },
    execute: async (params) => {
      requireParams(params, "urls");
      if (!Array.isArray(params.urls) || params.urls.length === 0) {
        throw new Error("urls must be a non-empty array");
      }
      const { data } = await axios.post(
        `${GOOGLE_SEARCH_MCP_SERVER}/extract-multiple`,
        { urls: params.urls, format: params.format || "markdown" },
        {
          headers: {
            "x-api-key": QUICK_WHISPER_MCP_API_KEY,
          },
        }
      );
      return data;
    },
  },
  // Gmail Tools
  {
    name: "gmailSendEmail",
    description: "To send emails via Gmail",
    parameters: {
      type: "OBJECT",
      properties: {
        userId: { type: "STRING", description: "User ID" },
        to: { type: "STRING", description: "Recipient email address" },
        subject: { type: "STRING", description: "Email subject" },
        body: { type: "STRING", description: "Email body content" },
        contentType: {
          type: "STRING",
          description: "Content type (default: text/plain)",
        },
      },
      required: ["userId", "to", "subject", "body"],
    },
    execute: async (params) => {
      requireParams(params, "userId", "to", "subject", "body");
      const { data } = await axios.post(
        `${GOOGLE_WORKSPACE_SERVER}/gmail/send`,
        params,
        {
          headers: {
            "x-api-key": QUICK_WHISPER_MCP_API_KEY,
          },
        }
      );
      return data;
    },
  },
  // Drive Tools
  {
    name: "driveListFiles",
    description: "To search and list files in Google Drive",
    parameters: {
      type: "OBJECT",
      properties: {
        userId: { type: "STRING", description: "User ID" },
        pageSize: {
          type: "NUMBER",
          description: "Number of files to return (default 10)",
        },
        q: { type: "STRING", description: "Search query for filtering files" },
      },
      required: ["userId"],
    },
    execute: async (params) => {
      requireParams(params, "userId");
      const { data } = await axios.get(
        `${GOOGLE_WORKSPACE_SERVER}/drive/files`,
        {
          params: {
            userId: params.userId,
            pageSize: params.pageSize || 10,
            q: params.q || "",
          },
          headers: {
            "x-api-key": QUICK_WHISPER_MCP_API_KEY,
          },
        }
      );
      return data;
    },
  },
  {
    name: "driveGetFile",
    description: "To get specific file metadata",
    parameters: {
      type: "OBJECT",
      properties: {
        userId: { type: "STRING", description: "User ID" },
        fileId: { type: "STRING", description: "Google Drive file ID" },
      },
      required: ["userId", "fileId"],
    },
    execute: async (params) => {
      requireParams(params, "userId", "fileId");
      const { data } = await axios.get(
        `${GOOGLE_WORKSPACE_SERVER}/drive/files/${params.fileId}`,
        {
          params: { userId: params.userId },
          headers: {
            "x-api-key": QUICK_WHISPER_MCP_API_KEY,
          },
        }
      );
      return data;
    },
  },
  // Google Docs Tools
  {
    name: "docsReadDocument",
    description: "To extract text from Google Docs",
    parameters: {
      type: "OBJECT",
      properties: {
        userId: { type: "STRING", description: "User ID" },
        documentId: { type: "STRING", description: "Google Doc ID" },
      },
      required: ["userId", "documentId"],
    },
    execute: async (params) => {
      requireParams(params, "userId", "documentId");
      const { data } = await axios.get(
        `${GOOGLE_WORKSPACE_SERVER}/docs/${params.documentId}`,
        {
          params: { userId: params.userId },
          headers: {
            "x-api-key": QUICK_WHISPER_MCP_API_KEY,
          },
        }
      );
      return data;
    },
  },
  {
    name: "docsCreateDocument",
    description: "To create new Google Docs",
    parameters: {
      type: "OBJECT",
      properties: {
        userId: { type: "STRING", description: "User ID" },
        name: { type: "STRING", description: "Document name" },
        content: { type: "STRING", description: "Initial document content" },
        parentFolderId: {
          type: "STRING",
          description: "Optional parent folder ID",
        },
      },
      required: ["userId", "name"],
    },
    execute: async (params) => {
      requireParams(params, "userId", "name");
      const { data } = await axios.post(
        `${GOOGLE_WORKSPACE_SERVER}/docs/create`,
        params,
        {
          headers: {
            "x-api-key": QUICK_WHISPER_MCP_API_KEY,
          },
        }
      );
      return data;
    },
  },
  {
    name: "docsUpdateDocument",
    description: "To edit Google Doc content",
    parameters: {
      type: "OBJECT",
      properties: {
        userId: { type: "STRING", description: "User ID" },
        documentId: { type: "STRING", description: "Google Doc ID" },
        requests: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            description: "Document update request object",
          },
        },
      },
      required: ["userId", "documentId", "requests"],
    },
    execute: async (params) => {
      requireParams(params, "userId", "documentId", "requests");
      const { data } = await axios.patch(
        `${GOOGLE_WORKSPACE_SERVER}/docs/${params.documentId}`,
        params,
        {
          headers: {
            "x-api-key": QUICK_WHISPER_MCP_API_KEY,
          },
        }
      );
      return data;
    },
  },
  // Google Slides Tools
  {
    name: "slidesCreatePresentation",
    description: "To create presentations with slides",
    parameters: {
      type: "OBJECT",
      properties: {
        userId: { type: "STRING", description: "User ID" },
        title: { type: "STRING", description: "Presentation title" },
        slidesData: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              title: { type: "STRING" },
              subtitle: { type: "STRING" },
              caption: { type: "STRING" },
              imageUrl: { type: "STRING" },
              backgroundColor: { type: "OBJECT" },
              titleStyle: { type: "OBJECT" },
              subtitleStyle: { type: "OBJECT" },
              captionStyle: { type: "OBJECT" },
            },
          },
          description: "Array of slide data objects",
        },
      },
      required: ["userId", "title"],
    },
    execute: async (params) => {
      requireParams(params, "userId", "title");
      const { data } = await axios.post(
        `${GOOGLE_WORKSPACE_SERVER}/slides/create`,
        params,
        {
          headers: {
            "x-api-key": QUICK_WHISPER_MCP_API_KEY,
          },
        }
      );
      return data;
    },
  },
  {
    name: "slidesReadPresentation",
    description: "To read existing presentation content",
    parameters: {
      type: "OBJECT",
      properties: {
        userId: { type: "STRING", description: "User ID" },
        presentationId: { type: "STRING", description: "Presentation ID" },
      },
      required: ["userId", "presentationId"],
    },
    execute: async (params) => {
      requireParams(params, "userId", "presentationId");
      const { data } = await axios.get(
        `${GOOGLE_WORKSPACE_SERVER}/slides/${params.presentationId}`,
        {
          params: { userId: params.userId },
          headers: {
            "x-api-key": QUICK_WHISPER_MCP_API_KEY,
          },
        }
      );
      return data;
    },
  },
  // Google Sheets Tools
  {
    name: "sheetsCreateSpreadsheet",
    description: "To create a spreadsheet with sheets",
    parameters: {
      type: "OBJECT",
      properties: {
        userId: { type: "STRING", description: "User ID" },
        title: { type: "STRING", description: "Document Title" },
        sheets: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              title: { type: "STRING" },
              data: {
                type: "ARRAY",
                items: { type: "ARRAY", items: { type: "STRING" } },
              },
            },
          },
        },
      },
      required: ["userId"],
    },
    execute: async (params) => {
      requireParams(params, "userId");
      const { data } = await axios.post(
        `${GOOGLE_WORKSPACE_SERVER}/sheets/create`,
        params,
        {
          headers: {
            "x-api-key": QUICK_WHISPER_MCP_API_KEY,
          },
        }
      );
      return data;
    },
  },
  {
    name: "sheetsReadSpreadsheet",
    description: "To read data from spreadsheets",
    parameters: {
      type: "OBJECT",
      properties: {
        userId: { type: "STRING", description: "User ID" },
        spreadsheetId: { type: "STRING", description: "Spreadsheet ID" },
        range: {
          type: "STRING",
          description: "Cell range (e.g., 'Sheet1!A1:Z1000')",
        },
      },
      required: ["userId", "spreadsheetId"],
    },
    execute: async (params) => {
      requireParams(params, "userId", "spreadsheetId");
      const { data } = await axios.get(
        `${GOOGLE_WORKSPACE_SERVER}/sheets/${params.spreadsheetId}`,
        {
          params: {
            userId: params.userId,
            range: params.range,
          },
          headers: {
            "x-api-key": QUICK_WHISPER_MCP_API_KEY,
          },
        }
      );
      return data;
    },
  },
  {
    name: "sheetsUpdateSpreadsheet",
    description:
      "To update a Google Sheet with new data, properties, and/or title",
    parameters: {
      type: "OBJECT",
      properties: {
        userId: {
          type: "STRING",
          description: "User ID required for authentication",
        },
        spreadsheetId: {
          type: "STRING",
          description: "The ID of the spreadsheet to update",
        },
        title: {
          type: "STRING",
          description: "Optional new title for the spreadsheet",
        },
        sheets: {
          type: "ARRAY",
          description: "Array of sheets to update or create",
          items: {
            type: "OBJECT",
            properties: {
              title: {
                type: "STRING",
                description: "The title of the sheet to update or create",
              },
              properties: {
                type: "OBJECT",
                description: "Sheet properties to update",
                properties: {
                  gridProperties: {
                    type: "OBJECT",
                    properties: {
                      rowCount: { type: "INTEGER" },
                      columnCount: { type: "INTEGER" },
                      frozenRowCount: { type: "INTEGER" },
                      frozenColumnCount: { type: "INTEGER" },
                    },
                  },
                  tabColor: {
                    type: "OBJECT",
                    properties: {
                      red: { type: "NUMBER" },
                      green: { type: "NUMBER" },
                      blue: { type: "NUMBER" },
                    },
                  },
                  hidden: { type: "BOOLEAN" },
                },
              },
              data: {
                type: "ARRAY",
                description: "2D array of values to update in the sheet",
                items: {
                  type: "ARRAY",
                  items: {
                    type: ["STRING", "NUMBER"],
                  },
                },
              },
            },
          },
        },
      },
      required: ["userId", "spreadsheetId"],
    },
    execute: async (params) => {
      requireParams(params, "userId", "spreadsheetId");
      const { data } = await axios.patch(
        `${GOOGLE_WORKSPACE_SERVER}/sheets/${params.spreadsheetId}`,
        params,
        {
          headers: {
            "x-api-key": QUICK_WHISPER_MCP_API_KEY,
          },
        }
      );
      return data;
    },
  },
  // Google Forms Tools
  {
    name: "formsCreateForm",
    description: "To create forms with questions",
    parameters: {
      type: "OBJECT",
      properties: {
        userId: { type: "STRING", description: "User ID" },
        title: { type: "STRING", description: "Form title" },
        questions: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              title: { type: "STRING" },
              type: { type: "STRING" },
              required: { type: "BOOLEAN" },
              options: { type: "ARRAY", items: { type: "STRING" } },
              shuffle: { type: "BOOLEAN" },
            },
          },
        },
      },
      required: ["userId", "title"],
    },
    execute: async (params) => {
      requireParams(params, "userId", "title");
      const { data } = await axios.post(
        `${GOOGLE_WORKSPACE_SERVER}/forms/create`,
        params,
        {
          headers: {
            "x-api-key": QUICK_WHISPER_MCP_API_KEY,
          },
        }
      );
      return data;
    },
  },

  {
    name: "formsReadForm",
    description: "To get form structure and responses",
    parameters: {
      type: "OBJECT",
      properties: {
        userId: { type: "STRING", description: "User ID" },
        formId: { type: "STRING", description: "Form ID" },
      },
      required: ["userId", "formId"],
    },
    execute: async (params) => {
      requireParams(params, "userId", "formId");
      const { data } = await axios.get(
        `${GOOGLE_WORKSPACE_SERVER}/forms/${params.formId}`,
        {
          params: { userId: params.userId },
          headers: {
            "x-api-key": QUICK_WHISPER_MCP_API_KEY,
          },
        }
      );
      return data;
    },
  },

  {
    name: "formsUpdateForm",
    description: "To update a Google Form",
    parameters: {
      type: "OBJECT",
      properties: {
        userId: { type: "STRING", description: "User ID" },
        formId: { type: "STRING", description: "Form ID" },
        requests: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            description: "Form update request object",
          },
        },
      },
      required: ["userId", "formId", "requests"],
    },
    execute: async (params) => {
      requireParams(params, "userId", "formId", "requests");
      const { data } = await axios.patch(
        `${GOOGLE_WORKSPACE_SERVER}/forms/${params.formId}`,
        params,
        {
          headers: {
            "x-api-key": QUICK_WHISPER_MCP_API_KEY,
          },
        }
      );
      return data;
    },
  },
  // Google Calendar Tools
  {
    name: "calendarGetEvents",
    description: "To retrieve upcoming calendar events",
    parameters: {
      type: "OBJECT",
      properties: {
        userId: { type: "STRING", description: "User ID" },
        calendarId: {
          type: "STRING",
          description: "Calendar ID (default: primary)",
        },
        maxResults: {
          type: "NUMBER",
          description: "Maximum number of events to return",
        },
      },
      required: ["userId"],
    },
    execute: async (params) => {
      requireParams(params, "userId");
      const { data } = await axios.get(
        `${GOOGLE_WORKSPACE_SERVER}/calendar/get-events`,
        {
          params: {
            userId: params.userId,
            calendarId: params.calendarId,
            maxResults: params.maxResults,
          },
          headers: {
            "x-api-key": QUICK_WHISPER_MCP_API_KEY,
          },
        }
      );
      return data;
    },
  },
  {
    name: "calendarCreateEvent",
    description: "To create new calendar events",
    parameters: {
      type: "OBJECT",
      properties: {
        userId: { type: "STRING", description: "User ID" },
        calendarId: {
          type: "STRING",
          description: "Calendar ID (default: primary)",
        },
        event: {
          type: "OBJECT",
          description: "Event details object",
          properties: {
            summary: { type: "STRING" },
            description: { type: "STRING" },
            start: { type: "OBJECT" },
            end: { type: "OBJECT" },
            attendees: { type: "ARRAY", items: { type: "OBJECT" } },
          },
        },
      },
      required: ["userId", "event"],
    },
    execute: async (params) => {
      requireParams(params, "userId", "event");
      const { data } = await axios.post(
        `${GOOGLE_WORKSPACE_SERVER}/calendar/create-event`,
        params,
        {
          headers: {
            "x-api-key": QUICK_WHISPER_MCP_API_KEY,
          },
        }
      );
      return data;
    },
  },
  {
    name: "calendarUpdateEvent",
    description: "To update a calendar event",
    parameters: {
      type: "OBJECT",
      properties: {
        userId: { type: "STRING", description: "User ID" },
        calendarId: {
          type: "STRING",
          description: "Calendar ID (default: primary)",
        },
        eventId: { type: "STRING", description: "Event ID to update" },
        event: {
          type: "OBJECT",
          description: "Updated event details",
        },
      },
      required: ["userId", "eventId", "event"],
    },
    execute: async (params) => {
      requireParams(params, "userId", "eventId", "event");
      const { data } = await axios.patch(
        `${GOOGLE_WORKSPACE_SERVER}/calendar/events/${params.eventId}`,
        {
          userId: params.userId,
          calendarId: params.calendarId,
          event: params.event,
        },
        {
          headers: {
            "x-api-key": QUICK_WHISPER_MCP_API_KEY,
          },
        }
      );
      return data;
    },
  },

  //USPLASH TOOLS
  {
    name: "unsplashSearchImages",
    description: "To find images for presentations/documents",
    parameters: {
      type: "OBJECT",
      properties: {
        userId: { type: "STRING", description: "User ID" },
        searchTerm: { type: "STRING", description: "Image search term" },
        per_page: {
          type: "NUMBER",
          description:
            "Number of results you want for your search term, default is 1",
        },
      },
      required: ["userId", "searchTerm", "per_page"],
    },
    execute: async (params) => {
      requireParams(params, "userId", "searchTerm", "per_page");

      const { data } = await axios.get(
        `${GOOGLE_WORKSPACE_SERVER}/unsplash/search`,
        {
          params,
          headers: {
            "x-api-key": QUICK_WHISPER_MCP_API_KEY,
          },
        }
      );

      return data;
    },
  },
  {
    name: "generateImage",
    description:
      "Use this tool to generate images using Imagen 4.0. The generated image will be saved to Firebase storage.",
    parameters: {
      type: "OBJECT",
      properties: {
        prompt: {
          type: "STRING",
          description: "Detailed description of the image to generate",
        },
        userId: {
          type: "STRING",
          description: "User ID for storing the generated image",
        },
        userName: { type: "STRING", description: "User's name for context" },
        userEmail: { type: "STRING", description: "User's email for context" },
      },
      required: ["prompt", "userId"],
    },
    execute: async (params) => {
      requireParams(params, "prompt", "userId");

      try {
        // Initialize the Imagen model using the same API key
        const genAI = new GoogleGenAI(GEMINI_API_KEY);

        // Generate the image using the correct API format
        const response = await genAI.models.generateImages({
          model: "imagen-4.0-generate-preview-06-06",
          prompt: params.prompt,
          config: {
            numberOfImages: 1,
          },
        });

        // Validate response structure
        if (!response) {
          throw new Error("No response received from image generation API");
        }

        if (
          !response.generatedImages ||
          !Array.isArray(response.generatedImages) ||
          response.generatedImages.length === 0
        ) {
          throw new Error("No generated images found in API response");
        }

        const firstImage = response.generatedImages[0];
        if (!firstImage) {
          throw new Error("First generated image is undefined");
        }

        // Check different possible response structures
        let imageBytes;
        if (firstImage.image && firstImage.image.imageBytes) {
          // Original expected structure
          imageBytes = firstImage.image.imageBytes;
        } else if (firstImage.imageBytes) {
          // Alternative structure - image data directly on the object
          imageBytes = firstImage.imageBytes;
        } else if (firstImage.data) {
          // Another possible structure
          imageBytes = firstImage.data;
        } else {
          throw new Error("Could not find image data in the expected format");
        }

        if (!imageBytes) {
          throw new Error("Image bytes are empty or undefined");
        }

        // Convert base64 to buffer for Firebase upload
        const buffer = Buffer.from(imageBytes, "base64");

        // Generate a unique filename
        const timestamp = Date.now();
        const sanitizedPrompt = params.prompt
          .slice(0, 50)
          .replace(/[^a-zA-Z0-9]/g, "_");
        const filename = `${timestamp}_${sanitizedPrompt}.png`;
        const filePath = `${params.userId}/generated_images/${filename}`;

        // Upload to Firebase and get direct URL string
        const imageUrl = await uploadGeneratedImageToFirebase(
          buffer,
          filePath,
          "image/png"
        );

        // Return a properly structured response
        return {
          success: true,
          url: imageUrl,
          type: "image/png",
          displayName: `Generated: ${params.prompt.slice(0, 50)}...png`,
          size: buffer.length,
          category: "image",
          isGenerated: true,
          prompt: params.prompt,
          description: params.prompt,
        };
      } catch (error) {
        // Provide more specific error messages based on the error type
        if (
          error.message.includes("No response received") ||
          error.message.includes("No generated images found") ||
          error.message.includes("Could not find image data")
        ) {
          throw new Error(
            `Image generation API error: ${error.message}. Please try again.`
          );
        } else if (error.message.includes("Invalid response structure")) {
          throw new Error(
            "The image generation service returned an unexpected response format. Please try again."
          );
        } else if (
          error.name === "TypeError" &&
          error.message.includes("Cannot read properties")
        ) {
          throw new Error(
            "Image generation failed due to API response format changes. Please try again."
          );
        } else {
          throw new Error(`Failed to generate image: ${error.message}`);
        }
      }
    },
  },
  {
    name: "generateImageWithReference",
    description:
      "Use this tool to generate images using Gemini 2.0 Flash with an uploaded image as reference. The generated image will be saved to Firebase storage. This tool should be used when the user has uploaded an image and wants to generate a new image based on it.",
    parameters: {
      type: "OBJECT",
      properties: {
        prompt: {
          type: "STRING",
          description:
            "Detailed description of the image to generate based on the reference image",
        },
        referenceImageUrl: {
          type: "STRING",
          description:
            "URL of the uploaded reference image from Firebase Storage",
        },
        referenceImageMimeType: {
          type: "STRING",
          description:
            "MIME type of the reference image (e.g., 'image/jpeg', 'image/png')",
        },
        userId: {
          type: "STRING",
          description: "User ID for storing the generated image",
        },
        userName: { type: "STRING", description: "User's name for context" },
        userEmail: { type: "STRING", description: "User's email for context" },
      },
      required: [
        "prompt",
        "referenceImageUrl",
        "referenceImageMimeType",
        "userId",
      ],
    },
    execute: async (params) => {
      requireParams(
        params,
        "prompt",
        "referenceImageUrl",
        "referenceImageMimeType",
        "userId"
      );

      try {
        // Initialize the Gemini 2.0 Flash model for image generation with reference
        const genAI = new GoogleGenAI(GEMINI_API_KEY);

        // Fetch the reference image from Firebase Storage
        const imageResponse = await fetch(params.referenceImageUrl);
        if (!imageResponse.ok) {
          throw new Error(
            `Failed to fetch reference image: ${imageResponse.statusText}`
          );
        }

        const imageBuffer = await imageResponse.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString("base64");

        // Prepare the content parts for the model
        const contents = [
          { text: params.prompt },
          {
            inlineData: {
              mimeType: params.referenceImageMimeType,
              data: base64Image,
            },
          },
        ];

        // Generate the image using Gemini 2.0 Flash with image generation and reference
        const response = await genAI.models.generateContent({
          model: "gemini-2.0-flash-preview-image-generation",
          contents: contents,
          config: {
            responseModalities: [Modality.TEXT, Modality.IMAGE],
          },
        });

        // Validate response structure
        if (
          !response ||
          !response.candidates ||
          response.candidates.length === 0
        ) {
          throw new Error("No response received from image generation API");
        }

        const candidate = response.candidates[0];
        if (!candidate || !candidate.content || !candidate.content.parts) {
          throw new Error(
            "Invalid response structure from image generation API"
          );
        }

        // Find the generated image in the response parts
        let generatedImageData = null;
        let responseText = "";

        for (const part of candidate.content.parts) {
          if (part.text) {
            responseText += part.text;
          } else if (part.inlineData && part.inlineData.data) {
            generatedImageData = part.inlineData.data;
          }
        }

        if (!generatedImageData) {
          throw new Error("No generated image found in API response");
        }

        // Convert base64 to buffer for Firebase upload
        const buffer = Buffer.from(generatedImageData, "base64");

        // Generate a unique filename
        const timestamp = Date.now();
        const sanitizedPrompt = params.prompt
          .slice(0, 50)
          .replace(/[^a-zA-Z0-9]/g, "_");
        const filename = `${timestamp}_ref_${sanitizedPrompt}.png`;
        const filePath = `${params.userId}/generated_images/${filename}`;

        // Upload to Firebase and get direct URL string
        const imageUrl = await uploadGeneratedImageToFirebase(
          buffer,
          filePath,
          "image/png"
        );

        // Return a properly structured response
        return {
          success: true,
          url: imageUrl,
          type: "image/png",
          displayName: `Generated with reference: ${params.prompt.slice(
            0,
            50
          )}...png`,
          size: buffer.length,
          category: "image",
          isGenerated: true,
          isGeneratedWithReference: true,
          prompt: params.prompt,
          referenceImageUrl: params.referenceImageUrl,
          description: `Generated image with reference: ${params.prompt}`,
          responseText:
            responseText || "Image generated successfully with reference",
        };
      } catch (error) {
        console.error("Error in generateImageWithReference:", error);

        // Provide more specific error messages based on the error type
        if (error.message.includes("Failed to fetch reference image")) {
          throw new Error(
            `Could not access the reference image: ${error.message}. Please ensure the image is properly uploaded.`
          );
        } else if (
          error.message.includes("No response received") ||
          error.message.includes("No generated image found")
        ) {
          throw new Error(
            `Image generation API error: ${error.message}. Please try again with a different prompt or reference image.`
          );
        } else if (error.message.includes("Invalid response structure")) {
          throw new Error(
            "The image generation service returned an unexpected response format. Please try again."
          );
        } else {
          throw new Error(
            `Failed to generate image with reference: ${error.message}`
          );
        }
      }
    },
  },
  {
    name: "getRecentGeneratedImages",
    description:
      "Use this tool to retrieve the last 5 generated images for a user from their current chat session. This allows you to reference or modify previously generated images in the conversation.",
    parameters: {
      type: "OBJECT",
      properties: {
        userId: {
          type: "STRING",
          description: "User ID to find their recent generated images",
        },
        userName: { type: "STRING", description: "User's name for context" },
        limit: {
          type: "NUMBER",
          description:
            "Number of recent images to retrieve (default: 5, max: 10)",
        },
      },
      required: ["userId"],
    },
    execute: async (params) => {
      requireParams(params, "userId");

      const limit = Math.min(params.limit || 5, 10); // Default 5, max 10

      try {
        // Import Firebase client functions
        const { initializeApp } = await import("firebase/app");
        const { getStorage, ref, listAll, getDownloadURL, getMetadata } =
          await import("firebase/storage");

        // Initialize Firebase client
        const firebaseConfig = {
          apiKey: process.env.FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
          messagingSenderId:
            process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        };

        const app = initializeApp(firebaseConfig);
        const storage = getStorage(app);

        const folderPath = `${params.userId}/generated_images/`;
        const folderRef = ref(storage, folderPath);

        // List all files in the user's generated images folder
        const listResult = await listAll(folderRef);
        const files = listResult.items;

        if (files.length === 0) {
          throw new Error("No generated images found for this user");
        }

        // Sort files by creation time (newest first)
        // The filename contains timestamp, so we can sort by name
        const sortedFiles = files.sort((a, b) => {
          const aTime = a.name.split("_")[0];
          const bTime = b.name.split("_")[0];
          return parseInt(bTime) - parseInt(aTime);
        });

        // Get the most recent images (up to limit)
        const recentFiles = sortedFiles.slice(0, limit);

        // Process each file to get URLs and metadata
        const imagePromises = recentFiles.map(async (file) => {
          try {
            // Get the download URL
            const url = await getDownloadURL(file);

            // Extract metadata from filename
            const filename = file.name;
            const timestamp = filename.split("_")[0];
            const promptPart = filename
              .split("_")
              .slice(1)
              .join("_")
              .replace(".png", "");

            // Get file metadata
            const metadata = await getMetadata(file);

            return {
              success: true,
              url: url,
              type: "image/png",
              displayName: `Generated: ${promptPart}...png`,
              size: parseInt(metadata.size),
              category: "image",
              isGenerated: true,
              timestamp: parseInt(timestamp),
              createdAt: new Date(parseInt(timestamp)).toISOString(),
              description: `Generated image from ${new Date(
                parseInt(timestamp)
              ).toLocaleString()}`,
              prompt: promptPart.replace(/_/g, " "), // Convert underscores back to spaces for readability
              filename: filename,
            };
          } catch (fileError) {
            console.error(`Error processing file ${file.name}:`, fileError);
            return null; // Skip files that can't be processed
          }
        });

        const images = await Promise.all(imagePromises);
        const validImages = images.filter((img) => img !== null);

        if (validImages.length === 0) {
          throw new Error("No valid generated images could be retrieved");
        }

        return {
          success: true,
          images: validImages,
          count: validImages.length,
          totalFound: files.length,
          description: `Retrieved ${validImages.length} most recent generated images`,
        };
      } catch (error) {
        if (error.message.includes("No generated images found")) {
          throw new Error(
            "No previously generated images found for this user."
          );
        } else if (error.message.includes("No valid generated images")) {
          throw new Error(
            "Found generated images but could not retrieve their data."
          );
        } else {
          throw new Error(
            `Failed to retrieve recent generated images: ${error.message}`
          );
        }
      }
    },
  },
];

////////////////////////////////////////////////////////////////////////////////
// CORE HELPERS
////////////////////////////////////////////////////////////////////////////////

export async function executeMcpTool(name, args) {
  const tool = mcpTools.find((t) => t.name === name);
  if (!tool) throw new Error(`No tool named ${name}`);

  try {
    console.log("\n=== TOOL EXECUTION START ===");
    console.log("Tool Name:", name);
    console.log("Arguments:", JSON.stringify(args, null, 2));

    const result = await tool.execute(args);

    console.log("\n=== TOOL EXECUTION RESULT ===");
    console.log(JSON.stringify(result, null, 2));
    console.log("=== TOOL EXECUTION END ===\n");

    return result;
  } catch (error) {
    console.error("\n=== TOOL EXECUTION ERROR ===");
    console.error("Tool:", name);
    console.error("Error:", error.message);
    console.error("=== ERROR END ===\n");
    throw error;
  }
}

////////////////////////////////////////////////////////////////////////////////
// FUNCTION-CALL PROCESSING & MULTI-STEP LOOP
////////////////////////////////////////////////////////////////////////////////

function extractAssistantText(llmResponse) {
  let textBlock = "";
  try {
    // Get the first candidate, first part
    textBlock = llmResponse.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textBlock) return "";

    // Remove markdown wrapper (```json ... ```)
    const match = textBlock.match(/```json\s*([\s\S]+?)\s*```/);
    const jsonStr = match ? match[1] : textBlock;

    // Parse JSON
    const parsed = JSON.parse(jsonStr);

    // Return payload.text or whole parsed text
    return parsed.payload?.text || parsed.text || "";
  } catch (err) {
    // fallback: just return raw block
    return textBlock || "";
  }
}

// Model-based assessment to determine if the answer announces intent or needs continuation
function extractJsonObject(text) {
  if (!text) return null;
  // Try to extract the first JSON object
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}

async function assessAnswerQuality(userMessageContent, assistantAnswer) {
  try {
    const prompt = `You will receive a user's request and an assistant's drafted answer. Determine if the answer is merely announcing intent to perform an action (e.g., \"I will now summarize\", \"Let me check\") or otherwise not providing the final actionable result. If so, needsContinuation should be true.

Return strict JSON with the following fields only:
{"needsContinuation": boolean, "cleanedAnswer": string}

Rules:
- cleanedAnswer must remove any announcement/placeholder prefaces and include only substantive content present in the drafted answer. If no substantive content is present, cleanedAnswer should be an empty string.

User request:\n${userMessageContent}\n\nAssistant drafted answer:\n${assistantAnswer}`;

    const resp = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    const raw = resp?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonStr = extractJsonObject(raw) || raw;
    const parsed = JSON.parse(jsonStr);
    return {
      needsContinuation: !!parsed.needsContinuation,
      cleanedAnswer:
        typeof parsed.cleanedAnswer === "string" ? parsed.cleanedAnswer : "",
    };
  } catch (e) {
    return { needsContinuation: false, cleanedAnswer: assistantAnswer || "" };
  }
}

function extractThoughtsAndFunctionCall(response) {
  let textBlock = null;

  // Try multiple levels for maximum robustness
  if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
    textBlock = response.candidates[0].content.parts[0].text;
  } else if (response?.content?.parts?.[0]?.text) {
    textBlock = response.content.parts[0].text;
  } else if (typeof response === "string") {
    textBlock = response;
  }

  if (!textBlock) {
    // Check if there's a native function call in the response
    if (response?.functionCalls && response.functionCalls.length > 0) {
      return {
        thoughts: null,
        function_call: response.functionCalls[0],
      };
    }
    return {};
  }

  // Remove markdown if present
  const match = textBlock.match(/```json\s*([\s\S]+?)\s*```/);
  const jsonStr = match ? match[1] : textBlock;

  try {
    const parsed = JSON.parse(jsonStr);
    // Return both thoughts and the full function_call object (if present)
    return {
      thoughts: parsed.thoughts || null,
      function_call: parsed.payload?.function_call || null,
    };
  } catch (e) {
    // If JSON parsing fails, check if there's a native function call
    if (response?.functionCalls && response.functionCalls.length > 0) {
      return {
        thoughts: null,
        function_call: response.functionCalls[0],
      };
    }
    return {};
  }
}

async function sendWithRetry(
  chat,
  userMessageContent,
  userFiles = null,
  { retries = 3, initialDelayMs = 500, backoffFactor = 2 } = {}
) {
  let delay = initialDelayMs;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Build message parts
      const parts = [{ text: userMessageContent }];

      // Add files if present (images inline, others by URI)
      if (userFiles && Array.isArray(userFiles)) {
        for (const file of userFiles) {
          try {
            // Unified attachment shape support
            // Expected current shape from ChatInput: { url, type (MIME), size, category, displayName, geminiFile? }
            //  - Images: inlineData (base64 of file.url)
            //  - Non-images: fileData using geminiFile.uri

            const isImage = file?.category === "image" || file?.type?.startsWith?.("image/");
            const hasGeminiUri = !!(file?.geminiFile?.uri);
            const firebaseUrl = file?.url; // Download URL from Firebase
            const mimeType = file?.type || file?.mimeType || (isImage ? "image/*" : undefined);

            if (isImage && firebaseUrl) {
              // Fetch image bytes and embed inline
              const response = await fetch(firebaseUrl);
              const arrayBuffer = await response.arrayBuffer();
              const base64Data = Buffer.from(arrayBuffer).toString("base64");

              parts.push({
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data,
                },
              });
            } else if (hasGeminiUri) {
              // Use Gemini File API URI for docs, sheets, slides, pdf, audio, video
              parts.push({
                fileData: {
                  mimeType: mimeType,
                  fileUri: file.geminiFile.uri,
                },
              });
            } else if (firebaseUrl) {
              // Fallback: if for some reason gemini upload failed, at least provide the URL contextually
              parts.push({
                text: `Attachment available: ${file.displayName || "file"} (${mimeType || "unknown"}) -> ${firebaseUrl}`,
              });
            }
          } catch (error) {
            console.error("Error processing file in sendWithRetry:", error);
            // Continue without this file if processing fails
          }
        }
      }

      // try sending
      return await chat.sendMessage({ message: { parts } });
    } catch (err) {
      const isServer500 =
        // if it's a GenAI ServerError and status is 500…
        (err instanceof ServerError && err.error?.code === 500) ||
        // or generic HTTP error with status 500
        err.response?.status === 500;

      if (!isServer500 || attempt === retries) {
        // not retryable or out of attempts → rethrow
        throw err;
      }
      // Retry on 500 error
      await sleep(delay);
      delay *= backoffFactor;
    }
  }
}

async function handleUserQuery(chat, userMessageContent, userFiles = null) {
  let response;
  let safetyCounter = 0;
  let lastFunctionResult = null;
  let lastFunctionName = null;

  try {
    console.log("\n=== STARTING NEW USER QUERY ===");
    console.log("User Message:", userMessageContent);
    if (userFiles) {
      console.log("Attached Files:", JSON.stringify(userFiles, null, 2));
    }

    response = await sendWithRetry(chat, userMessageContent, userFiles, {
      retries: 5,
      initialDelayMs: 1000,
      backoffFactor: 2,
    });
  } catch (error) {
    console.error("Initial Response Error:", error.message);
    response = await chat.sendMessage({ message: "Please try again" });
  }

  try {
    while (
      (response.functionCalls?.length > 0 ||
        extractThoughtsAndFunctionCall(response).function_call) &&
      safetyCounter < 5
    ) {
      const { thoughts, function_call } =
        extractThoughtsAndFunctionCall(response);

      console.log("\n=== AI PROCESSING ===");
      if (thoughts) {
        console.log("AI Thoughts:", JSON.stringify(thoughts, null, 2));
      }

      const functionCallToExecute =
        function_call || (response.functionCalls && response.functionCalls[0]);

      if (functionCallToExecute) {
        console.log("\n=== FUNCTION CALL DETECTED ===");
        console.log("Function Name:", functionCallToExecute.name);

        const functionName = functionCallToExecute.name;
        lastFunctionName = functionName;

        let args;
        if (functionCallToExecute.arguments) {
          args =
            typeof functionCallToExecute.arguments === "string"
              ? JSON.parse(functionCallToExecute.arguments)
              : functionCallToExecute.arguments;
        } else if (functionCallToExecute.args) {
          args =
            typeof functionCallToExecute.args === "string"
              ? JSON.parse(functionCallToExecute.args)
              : functionCallToExecute.args;
        } else if (functionCallToExecute.parameters) {
          args =
            typeof functionCallToExecute.parameters === "string"
              ? JSON.parse(functionCallToExecute.parameters)
              : functionCallToExecute.parameters;
        } else {
          args = {};
        }

        console.log("Parsed Arguments:", JSON.stringify(args, null, 2));

        const result = await executeMcpTool(functionName, args);
        lastFunctionResult = result;

        try {
          response = await chat.sendMessage({
            message: {
              functionResponse: {
                name: functionName,
                response: { result },
              },
            },
          });
          console.log("\n=== FUNCTION RESPONSE SENT TO AI ===");
        } catch (error) {
          console.error("\n=== FUNCTION RESPONSE ERROR ===");
          console.error("Error:", error.message);
          break;
        }
      } else {
        console.log("\n=== NO FUNCTION CALL FOUND ===");
        break;
      }

      safetyCounter++;
      console.log("Safety Counter:", safetyCounter);
    }
  } catch (error) {
    console.error("\n=== PROCESSING ERROR ===");
    console.error("Error:", error.message);
  }

  const finalAnswer = extractAssistantText(response);
  console.log("\n=== FINAL RESPONSE ===");
  console.log("Has Answer:", !!finalAnswer);

  // If we still don't have a response, try to construct one from the results
  if (!finalAnswer && safetyCounter > 0) {
    try {
      // Try one more time with explicit instructions
      response = await chat.sendMessage({
        message:
          "Based on the data we've gathered, please summarize the results in a user-friendly way.",
      });
      const retryAnswer = extractAssistantText(response);
      if (retryAnswer) {
        return retryAnswer;
      }

      // If we still don't have an answer but have function results, try to format them directly
      if (lastFunctionResult) {
        return formatFunctionResultsDirectly(
          lastFunctionName,
          lastFunctionResult,
          userMessageContent
        );
      }

      return "I've analyzed your data, but I'm having trouble formatting the response. Please try your question again.";
    } catch (error) {
      // Try to format the results directly if we have them
      if (lastFunctionResult) {
        return formatFunctionResultsDirectly(
          lastFunctionName,
          lastFunctionResult,
          userMessageContent
        );
      }

      return "I found some information but had trouble formatting it. Please try asking your question again.";
    }
  }

  // Ask the model to self-assess whether continuation is required
  const assessment = await assessAnswerQuality(userMessageContent, finalAnswer);
  if (assessment.needsContinuation) {
    try {
      const continuation = await chat.sendMessage({
        message:
          "Do not announce intent. Immediately perform the requested task and return the final result now. Use tools silently if needed. Reply only with the final result.",
      });
      const continuedAnswer = extractAssistantText(continuation);
      const cleaned = (await assessAnswerQuality(
        userMessageContent,
        continuedAnswer
      )).cleanedAnswer;
      if (cleaned) return cleaned;
    } catch (e) {
      // Fall through to cleaned original
    }
    if (assessment.cleanedAnswer) return assessment.cleanedAnswer;
  }

  return (
    assessment.cleanedAnswer ||
    "I apologize, but I couldn't process your request. Please try again."
  );
}

// Helper function to format function results directly when the LLM fails
function formatFunctionResultsDirectly(functionName, result, userQuery) {
  if (!functionName || !result) {
    return "I found some information, but couldn't format it properly. Please try again.";
  }

  try {
    // Handle different function types with custom formatting
    if (functionName === "googleSearch") {
      // Format google search results
      if (result.results && result.results.length > 0) {
        const sources = result.results.map((item) => ({
          title: item.title,
          url: item.link,
          snippet: item.snippet,
          image: item.pagemap?.cse_image?.[0]?.src || null,
        }));

        // Return structured data for the LLM to process
        return {
          sources: sources,
        };
      }
    } else if (functionName === "googleImageSearch") {
      // Format google image search results
      if (result.images && result.images.length > 0) {
        const images = result.images.map((item) => ({
          url: item.image.url,
          title: item.title,
          thumbnail: item.image.thumbnailLink || item.image.url,
          context: item.context,
        }));

        // Let the LLM handle the natural conversation
        const response = {
          images: images,
        };

        // Add the response to the conversation for the LLM to process
        return response;
      }
    } else if (functionName === "extractWebpageContent") {
      // Format webpage content
      if (result.content) {
        return `Here's the information I extracted:\n\n${result.content.substring(
          0,
          500
        )}${result.content.length > 500 ? "..." : ""}`;
      }
    } else if (functionName === "extractMultipleWebpages") {
      // Format multiple webpage content
      if (result.contents && Array.isArray(result.contents)) {
        let response = `Here's the information I extracted from multiple sources:\n\n`;
        result.contents.forEach((content, index) => {
          response += `Source ${index + 1}: ${
            content.url || "Unknown source"
          }\n`;
          response += `${content.content.substring(0, 300)}${
            content.content.length > 300 ? "..." : ""
          }\n\n`;
        });
        return response;
      }
    } else if (functionName === "aggregate") {
      // Format aggregation results
      if (Array.isArray(result) && result.length > 0) {
        return `I found ${
          result.length
        } results in the database. Here's a summary:\n\n${JSON.stringify(
          result.slice(0, 3),
          null,
          2
        )}${result.length > 3 ? "\n\n...and more results." : ""}`;
      }
    } else if (functionName === "listModels") {
      // Format models list
      if (
        Array.isArray(result) ||
        (result.models && Array.isArray(result.models))
      ) {
        const models = Array.isArray(result) ? result : result.models;
        return `Available models in the database: ${models.join(", ")}`;
      }
    } else if (functionName === "getModelSchema") {
      // Format schema result
      if (result && Object.keys(result).length > 0) {
        return `Here's the schema information:\n\n${JSON.stringify(
          result,
          null,
          2
        )}`;
      }
    } else if (functionName === "generateImage") {
      // Format image generation result
      if (result && result.success && result.url) {
        return `Perfect! I've generated an image for you based on your prompt: "${result.prompt}"\n\nThe image has been created and is ready to view. Would you like me to generate another image or make any modifications to this one?`;
      } else if (result && !result.success) {
        return `I encountered an issue while generating the image. Please try again with a different prompt.`;
      }
    } else if (functionName === "generateImageWithReference") {
      // Format image generation with reference result
      if (result && result.success && result.url) {
        return `Perfect! I've generated an image for you using your reference image and the prompt: "${result.prompt}"\n\n${result.responseText}\n\nThe image has been created and is ready to view. Would you like me to generate another image or make any modifications to this one?`;
      } else if (result && !result.success) {
        return `I encountered an issue while generating the image with your reference. Please try again with a different prompt or reference image.`;
      }
    }

    // Default formatting for other function types
    const resultStr =
      typeof result === "string" ? result : JSON.stringify(result);
    const truncatedResult =
      resultStr.length > 500 ? resultStr.substring(0, 500) + "..." : resultStr;
    return `I found information related to your query: ${truncatedResult}`;
  } catch (error) {
    return "I found information related to your query, but encountered an error while formatting the response. Please try asking in a different way.";
  }
}

function getCurrentDateTime() {
  const now = new Date();
  return now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });
}

////////////////////////////////////////////////////////////////////////////////
// MAIN ENTRYPOINT
////////////////////////////////////////////////////////////////////////////////

/**
 * Generate a conversation title using the LLM based on the conversation content
 */
export async function generateConversationTitle(userMessage, aiResponse) {
  try {
    const systemPrompt = `You are a helpful assistant that generates concise, descriptive titles for conversations. 

Rules:
- Generate a title that captures the main topic or intent of the conversation
- Keep it between 3-8 words
- Make it descriptive but concise
- Don't use quotes around the title
- Focus on the main subject or question being discussed
- Make it sound natural and professional

Examples:
- "Website Development Help"
- "Python Data Analysis"
- "Travel Planning for Europe"
- "Resume Writing Tips"
- "Investment Strategy Discussion"`;

    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        // No tools needed for title generation
      },
      history: [],
    });

    const prompt = `Based on this conversation, generate a concise title:

User: ${userMessage}
AI: ${aiResponse.substring(0, 200)}...

Title:`;

    const result = await sendWithRetry(chat, prompt);
    const title = extractAssistantText(result).trim();

    // Clean up the title and ensure it's within limits
    const cleanTitle = title.replace(/^["']|["']$/g, "").trim();
    return cleanTitle.length > 50
      ? cleanTitle.substring(0, 47) + "..."
      : cleanTitle;
  } catch (error) {
    console.error("Error generating conversation title:", error);
    // Fallback to the original method
    const cleaned = userMessage.trim().replace(/\s+/g, " ");
    if (cleaned.length <= 50) return cleaned;

    const truncated = cleaned.substring(0, 47);
    const lastSpace = truncated.lastIndexOf(" ");

    return lastSpace > 20
      ? truncated.substring(0, lastSpace) + "..."
      : truncated + "...";
  }
}

export async function generateChatCompletion(
  session,
  userMessage,
  pastMessages
) {
  const now = getCurrentDateTime();

  let userDetails = "No session data available.";
  if (session && session.user) {
    userDetails = `User ID: ${session.user.id} User Name: ${session.user.name} Email: ${session.user.email}`;
  }

  // Add current message attachments to context
  let attachmentContext = "";
  if (userMessage.attachments && Array.isArray(userMessage.attachments)) {
    attachmentContext = `

CURRENT MESSAGE ATTACHMENTS:
${userMessage.attachments
  .map(
    (attachment, index) =>
      `${index + 1}. ${attachment.displayName} (${attachment.category})
   - URL: ${attachment.url}
   - Type: ${attachment.type}
   - Size: ${attachment.size} bytes`
  )
  .join("\n")}

When using generateImageWithReference, use the URL and type from the attachments above.
`;
  }

  const pastMessagesWithoutDefault = pastMessages.slice(1);

  // ——— transform into the Content[] shape ———
  const history = await Promise.all(
    pastMessagesWithoutDefault.map(async (msg) => {
      const parts = [{ text: msg.content }];

      // Add files if present
      if (msg.attachments && Array.isArray(msg.attachments)) {
        for (const file of msg.attachments) {
          try {
            const isImage = file?.category === "image" || file?.type?.startsWith?.("image/");
            const hasGeminiUri = !!(file?.geminiFile?.uri);
            const firebaseUrl = file?.url;
            const mimeType = file?.type || file?.mimeType || (isImage ? "image/*" : undefined);

            if (isImage && firebaseUrl) {
              const response = await fetch(firebaseUrl);
              const arrayBuffer = await response.arrayBuffer();
              const base64Data = Buffer.from(arrayBuffer).toString("base64");

              parts.push({
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data,
                },
              });
            } else if (hasGeminiUri) {
              parts.push({
                fileData: {
                  mimeType: mimeType,
                  fileUri: file.geminiFile.uri,
                },
              });
            } else if (firebaseUrl) {
              parts.push({
                text: `Attachment available: ${file.displayName || "file"} (${mimeType || "unknown"}) -> ${firebaseUrl}`,
              });
            }
          } catch (error) {
            console.error(
              "Error processing file in generateChatCompletion:",
              error
            );
          }
        }
      }

      return {
        role: msg.role,
        parts: parts,
      };
    })
  );

  //const historyWithAiLast = history.slice(0, -1);

  const chat = ai.chats.create({
    model: "gemini-2.5-flash",
    config: {
      // your system prompt goes here
      systemInstruction: QUEST_SYSTEM_PROMPT.replace(
        "%USERDETAILS%",
        userDetails + attachmentContext
      ).replace("%DATEDETAILS%", now),

      tools: [{ functionDeclarations: mcpTools }],
      toolConfig: {
        functionCallingConfig: { mode: FunctionCallingConfigMode.AUTO },
      },
      thinkingConfig: {
        thinkingBudget: -1,
        // Turn off thinking:
        // thinkingBudget: 0
        // Turn on dynamic thinking:
        // thinkingBudget: -1
      },
    },
    history,
  });

  return await handleUserQuery(
    chat,
    userMessage.content,
    userMessage.attachments
  );
}

// New streaming function
export async function* generateChatCompletionStreaming(
  session,
  userMessage,
  pastMessages
) {
  const now = getCurrentDateTime();

  let userDetails = "No session data available.";
  if (session && session.user) {
    userDetails = `
User ID: ${session.user.id}
Name: ${session.user.name}
`;
  }

  // Add current message attachments to context
  let attachmentContext = "";
  if (userMessage.attachments && Array.isArray(userMessage.attachments)) {
    attachmentContext = `

CURRENT MESSAGE ATTACHMENTS:
${userMessage.attachments
  .map(
    (attachment, index) =>
      `${index + 1}. ${attachment.displayName} (${attachment.category})
   - URL: ${attachment.url}
   - Type: ${attachment.type}
   - Size: ${attachment.size} bytes`
  )
  .join("\n")}

When using generateImageWithReference, use the URL and type from the attachments above.
`;
  }

  const pastMessagesWithoutDefault = pastMessages.slice(1);

  // Transform into the Content[] shape
  const history = await Promise.all(
    pastMessagesWithoutDefault.map(async (msg) => {
      const parts = [{ text: msg.content }];

      // Add files if present
      if (msg.attachments && Array.isArray(msg.attachments)) {
        for (const file of msg.attachments) {
          try {
            const isImage = file?.category === "image" || file?.type?.startsWith?.("image/");
            const hasGeminiUri = !!(file?.geminiFile?.uri);
            const firebaseUrl = file?.url;
            const mimeType = file?.type || file?.mimeType || (isImage ? "image/*" : undefined);

            if (isImage && firebaseUrl) {
              const response = await fetch(firebaseUrl);
              const arrayBuffer = await response.arrayBuffer();
              const base64Data = Buffer.from(arrayBuffer).toString("base64");

              parts.push({
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data,
                },
              });
            } else if (hasGeminiUri) {
              parts.push({
                fileData: {
                  mimeType: mimeType,
                  fileUri: file.geminiFile.uri,
                },
              });
            } else if (firebaseUrl) {
              parts.push({
                text: `Attachment available: ${file.displayName || "file"} (${mimeType || "unknown"}) -> ${firebaseUrl}`,
              });
            }
          } catch (error) {
            console.error(
              "Error processing file in generateChatCompletionStreaming:",
              error
            );
          }
        }
      }

      return {
        role: msg.role,
        parts: parts,
      };
    })
  );

  const chat = ai.chats.create({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: QUEST_SYSTEM_PROMPT.replace(
        "%USERDETAILS%",
        userDetails + attachmentContext
      ).replace("%DATEDETAILS%", now),

      tools: [{ functionDeclarations: mcpTools }],
      toolConfig: {
        functionCallingConfig: { mode: FunctionCallingConfigMode.AUTO },
      },
    },
    history,
  });

  try {
    yield* handleUserQueryStreaming(
      chat,
      userMessage.content,
      userMessage.attachments
    );
  } catch (error) {
    yield { type: "error", error: "Failed to generate response" };
  }
}

// Streaming version of handleUserQuery
async function* handleUserQueryStreaming(
  chat,
  userMessageContent,
  userFiles = null
) {
  let response;
  let safetyCounter = 0;
  let lastFunctionResult = null;
  let lastFunctionName = null;

  try {
    // For streaming, we'll use Gemini's streaming API
    // Build the full conversation history including the new user message
    const userParts = [{ text: userMessageContent }];

    // Add files if present
    if (userFiles && Array.isArray(userFiles)) {
      for (const file of userFiles) {
        if (file && file.url) {
          try {
            if (file.category === "image") {
              // Fetch the image from Firebase Storage and convert to base64
              const response = await fetch(file.url);
              const arrayBuffer = await response.arrayBuffer();
              const base64Data = Buffer.from(arrayBuffer).toString("base64");

              userParts.push({
                inlineData: {
                  mimeType: file.type,
                  data: base64Data,
                },
              });
            } else if (file.geminiFile) {
              // Use Gemini File API URI directly
              userParts.push({
                fileData: {
                  mimeType: file.type,
                  fileUri: file.geminiFile.uri,
                },
              });
            }
          } catch (error) {
            console.error(
              "Error processing file in handleUserQueryStreaming:",
              error
            );
            // Continue without this file if processing fails
          }
        }
      }
    }

    const conversationHistory = [
      ...chat.history,
      { role: "user", parts: userParts },
    ];

    const streamingResponse = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: conversationHistory,
      config: {
        systemInstruction: chat.config?.systemInstruction,
        tools: chat.config?.tools,
        toolConfig: chat.config?.toolConfig,
      },
    });

    // Handle function calls first if they exist in the initial response
    let initialResponse = null;
    let streamingChunks = [];

    // Streaming placeholder filtering buffers
    let bufferedText = "";
    let yieldedLength = 0;

    for await (const chunk of streamingResponse) {
      if (!initialResponse) {
        initialResponse = chunk;

        // Check if there are function calls to handle first
        if (
          chunk.functionCalls?.length > 0 ||
          extractThoughtsAndFunctionCall(chunk).function_call
        ) {
          // We need to handle function calls before streaming text
          response = chunk;
          break;
        }
      }

      // If no function calls, start streaming the text response with model-assessed cleaning of any leading boilerplate
      const textContent = extractAssistantText(chunk);
      if (textContent) {
        bufferedText += textContent;
        const delta = bufferedText.slice(yieldedLength);
        if (delta.length > 0) {
          yieldedLength += delta.length;
          streamingChunks.push(delta);
          yield {
            type: "content",
            content: delta,
          };
        }
      }
    }

    // Handle function calls if they exist
    if (
      response &&
      (response.functionCalls?.length > 0 ||
        extractThoughtsAndFunctionCall(response).function_call)
    ) {
      while (
        (response.functionCalls?.length > 0 ||
          extractThoughtsAndFunctionCall(response).function_call) &&
        safetyCounter < 5
      ) {
        const { thoughts, function_call } =
          extractThoughtsAndFunctionCall(response);
        const functionCallToExecute =
          function_call ||
          (response.functionCalls && response.functionCalls[0]);

        if (functionCallToExecute) {
          const functionName = functionCallToExecute.name;
          lastFunctionName = functionName;

          // Parse arguments
          let args;
          if (functionCallToExecute.arguments) {
            const rawArgs = functionCallToExecute.arguments;
            args = typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs;
          } else if (functionCallToExecute.args) {
            const rawArgs = functionCallToExecute.args;
            args = typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs;
          } else if (functionCallToExecute.parameters) {
            const rawArgs = functionCallToExecute.parameters;
            args = typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs;
          } else {
            args = {};
          }

          const result = await executeMcpTool(functionName, args);
          lastFunctionResult = result;

          // Emit special event for image generation
          if (
            (functionName === "generateImage" ||
              functionName === "generateImageWithReference") &&
            result &&
            result.success
          ) {
            yield {
              type: "image_generation",
              result: result,
            };
          }

          try {
            // Add the function call and response to the conversation history
            const updatedHistory = [
              ...conversationHistory,
              {
                role: "model",
                parts: [{ functionCall: functionCallToExecute }],
              },
              {
                role: "user",
                parts: [
                  {
                    functionResponse: {
                      name: functionName,
                      response: { result },
                    },
                  },
                ],
              },
            ];

            // Get the response after function call
            const functionResponse = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: updatedHistory,
              config: {
                systemInstruction: chat.config?.systemInstruction,
                tools: chat.config?.tools,
                toolConfig: chat.config?.toolConfig,
              },
            });

            // Stream the function response
            const finalAnswer = extractAssistantText(functionResponse);
            if (finalAnswer) {
              yield* streamTextResponse(finalAnswer);
              return;
            }

            response = functionResponse;
          } catch (error) {
            // If we have a function result but the LLM failed to respond, format it directly
            if (lastFunctionResult) {
              const formattedResult = formatFunctionResultsDirectly(
                lastFunctionName,
                lastFunctionResult,
                userMessageContent
              );
              yield* streamTextResponse(formattedResult);
              return;
            }
            break;
          }
        } else {
          break;
        }

        safetyCounter++;
      }

      // If we executed function calls but didn't get a proper response, format the result directly
      if (safetyCounter > 0 && lastFunctionResult) {
        const finalAnswer = extractAssistantText(response || initialResponse);
        if (!finalAnswer) {
          const formattedResult = formatFunctionResultsDirectly(
            lastFunctionName,
            lastFunctionResult,
            userMessageContent
          );
          yield* streamTextResponse(formattedResult);
          return;
        }
      }
    }

    // If we already streamed chunks without function calls, we're done
    if (streamingChunks.length > 0) {
      yield { type: "done" };
      return;
    }

    // Handle final response if no streaming occurred yet
    const finalAnswer = extractAssistantText(response || initialResponse);
    if (finalAnswer) {
      const assessment = await assessAnswerQuality(
        userMessageContent,
        finalAnswer
      );
      if (assessment.needsContinuation || assessment.cleanedAnswer.length === 0) {
        // Force continuation: request the model to complete the action and return results
        const continuationHistory = [
          ...conversationHistory,
          { role: "model", parts: [{ text: finalAnswer }] },
          {
            role: "user",
            parts: [
              {
                text:
                  "Do not announce intent. Immediately perform the requested task and return the final result now. Use tools silently if needed. Reply only with the final result.",
              },
            ],
          },
        ];

        const continued = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: continuationHistory,
          config: {
            systemInstruction: chat.config?.systemInstruction,
            tools: chat.config?.tools,
            toolConfig: chat.config?.toolConfig,
          },
        });
        const continuedRaw = extractAssistantText(continued);
        const continuedAssessed = await assessAnswerQuality(
          userMessageContent,
          continuedRaw
        );
        if (continuedAssessed.cleanedAnswer) {
          yield* streamTextResponse(continuedAssessed.cleanedAnswer);
        } else if (assessment.cleanedAnswer) {
          yield* streamTextResponse(assessment.cleanedAnswer);
        } else {
          yield* streamTextResponse(
            "I apologize, but I couldn't process your request. Please try again."
          );
        }
      } else {
        yield* streamTextResponse(assessment.cleanedAnswer || finalAnswer);
      }
    } else if (lastFunctionResult) {
      const formattedResult = formatFunctionResultsDirectly(
        lastFunctionName,
        lastFunctionResult,
        userMessageContent
      );
      yield* streamTextResponse(formattedResult);
    } else {
      yield* streamTextResponse(
        "I apologize, but I couldn't process your request. Please try again."
      );
    }
  } catch (error) {
    // Fallback to non-streaming approach
    try {
      response = await sendWithRetry(chat, userMessageContent, {
        retries: 3,
        initialDelayMs: 1000,
        backoffFactor: 2,
      });

      const fallbackAnswer = extractAssistantText(response);
      if (fallbackAnswer) {
        yield* streamTextResponse(fallbackAnswer);
      } else {
        yield { type: "error", error: "Processing error occurred" };
      }
    } catch (fallbackError) {
      yield { type: "error", error: "Failed to generate response" };
    }
  }
}

// Improved helper function to stream text response in chunks
async function* streamTextResponse(text) {
  // First, extract any sources or images data
  const sourcesMatch = text.match(/sources:\s*(\[[\s\S]*?\])\s*\n*/);
  const imagesMatch = text.match(/images:\s*(\[[\s\S]*?\])\s*\n*/);

  // Remove metadata from the text
  let cleanText = text
    .replace(/sources:\s*\[[\s\S]*?\]\s*\n*/, "") // Remove sources
    .replace(/images:\s*\[[\s\S]*?\]\s*\n*/, "") // Remove images
    .replace(/\n{3,}/g, "\n\n") // Clean up extra newlines
    .trim();

  // Remove duplicate text that might appear after the metadata
  if (sourcesMatch) {
    const contentAfterSources = text.substring(sourcesMatch[0].length).trim();
    if (cleanText.includes(contentAfterSources)) {
      cleanText = contentAfterSources;
    }
  }

  // Split by words but preserve punctuation and spacing
  const tokens = cleanText.match(/\S+\s*/g) || [];

  // If we have sources, send them first with proper formatting
  if (sourcesMatch) {
    yield {
      type: "content",
      content: sourcesMatch[0] + "\n\n",
      isMetadata: true,
    };
  }

  // After streaming is complete, send any remaining metadata
  if (imagesMatch) {
    yield {
      type: "content",
      content: imagesMatch[0] + "\n\n",
      isMetadata: true,
    };
  }

  // Stream the main content
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    yield {
      type: "content",
      content: token,
    };

    // Variable delay based on token type for more natural streaming
    let delay = 40; // Base delay

    // Longer pause after punctuation
    if (token.match(/[.!?]\s*$/)) {
      delay = 120;
    } else if (token.match(/[,;:]\s*$/)) {
      delay = 80;
    }

    // Add a small delay to simulate realistic streaming
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  yield { type: "done" };
}
