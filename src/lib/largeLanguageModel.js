import { GoogleGenAI, FunctionCallingConfigMode, Type } from "@google/genai";
import axios from "axios";
import { AXE_AI_SYSTEM_PROMPT } from "./axe-ai-system-prompt.js";

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

////////////////////////////////////////////////////////////////////////////////
// CONFIG & STATE
////////////////////////////////////////////////////////////////////////////////

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const QUICK_WHISPER_MCP_API_KEY = process.env.QUICK_WHISPER_MCP_API_KEY;

if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is required");

const MCP_SERVER_URL = "https://quick-whisper-mcp-server-service-720003427280.us-central1.run.app/api/mongodb";

const GOOGLE_SEARCH_MCP_SERVER = "https://quick-whisper-mcp-server-service-720003427280.us-central1.run.app/api/google";

const GOOGLE_WORKSPACE_SERVER ="https://quick-whisper-mcp-server-service-720003427280.us-central1.run.app/api/google-workspace"

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

////////////////////////////////////////////////////////////////////////////////
// MCP TOOL DEFINITIONS
////////////////////////////////////////////////////////////////////////////////

const mcpTools = [
  {
    name: "listModels",
    description: "This tool lists all available models in the database",
    parameters: { type: "OBJECT", properties: {}, required: [] },
    execute: async () => {
      const { data } = await axios.get(`${MCP_SERVER_URL}/models`, {
        headers: {
          "x-api-key": QUICK_WHISPER_MCP_API_KEY,
        },
      });
      return data;
    },
  },
  {
    name: "getModelSchema",
    description: "This tool gets the schema for a specific model",
    parameters: {
      type: "OBJECT",
      properties: {
        modelName: { type: "STRING", description: "Name of the model" },
      },
      required: ["modelName"],
    },
    execute: async ({ modelName }) => {
      requireParams({ modelName }, "modelName");
      const { data } = await axios.get(
        `${MCP_SERVER_URL}/models/${modelName}/schema`,
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
    name: "aggregate",
    description: "This tool to run all aggregation pipelines",
    parameters: {
      type: "OBJECT",
      properties: {
        modelName: {
          type: "STRING",
          description: "Name of the Mongoose model",
        },
        pipeline: {
          type: "ARRAY",
          items: { type: "OBJECT" },
          description: "Aggregation stages",
        },
      },
      required: ["modelName", "pipeline"],
    },
    execute: async (params) => {
      requireParams(params, "modelName", "pipeline");
      if (!Array.isArray(params.pipeline)) {
        throw new Error("Pipeline must be an array");
      }
      const { data } = await axios.post(
        `${MCP_SERVER_URL}/models/${params.modelName}/aggregate`,
        { pipeline: params.pipeline },
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
    name: "listGmailMessages",
    description: "List emails from user's Gmail inbox",
    parameters: {
      type: "OBJECT",
      properties: {
        userId: { type: "STRING", description: "User ID" },
        maxResults: { type: "NUMBER", description: "Maximum number of results to return (default 10)" },
        q: { type: "STRING", description: "Search query for filtering emails" }
      },
      required: ["userId"]
    },
    execute: async (params) => {
      requireParams(params, "userId");
      const { data } = await axios.get(`${GOOGLE_WORKSPACE_SERVER}/gmail/messages`, {
        params: {
          userId: params.userId,
          maxResults: params.maxResults || 10,
          q: params.q || ''
        },
        headers: {
          "x-api-key": QUICK_WHISPER_MCP_API_KEY,
        },
      });
      return data;
    }
  },
  {
    name: "getGmailMessage",
    description: "Get detailed content of a specific email",
    parameters: {
      type: "OBJECT",
      properties: {
        userId: { type: "STRING", description: "User ID" },
        messageId: { type: "STRING", description: "Gmail message ID" }
      },
      required: ["userId", "messageId"]
    },
    execute: async (params) => {
      requireParams(params, "userId", "messageId");
      const { data } = await axios.get(`${GOOGLE_WORKSPACE_SERVER}/gmail/messages/${params.messageId}`, {
        params: { userId: params.userId },
        headers: {
          "x-api-key": QUICK_WHISPER_MCP_API_KEY,
        },
      });
      return data;
    }
  },
  {
    name: "sendGmailMessage",
    description: "Send an email through Gmail",
    parameters: {
      type: "OBJECT",
      properties: {
        userId: { type: "STRING", description: "User ID" },
        to: { type: "STRING", description: "Recipient email address" },
        subject: { type: "STRING", description: "Email subject" },
        body: { type: "STRING", description: "Email body content" },
        contentType: { type: "STRING", description: "Content type (default: text/plain)" }
      },
      required: ["userId", "to", "subject", "body"]
    },
    execute: async (params) => {
      requireParams(params, "userId", "to", "subject", "body");
      const { data } = await axios.post(`${GOOGLE_WORKSPACE_SERVER}/gmail/send`, params, {
        headers: {
          "x-api-key": QUICK_WHISPER_MCP_API_KEY,
        },
      });
      return data;
    }
  },
  // Drive Tools
  {
    name: "listDriveFiles",
    description: "List files in user's Google Drive",
    parameters: {
      type: "OBJECT",
      properties: {
        userId: { type: "STRING", description: "User ID" },
        pageSize: { type: "NUMBER", description: "Number of files to return (default 10)" },
        q: { type: "STRING", description: "Search query for filtering files" }
      },
      required: ["userId"]
    },
    execute: async (params) => {
      requireParams(params, "userId");
      const { data } = await axios.get(`${GOOGLE_WORKSPACE_SERVER}/drive/files`, {
        params: {
          userId: params.userId,
          pageSize: params.pageSize || 10,
          q: params.q || ''
        },
        headers: {
          "x-api-key": QUICK_WHISPER_MCP_API_KEY,
        },
      });
      return data;
    }
  },
  {
    name: "getDriveFile",
    description: "Get metadata of a specific Google Drive file",
    parameters: {
      type: "OBJECT",
      properties: {
        userId: { type: "STRING", description: "User ID" },
        fileId: { type: "STRING", description: "Google Drive file ID" }
      },
      required: ["userId", "fileId"]
    },
    execute: async (params) => {
      requireParams(params, "userId", "fileId");
      const { data } = await axios.get(`${GOOGLE_WORKSPACE_SERVER}/drive/files/${params.fileId}`, {
        params: { userId: params.userId },
        headers: {
          "x-api-key": QUICK_WHISPER_MCP_API_KEY,
        },
      });
      return data;
    }
  },
  // Google Docs Tools
  {
    name: "getGoogleDoc",
    description: "Get content of a Google Doc",
    parameters: {
      type: "OBJECT",
      properties: {
        userId: { type: "STRING", description: "User ID" },
        documentId: { type: "STRING", description: "Google Doc ID" }
      },
      required: ["userId", "documentId"]
    },
    execute: async (params) => {
      requireParams(params, "userId", "documentId");
      const { data } = await axios.get(`${GOOGLE_WORKSPACE_SERVER}/docs/${params.documentId}`, {
        params: { userId: params.userId },
        headers: {
          "x-api-key": QUICK_WHISPER_MCP_API_KEY,
        },
      });
      return data;
    }
  },
  {
    name: "createGoogleDoc",
    description: "Create a new Google Doc",
    parameters: {
      type: "OBJECT",
      properties: {
        userId: { type: "STRING", description: "User ID" },
        name: { type: "STRING", description: "Document name" },
        content: { type: "STRING", description: "Initial document content" },
        parentFolderId: { type: "STRING", description: "Optional parent folder ID" }
      },
      required: ["userId", "name"]
    },
    execute: async (params) => {
      requireParams(params, "userId", "name");
      const { data } = await axios.post(`${GOOGLE_WORKSPACE_SERVER}/docs/create`, params, {
        headers: {
          "x-api-key": QUICK_WHISPER_MCP_API_KEY,
        },
      });
      return data;
    }
  },
  // Google Slides Tools
  {
    name: "createGoogleSlides",
    description: "Create a new Google Slides presentation",
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
              captionStyle: { type: "OBJECT" }
            }
          },
          description: "Array of slide data objects"
        }
      },
      required: ["userId", "title"]
    },
    execute: async (params) => {
      requireParams(params, "userId", "title");
      const { data } = await axios.post(`${GOOGLE_WORKSPACE_SERVER}/slides/create`, params, {
        headers: {
          "x-api-key": QUICK_WHISPER_MCP_API_KEY,
        },
      });
      return data;
    }
  },
  {
    name: "getGoogleSlides",
    description: "Get content of a Google Slides presentation",
    parameters: {
      type: "OBJECT",
      properties: {
        userId: { type: "STRING", description: "User ID" },
        presentationId: { type: "STRING", description: "Presentation ID" }
      },
      required: ["userId", "presentationId"]
    },
    execute: async (params) => {
      requireParams(params, "userId", "presentationId");
      const { data } = await axios.get(`${GOOGLE_WORKSPACE_SERVER}/slides/${params.presentationId}`, {
        params: { userId: params.userId },
        headers: {
          "x-api-key": QUICK_WHISPER_MCP_API_KEY,
        },
      });
      return data;
    }
  },
  // Google Sheets Tools
  {
    name: "getGoogleSheet",
    description: "Get content of a Google Sheet",
    parameters: {
      type: "OBJECT",
      properties: {
        userId: { type: "STRING", description: "User ID" },
        spreadsheetId: { type: "STRING", description: "Spreadsheet ID" },
        range: { type: "STRING", description: "Cell range (e.g., 'Sheet1!A1:Z1000')" }
      },
      required: ["userId", "spreadsheetId"]
    },
    execute: async (params) => {
      requireParams(params, "userId", "spreadsheetId");
      const { data } = await axios.get(`${GOOGLE_WORKSPACE_SERVER}/sheets/${params.spreadsheetId}`, {
        params: {
          userId: params.userId,
          range: params.range
        },
        headers: {
          "x-api-key": QUICK_WHISPER_MCP_API_KEY,
        },
      });
      return data;
    }
  },
  // Google Forms Tools
  {
    name: "createGoogleForm",
    description: "Create a new Google Form",
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
              shuffle: { type: "BOOLEAN" }
            }
          }
        }
      },
      required: ["userId", "title"]
    },
    execute: async (params) => {
      requireParams(params, "userId", "title");
      const { data } = await axios.post(`${GOOGLE_WORKSPACE_SERVER}/forms/create`, params, {
        headers: {
          "x-api-key": QUICK_WHISPER_MCP_API_KEY,
        },
      });
      return data;
    }
  },
  {
    name: "getGoogleForm",
    description: "Get content and responses of a Google Form",
    parameters: {
      type: "OBJECT",
      properties: {
        userId: { type: "STRING", description: "User ID" },
        formId: { type: "STRING", description: "Form ID" }
      },
      required: ["userId", "formId"]
    },
    execute: async (params) => {
      requireParams(params, "userId", "formId");
      const { data } = await axios.get(`${GOOGLE_WORKSPACE_SERVER}/forms/${params.formId}`, {
        params: { userId: params.userId },
        headers: {
          "x-api-key": QUICK_WHISPER_MCP_API_KEY,
        },
      });
      return data;
    }
  },
  // Google Calendar Tools
  {
    name: "listCalendarEvents",
    description: "List events from user's Google Calendar",
    parameters: {
      type: "OBJECT",
      properties: {
        userId: { type: "STRING", description: "User ID" },
        calendarId: { type: "STRING", description: "Calendar ID (default: primary)" },
        maxResults: { type: "NUMBER", description: "Maximum number of events to return" }
      },
      required: ["userId"]
    },
    execute: async (params) => {
      requireParams(params, "userId");
      const { data } = await axios.get(`${GOOGLE_WORKSPACE_SERVER}/calendar/get-events`, {
        params: {
          userId: params.userId,
          calendarId: params.calendarId,
          maxResults: params.maxResults
        },
        headers: {
          "x-api-key": QUICK_WHISPER_MCP_API_KEY,
        },
      });
      return data;
    }
  },
  {
    name: "createCalendarEvent",
    description: "Create a new event in Google Calendar",
    parameters: {
      type: "OBJECT",
      properties: {
        userId: { type: "STRING", description: "User ID" },
        calendarId: { type: "STRING", description: "Calendar ID (default: primary)" },
        event: {
          type: "OBJECT",
          description: "Event details object",
          properties: {
            summary: { type: "STRING" },
            description: { type: "STRING" },
            start: { type: "OBJECT" },
            end: { type: "OBJECT" },
            attendees: { type: "ARRAY", items: { type: "OBJECT" } }
          }
        }
      },
      required: ["userId", "event"]
    },
    execute: async (params) => {
      requireParams(params, "userId", "event");
      const { data } = await axios.post(`${GOOGLE_WORKSPACE_SERVER}/calendar/create-event`, params, {
        headers: {
          "x-api-key": QUICK_WHISPER_MCP_API_KEY,
        },
      });
      return data;
    }
  },
  {
    name: "getImages",
    description: "Get images from Unsplash",
    parameters: {
      type: "OBJECT",
      properties: {
        userId: { type: "STRING", description: "User ID" },
        searchTerm: { type: "STRING", description: "Image search term" },
        per_page: { type: "NUMBER", description: "Number of results you want for your search term, default is 1" },
      },
      required: ["userId", "searchTerm", "per_page"]
    },
    execute: async (params) => {
      requireParams(params, "userId", "searchTerm", "per_page");
  
      const { data } = await axios.get(`${GOOGLE_WORKSPACE_SERVER}/unsplash/search`, {
        params,
        headers: {
          "x-api-key": QUICK_WHISPER_MCP_API_KEY,
        },
      });
  
      return data;
    }
  }
  
];

