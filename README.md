# SiteSage
Empowering Your Website with AI Wisdom.

## Introduction
Add an interactive, private, and secure chatbot to your website with SiteSage.
No sign-up required.
Runs entirely on the user's browser.
Leverages Chrome's built-in AI APIs for seamless and powerful responses.

## Installation
Place the following files in your website's root directory:
* chatbot.js
* chatbotcontext.txt (contains the chatbot's context).
Include the chatbot script in your HTML by adding this line within the <head> or <body>:
```
<script src="chatbot.js"></script>
```

## Important Note: Enable Chrome AI APIs
Chrome AI APIs are in preview mode. You must enable them before the chatbot can function:

* Open Chrome and navigate to:
* * chrome://flags/#optimization-guide-on-device-model - Set this flag to Enabled BypassPerfRequirement.
* * chrome://flags/#prompt-api-for-gemini-nano - Set this flag to Enabled.
* Go to chrome://components/ and locate Optimization Guide On Device Model. Ensure it’s fully downloaded.
* Relaunch Chrome.

For more details, visit <a href="https://developer.chrome.com/docs/ai/built-in">Chrome Built-In AI Documentation</a>

## How It Works
1. Fuzzy Search: Searches the chatbotcontext.txt for relevant information based on the user query.
2. Inference: Passes the query and extracted context to Chrome's Gemini Nano AI for generating a response.
3. User Interaction: Displays the AI's response to the user via the chatbot interface.

## Planned Improvements
* Retain chat context across different webpages for a smoother user experience.

## Check here for Demo
<a href="https://dutta-d1.github.io/sitesage/sample-site/">Demo</a>

