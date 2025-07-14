# Volatility Vault AI Chatbot – Integration Notes

This is a standalone AI-powered chatbot module designed to be integrated into the main website. 
It includes a Node.js backend (Express + Azure OpenAI) and a modern HTML/CSS/JS frontend.

---

## Features
- Mood-based system prompt using user sliders (calm, confidence, impulsivity)
- Chat history export, session persistence (via localStorage), and modals for UX polish
- Azure OpenAI GPT-4o backend integration with prompt engineering

---

## Project Structure

| File                | Purpose                              |
|---------------------|--------------------------------------|
| `index.html`        | Chatbot UI                           |
| `main.js`           | Frontend logic (chat, mood sliders)  |
| `main.css`          | Styling (dark theme, responsive)     |
| `fonts.css`         | Inter font imports                   |
| `server.js`         | Node.js backend (Express + OpenAI)   |
| `package.json`      | Backend dependencies and scripts     |

---

## Running the Backend (Dev)

```bash
cd finance-bot-backend
npm install
npm start