////////////////////////////////////////////////////////////////////////////////
// CACHING & PREFETCH
////////////////////////////////////////////////////////////////////////////////

let modelsCache = [];
let schemasCache = {};
let isInitialized = false;
let prefetchPromise = null;

async function prefetchModelMetadata() {
  try {
    const modelData = await executeMcpTool("listModels", {});
    if (Array.isArray(modelData)) {
      modelsCache = modelData;
    } else if (modelData && Array.isArray(modelData.models)) {
      modelsCache = modelData.models;
    } else {
      modelsCache = Object.keys(modelData || {});
    }

    await Promise.all(
      modelsCache.map(async (modelName) => {
        try {
          schemasCache[modelName] = await executeMcpTool("getModelSchema", {
            modelName,
          });
        } catch {
          // skip failures
        }
      })
    );

    isInitialized = true;
  } catch {
    modelsCache = [];
    schemasCache = {};
    isInitialized = false;
  }
}

async function ensurePrefetched() {
  if (!isInitialized && !prefetchPromise) {
    prefetchPromise = prefetchModelMetadata();
  }
  if (prefetchPromise) {
    await prefetchPromise;
  }
}

////////////////////////////////////////////////////////////////////////////////
// CORE HELPERS
////////////////////////////////////////////////////////////////////////////////

