import axios from 'axios';

const MCP_SERVER_URL = "https://quick-whisper-mcp-server-service-720003427280.us-central1.run.app/api/mongodb";
const GOOGLE_SEARCH_MCP_SERVER = "https://quick-whisper-mcp-server-service-720003427280.us-central1.run.app/api/google";
const GOOGLE_WORKSPACE_SERVER = "https://quick-whisper-mcp-server-service-720003427280.us-central1.run.app/api/google-workspace";

export async function POST(request) {
  try {
    const { toolName, args } = await request.json();
    const apiKey = process.env.QUICK_WHISPER_MCP_API_KEY;
    
    if (!apiKey) {
      return Response.json({ error: "API key not configured" }, { status: 500 });
    }

    let result;
    
          switch (toolName) {
        case 'listModels':
          result = await axios.get(`${MCP_SERVER_URL}/models`, {
            headers: { "x-api-key": apiKey }
          });
          break;
          
        case 'getModelSchema':
          if (!args.modelName) throw new Error("modelName is required");
          result = await axios.get(`${MCP_SERVER_URL}/models/${args.modelName}/schema`, {
            headers: { "x-api-key": apiKey }
          });
          break;
          
        case 'aggregate':
          if (!args.modelName || !args.pipeline) throw new Error("modelName and pipeline are required");
          if (!Array.isArray(args.pipeline)) throw new Error("Pipeline must be an array");
          result = await axios.post(`${MCP_SERVER_URL}/models/${args.modelName}/aggregate`, 
            { pipeline: args.pipeline }, 
            { headers: { "x-api-key": apiKey } }
          );
          break;
          
        case 'googleSearch':
        if (!args.query) throw new Error("query is required");
        result = await axios.post(`${GOOGLE_SEARCH_MCP_SERVER}/search`, args, {
          headers: { "x-api-key": apiKey }
        });
        break;
        
      case 'extractWebpageContent':
        if (!args.url) throw new Error("url is required");
        result = await axios.post(`${GOOGLE_SEARCH_MCP_SERVER}/extract-content`, 
          { url: args.url, format: args.format || "markdown" }, 
          { headers: { "x-api-key": apiKey } }
        );
        break;
        
      case 'extractMultipleWebpages':
        if (!args.urls || !Array.isArray(args.urls) || args.urls.length === 0) {
          throw new Error("urls array is required");
        }
        result = await axios.post(`${GOOGLE_SEARCH_MCP_SERVER}/extract-multiple`, 
          { urls: args.urls, format: args.format || "markdown" }, 
          { headers: { "x-api-key": apiKey } }
        );
        break;
        
      // Google Workspace tools
      case 'listGmailMessages':
        if (!args.userId) throw new Error("userId is required");
        result = await axios.get(`${GOOGLE_WORKSPACE_SERVER}/gmail/messages`, {
          params: { userId: args.userId, maxResults: args.maxResults || 10, q: args.q || "" },
          headers: { "x-api-key": apiKey }
        });
        break;
        
      case 'getGmailMessage':
        if (!args.userId || !args.messageId) throw new Error("userId and messageId are required");
        result = await axios.get(`${GOOGLE_WORKSPACE_SERVER}/gmail/messages/${args.messageId}`, {
          params: { userId: args.userId },
          headers: { "x-api-key": apiKey }
        });
        break;
        
      case 'gmailSendEmail':
        if (!args.userId || !args.to || !args.subject || !args.body) {
          throw new Error("userId, to, subject, and body are required");
        }
        result = await axios.post(`${GOOGLE_WORKSPACE_SERVER}/gmail/send`, args, {
          headers: { "x-api-key": apiKey }
        });
        break;
        
      case 'driveListFiles':
        if (!args.userId) throw new Error("userId is required");
        result = await axios.get(`${GOOGLE_WORKSPACE_SERVER}/drive/files`, {
          params: { userId: args.userId, pageSize: args.pageSize || 10, q: args.q || "" },
          headers: { "x-api-key": apiKey }
        });
        break;
        
      case 'driveGetFile':
        if (!args.userId || !args.fileId) throw new Error("userId and fileId are required");
        result = await axios.get(`${GOOGLE_WORKSPACE_SERVER}/drive/files/${args.fileId}`, {
          params: { userId: args.userId },
          headers: { "x-api-key": apiKey }
        });
        break;
        
      case 'docsReadDocument':
        if (!args.userId || !args.documentId) throw new Error("userId and documentId are required");
        result = await axios.get(`${GOOGLE_WORKSPACE_SERVER}/docs/${args.documentId}`, {
          params: { userId: args.userId },
          headers: { "x-api-key": apiKey }
        });
        break;
        
      case 'docsCreateDocument':
        if (!args.userId || !args.name) throw new Error("userId and name are required");
        result = await axios.post(`${GOOGLE_WORKSPACE_SERVER}/docs/create`, args, {
          headers: { "x-api-key": apiKey }
        });
        break;
        
      case 'sheetsReadSpreadsheet':
        if (!args.userId || !args.spreadsheetId) throw new Error("userId and spreadsheetId are required");
        result = await axios.get(`${GOOGLE_WORKSPACE_SERVER}/sheets/${args.spreadsheetId}`, {
          params: { userId: args.userId, range: args.range || "Sheet1!A1:Z1000" },
          headers: { "x-api-key": apiKey }
        });
        break;
        
      case 'slidesCreatePresentation':
        if (!args.userId || !args.title) throw new Error("userId and title are required");
        result = await axios.post(`${GOOGLE_WORKSPACE_SERVER}/slides/create`, args, {
          headers: { "x-api-key": apiKey }
        });
        break;
        
      case 'slidesReadPresentation':
        if (!args.userId || !args.presentationId) throw new Error("userId and presentationId are required");
        result = await axios.get(`${GOOGLE_WORKSPACE_SERVER}/slides/${args.presentationId}`, {
          params: { userId: args.userId },
          headers: { "x-api-key": apiKey }
        });
        break;
        
      case 'formsCreateForm':
        if (!args.userId || !args.title) throw new Error("userId and title are required");
        result = await axios.post(`${GOOGLE_WORKSPACE_SERVER}/forms/create`, args, {
          headers: { "x-api-key": apiKey }
        });
        break;
        
      case 'formsReadForm':
        if (!args.userId || !args.formId) throw new Error("userId and formId are required");
        result = await axios.get(`${GOOGLE_WORKSPACE_SERVER}/forms/${args.formId}`, {
          params: { userId: args.userId },
          headers: { "x-api-key": apiKey }
        });
        break;
        
      case 'calendarGetEvents':
        if (!args.userId) throw new Error("userId is required");
        console.log(`Making request to: ${GOOGLE_WORKSPACE_SERVER}/calendar/get-events`);
        console.log(`With params:`, { userId: args.userId, calendarId: args.calendarId, maxResults: args.maxResults });
        result = await axios.get(`${GOOGLE_WORKSPACE_SERVER}/calendar/get-events`, {
          params: { 
            userId: args.userId, 
            calendarId: args.calendarId, 
            maxResults: args.maxResults 
          },
          headers: { "x-api-key": apiKey }
        });
        break;
        
      case 'calendarCreateEvent':
        if (!args.userId || !args.event) throw new Error("userId and event are required");
        result = await axios.post(`${GOOGLE_WORKSPACE_SERVER}/calendar/create-event`, args, {
          headers: { "x-api-key": apiKey }
        });
        break;
        
      case 'unsplashSearchImages':
        if (!args.userId || !args.searchTerm || !args.per_page) throw new Error("userId, searchTerm, and per_page are required");
        result = await axios.get(`${GOOGLE_WORKSPACE_SERVER}/unsplash/search`, {
          params: args,
          headers: { "x-api-key": apiKey }
        });
        break;
        
      default:
        return Response.json({ error: `Unknown tool: ${toolName}` }, { status: 400 });
    }
    
    return Response.json(result.data);
    
  } catch (error) {
    console.error("Tool execution error:", error);
    return Response.json({ 
      error: error.message || "Tool execution failed" 
    }, { status: 500 });
  }
} 