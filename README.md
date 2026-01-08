# Portfolio Website (React) + Resume Chatbot

Single-page personal portfolio built with **React + TypeScript (Vite)**, including a built-in chatbot that answers questions using the content of your resume.

## Run locally

```bash
cd portfolio
npm install
npm run dev
```

## Update your content (important)

- **Portfolio content + resume chatbot "training data"**: edit `portfolio/src/data/resume.ts`
  - Replace the placeholder fields (name, experience, projects, links, etc.) with your real resume.
  - The chatbot reads from this file and answers based on it.

## RAG (Retrieval-Augmented Generation) Chatbot

The chatbot uses **RAG** for better semantic understanding:

- **With API Key (Recommended)**: Uses Hugging Face's free embedding API for semantic search

  - Create a free account at [Hugging Face](https://huggingface.co/settings/tokens)
  - Get your API token
  - Create a `.env` file in the `portfolio` directory:
    ```
    VITE_HF_API_KEY=your_api_key_here
    ```
  - The chatbot will use semantic embeddings for more accurate, context-aware responses

- **Without API Key**: Automatically falls back to TF-IDF (term frequency-inverse document frequency)
  - Still works great for keyword-based queries
  - No external dependencies or API calls
  - Works offline

The RAG system:

1. **Retrieves** relevant chunks from your resume using semantic similarity
2. **Augments** the context with retrieved information
3. **Generates** natural, conversational answers

Both methods handle technology-specific queries, background questions, and company/role inquiries intelligently.

## Build

```bash
cd portfolio
npm run build
npm run preview
```
