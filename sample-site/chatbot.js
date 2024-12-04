// chatbot.js

const GuessIfNoContext = true;
const VerboseLogging   = true;
const CDNURLMarkedJS   = "https://cdn.jsdelivr.net/npm/marked/marked.min.js";
const CDNURLDOMPurity  = "https://cdn.jsdelivr.net/npm/dompurify/dist/purify.min.js";
const CDNURLFuse       = "https://cdn.jsdelivr.net/npm/fuse.js/dist/fuse.min.js";

let fuse;

class ChatbotWidget {
  constructor(contextFile) {
    this.contextFile = contextFile; // Path to the context file
    this.contextData = ""; // Loaded context data
    this.session = null; // Model session
    this.stopwords = new Set([
        'what', 'is', 'the', 'like', 'in', 'of', 'and', 'a', 'an', 'to', 'for', 'on', 'by', 'with', 'at', 'it', 'as', 'this', 
        'that', 'from', 'or', 'was', 'are', 'were', 'be', 'has', 'have', 'had', 'do', 'does', 'did', 'can', 'could', 'should',
        'would', 'will', 'shall', 'may', 'might', 'about', 'but', 'if', 'than', 'then', 'which', 'who', 'whom', 'where', 
        'when', 'why', 'how'
    ]);
    this.init();
  }

  async init() {
    // Load context and inject HTML
    await this.loadContext();
    await this.initializeFuse();
    this.injectHTML();
    this.addEventListeners();
    await this.checkAICapabilities();
  }