async function executeMcpTool(name, args) {
  const tool = mcpTools.find((t) => t.name === name);
  if (!tool) throw new Error(`No tool named ${name}`);
  return tool.execute(args);
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
  { retries = 3, initialDelayMs = 500, backoffFactor = 2 } = {}
) {
  let delay = initialDelayMs;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // try sending
      return await chat.sendMessage({ message: userMessageContent });
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
      console.warn(
        `sendMessage got 500 on attempt ${attempt}, retrying in ${delay}ms…`
      );
      await sleep(delay);
      delay *= backoffFactor;
    }
  }
}

async function handleUserQuery(chat, userMessageContent) {
  console.log("USER MESSAGE:", userMessageContent);
  let response;
  let safetyCounter = 0;
  let lastFunctionResult = null;
  let lastFunctionName = null;

  try {
    response = await sendWithRetry(chat, userMessageContent, {
      retries: 5, // total tries
      initialDelayMs: 1000, // 1s before first retry
      backoffFactor: 2, // 1s, 2s, 4s, …
    });
  } catch (error) {
    response = await chat.sendMessage({ message: "Please try again" });
    console.log("LLM ERROR : " + error);
  }

  console.log("RAW LLM RESPONSE:", JSON.stringify(response));

  try {
    // Extract function calls from Gemini response format
    while (
      (response.functionCalls?.length > 0 ||
        extractThoughtsAndFunctionCall(response).function_call) &&
      safetyCounter < 5
    ) {
      // First try to extract from our JSON parsing approach
      const { thoughts, function_call } =
        extractThoughtsAndFunctionCall(response);

      // Use either the extracted function call or the native functionCalls array
      const functionCallToExecute =
        function_call || (response.functionCalls && response.functionCalls[0]);

      if (thoughts) {
        console.log("AI THOUGHTS:", thoughts);
      }

      if (functionCallToExecute) {
        console.log(
          "AI FUNCTION CALL:",
          JSON.stringify(functionCallToExecute, null, 2)
        );

        const functionName = functionCallToExecute.name;
        lastFunctionName = functionName;

        // Parse arguments from either format
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

        if (args && args.pipeline && Array.isArray(args.pipeline)) {
          console.log("AI AGGREGATE PIPELINE:");
          args.pipeline.forEach((stage, idx) => {
            console.log(`  Stage ${idx + 1}:`, JSON.stringify(stage, null, 2));
          });
        }

        const result = await executeMcpTool(functionName, args);
        lastFunctionResult = result;
        console.log(
          "AI FUNCTION CALL RESULT:",
          JSON.stringify(result, null, 2)
        );

        // Use the correct format for Gemini API function response
        try {
          response = await chat.sendMessage({
            message: {
              functionResponse: {
                name: functionName,
                response: { result },
              },
            },
          });
        } catch (error) {
          console.log("Error in function response: " + error);
          // If we get an error here, we'll break the loop and use our fallback formatter
          break;
        }
      } else {
        // Break if no function call is found
        break;
      }

      safetyCounter++;
    }
  } catch (error) {
    console.log("Error : " + error);
  }

  // Log final thoughts (if any)
  const { thoughts: finalThoughts } = extractThoughtsAndFunctionCall(response);
  if (finalThoughts) {
    console.log("AI FINAL THOUGHTS:", finalThoughts);
  }

  const finalAnswer = extractAssistantText(response);
  console.log("AI FINAL USER RESPONSE:", finalAnswer);

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
      console.error("Error in final formatting attempt:", error);

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

  return (
    finalAnswer ||
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
        // Generic search result formatting
        let response = `Here's what I found in my search:\n\n`;
        result.results.slice(0, 3).forEach((item, index) => {
          response += `${index + 1}. ${item.title}\n${item.snippet}\n\n`;
        });
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
    }

    // Default formatting for other function types
    const resultStr =
      typeof result === "string" ? result : JSON.stringify(result);
    const truncatedResult =
      resultStr.length > 500 ? resultStr.substring(0, 500) + "..." : resultStr;
    return `I found information related to your query: ${truncatedResult}`;
  } catch (error) {
    console.error("Error in direct formatting:", error);
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

export async function generateChatCompletion(
  session,
  userMessage,
  pastMessages
) {
  await ensurePrefetched();

  const now = getCurrentDateTime();

  let userDetails = "No session data available.";
  if (session && session.user) {
    userDetails = `
User ID: ${session.user.id}
Name: ${session.user.name}
`;
  }

  const pastMessagesWithoutDefault = pastMessages.slice(1);

  // ——— transform into the Content[] shape ———
  const history = pastMessagesWithoutDefault.map((msg) => ({
    role: msg.role,
    parts: [{ text: msg.content }],
  }));

  //const historyWithAiLast = history.slice(0, -1);

  console.log("History: " + JSON.stringify(history));

  const chat = ai.chats.create({
    model: "gemini-2.5-flash",
    config: {
      // your system prompt goes here
      systemInstruction: AXE_AI_SYSTEM_PROMPT.replace(
        "%USERDETAILS%",
        userDetails
      ).replace("%DATEDETAILS%", now),

      tools: [{ functionDeclarations: mcpTools }],
      toolConfig: {
        functionCallingConfig: { mode: FunctionCallingConfigMode.AUTO },
      },
    },
    history,
  });

  return await handleUserQuery(chat, userMessage.content);
}