  async loadLibrary(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = url;
      script.type = "text/javascript";
      script.onload = () => resolve();
      script.onerror = (error) => reject(error);
      document.head.appendChild(script);
    });
  }

  async checkAICapabilities() {
    let aiCapable = false;
    let errorUserMessage = "";
    if (!self.ai || !self.ai.languageModel) {
      console.error("Prompt API not supported in this browser.");
      errorUserMessage = "Prompt API is not supported in this browser. Please enable support for the Prompt API in your browser.";
    } else {
      let capabilities = await self.ai.languageModel.capabilities();
      let availability = capabilities.available;

      if (availability != 'readily') {
        errorUserMessage = "Your browser supports the Prompt API, but it is not readily available. Please enable it. Current availability status: " + availability;
      } else {
        aiCapable = true;
      }
    }
    if (!aiCapable) {
      const chatbotContainer = document.getElementById("chatbot-container");
      const botMsg = document.createElement("div");
      botMsg.textContent = errorUserMessage;
      botMsg.style.cssText =
        "align-self: flex-start; background: #e9ecef; padding: 10px; border-radius: 8px; margin-bottom: 10px; max-width: 70%;";
      chatbotContainer.appendChild(botMsg);
      chatbotContainer.scrollTop = chatbotContainer.scrollHeight;

      // Disable the send button and user message input
      const chatbotSend = document.getElementById("chatbot-send");
      chatbotSend.disabled = true;
      chatbotSend.style.backgroundColor = "#ced4da";

      const chatbotInput = document.getElementById("chatbot-input");
      chatbotInput.disabled = true;
      chatbotInput.style.backgroundColor = "#ced4da";
    }
  }

  logToConsole(message) {
    console.log(message);
  }

  async loadContext() {
    try {
      await this.loadLibrary(CDNURLMarkedJS);
      await this.loadLibrary(CDNURLDOMPurity);
      await this.loadLibrary(CDNURLFuse);
      this.logToConsole("External libraries loaded");
      const response = await fetch(this.contextFile);
      this.contextData = await response.text();
      console.log("Chatbot context loaded successfully.");
    } catch (error) {
      console.error("Failed to load chatbot context:", error);
    }
  }

  async initializeFuse() {
    try {
        const response = await fetch(this.contextFile);
        if (!response.ok) {
            throw new Error('Failed to fetch the file');
        }
        const fileContent = await response.text();

        // Preprocess the text into blocks
        const blocks = fileContent.split(/\n\s*\n/).map((block, index) => ({
            id: index + 1,
            text: block.trim()
        }));

        // Initialize Fuse.js with options
        fuse = new Fuse(blocks, {
            keys: ['text'],
            threshold: 0.4, // Adjust for match sensitivity (lower is stricter)
            distance: 100, // Adjust how far out terms can match
            minMatchCharLength: 4, // Minimum query length to trigger matching
            useExtendedSearch: true
        });
    } catch (error) {
        console.error("Error loading file: " + error.message);
    }
  }

  injectHTML() {
    const chatbotHTML = `
      <div id="chatbot-button" style="position: fixed; bottom: 20px; right: 20px; background: #007bff; color: white; border: none; border-radius: 50%; width: 60px; height: 60px; font-size: 24px; text-align: center; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 1000;">💬</div>
      <div id="chatbot-popup" style="position: fixed; bottom: 80px; right: 20px; width: 400px; height: 600px; background: #f1f3f5; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); display: none; flex-direction: column; overflow: hidden; z-index: 1000;">
        <div style="background: #007bff; color: white; padding: 10px; text-align: center; font-size: 18px;">SiteSage</div>
        <div id="chatbot-container" style="flex: 1; padding: 10px; overflow-y: auto; background: white;"></div>
        <div style="display: flex; padding: 10px; background: #f1f3f5;">
          <input id="chatbot-input" type="text" placeholder="Type your message..." style="flex: 1; padding: 10px; border: 1px solid #ced4da; border-radius: 4px;" />
          <button id="chatbot-send" style="margin-left: 10px; padding: 10px; border: none; background: #007bff; color: white; border-radius: 4px; cursor: pointer;">Send</button>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", chatbotHTML);
  }

  addEventListeners() {
    const chatbotButton = document.getElementById("chatbot-button");
    const chatbotPopup = document.getElementById("chatbot-popup");
    const chatbotSend = document.getElementById("chatbot-send");
    const chatbotInput = document.getElementById("chatbot-input");

    chatbotButton.addEventListener("click", () => {
      chatbotPopup.style.display =
        chatbotPopup.style.display === "none" ? "flex" : "none";
    });

    chatbotSend.addEventListener("click", async () => {
      const userMessage = chatbotInput.value.trim();
      if (!userMessage) return;
      chatbotInput.value = "";

      await this.handleUserMessage(userMessage);
    });

    chatbotInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        chatbotSend.click();
      }
    });
  }

  preprocessUserMessage(userMessage) {
    // Tokenize user message into words and filter out stopwords
    const words = userMessage.toLowerCase().split(/\s+/).map(word => word.replace(/\?$/, '')); // Remove trailing question marks
    return words.filter(word => !this.stopwords.has(word)).join(' ');
  }

  performFuzzySearch(userMessage) {
    if (!fuse) {
        console.error("Fuse is not ready. Cannot get context from file.");
        return;
    }

    // Preprocess the query to extract key terms
    const preprocessedQuery = this.preprocessUserMessage(userMessage);
    // Preprocess query to make order irrelevant
    const sortedQuery = preprocessedQuery.split(' ').sort().join('|');
    this.logToConsole("Fuzzy searching: " + sortedQuery);
    const results = fuse.search(sortedQuery);

    if (results.length > 0) {
        return results.map(result => {
            const { id, text } = result.item;
            return `${text}`;
        }).join('\n\n---\n\n');
    } else {
        this.logToConsole("No relevant results found.");
        return;
    }
  }

  findRelevantContext(userMessage) {
    return this.performFuzzySearch(userMessage);
  }

  async initializeSession() {
    if (!self.ai || !self.ai.languageModel) {
      console.error("Prompt API not supported.");
      return null;
    }
    return await self.ai.languageModel.create({
      temperature: 0.7,
      topK: 40,
      systemPrompt: 'You are a helpful and friendly assistant. Answer only in English.'
    });
  }

  async handleUserMessage(userMessage) {
    const chatbotContainer = document.getElementById("chatbot-container");

    // Add user message to the chat
    const userMsg = document.createElement("div");
    userMsg.textContent = userMessage;
    userMsg.style.cssText =
      "align-self: flex-end; background: #007bff; color: white; padding: 10px; border-radius: 8px; margin-bottom: 10px; max-width: 70%;";
    chatbotContainer.appendChild(userMsg);
    chatbotContainer.scrollTop = chatbotContainer.scrollHeight;

    // Find relevant context
    let relevantContext = this.findRelevantContext(userMessage);
    if (!relevantContext) {
        const botMsg = document.createElement("div");
        const botMsgStyle = "align-self: flex-start; background: #e9ecef; padding: 10px; border-radius: 8px; margin-bottom: 10px; max-width: 70%;";
        botMsg.textContent = "I couldn't find any information related to your query.";

        if (GuessIfNoContext) {
            botMsg.textContent = "I couldn't find any information related to your query. I will however attempt a guess based on my limited knowledge.";
        }

        botMsg.style.cssText = botMsgStyle;
        chatbotContainer.appendChild(botMsg);
        chatbotContainer.scrollTop = chatbotContainer.scrollHeight;
        relevantContext = "";

        if (!GuessIfNoContext) {
            return;
        }
    }

    // Prepare the prompt
    this.logToConsole("Relevant Context: " + relevantContext);
    const prompt = `Context:\n${relevantContext}\n\nUser: ${userMessage}`;

    const botMsg = document.createElement("div");
    botMsg.textContent = "Thinking...";
    botMsg.style.cssText =
      "align-self: flex-start; background: #e9ecef; padding: 10px; border-radius: 8px; margin-bottom: 10px; max-width: 70%;";
    chatbotContainer.appendChild(botMsg);

    try {
      if (!this.session) {
        this.session = await this.initializeSession();
      }

      let fullResponse = "";
      const stream = await this.session.promptStreaming(prompt);
      for await (const chunk of stream) {
        const sanitizedHTML = DOMPurify.sanitize(marked.parse(chunk));
        botMsg.innerHTML = sanitizedHTML;
        chatbotContainer.scrollTop = chatbotContainer.scrollHeight;
        fullResponse = chunk;
      }
      this.logToConsole("Full Response: " + fullResponse);
    } catch (error) {
      botMsg.textContent = `Error: ${error.message}`;
    }
  }
}

// Initialize the chatbot when the script is loaded
window.addEventListener("DOMContentLoaded", () => {
  new ChatbotWidget("chatbotcontext.txt");
});
