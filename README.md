# NexusAI 🚀

An AI-powered productivity platform that combines intelligent conversations, note management, quiz generation, flashcards, document assistance, and conversation history tracking into a single seamless experience.

## Overview

NexusAI is designed to enhance productivity and learning by leveraging AI to assist users with content creation, studying, organization, and problem-solving. The platform provides a unified workspace where users can interact with an AI assistant, generate quizzes and flashcards, manage notes, and maintain conversation history.

---

## Features

### 🤖 AI Assistant
- Intelligent conversational AI
- Code generation and debugging support
- Text summarization
- Resume review and optimization
- Professional email drafting
- Grammar correction and writing enhancement
- Key-point extraction and document assistance

### 📝 Notes Management
- Create, edit, and delete notes
- Secure user-specific storage
- Organized note retrieval and management

### 📚 Quiz & Flashcards
- AI-generated quizzes on various topics
- Multiple difficulty levels
- Automatic flashcard generation for revision and learning

### 📜 Conversation History
- Save AI conversations
- Access previous chats anytime
- Maintain a personalized interaction history

### 🔐 Authentication & Security
- JWT-based authentication
- Secure user access
- Protected resources and user data

---

## Tech Stack

### Frontend
- React
- Vite
- React Router
- HTML5
- CSS3
- JavaScript

### Backend
- Spring Boot
- Java 21
- Maven

### Database
- MongoDB

### Security
- JWT Authentication
- Spring Security

### AI Integration
- Large Language Model (LLM) APIs

---

## System Architecture

```text
Frontend (React + Vite)
          │
          ▼
Spring Boot REST API
          │
          ▼
       MongoDB
          │
          ▼
      AI Services
```

---

## Project Structure

```text
NexusAI
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── src/
│   ├── pom.xml
│   └── application.properties
│
├── screenshots/
│
└── README.md
```

---

## Screenshots

### Dashboard
_Add screenshot here_

### AI Chat Interface
_Add screenshot here_

### Quiz Generator
_Add screenshot here_

### Notes Manager
_Add screenshot here_

---

## Installation & Setup

### Prerequisites

Ensure the following are installed:

- Java 21 or higher
- Maven
- Node.js
- npm
- MongoDB

---

### Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Configure environment variables:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
OPENAI_API_KEY=your_api_key
```

3. Run the Spring Boot application:

```bash
mvn spring-boot:run
```

Backend server:

```text
http://localhost:8080
```

---

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

Frontend server:

```text
http://localhost:5173
```

---

## Learning Outcomes

Through this project:

- Developed a full-stack web application using React and Spring Boot.
- Implemented secure authentication and authorization using JWT.
- Integrated AI capabilities into a modern web platform.
- Designed and consumed RESTful APIs.
- Managed data persistence using MongoDB.
- Improved understanding of frontend-backend integration and system design.

---

## Future Enhancements

- PDF upload and analysis
- Voice-based AI interaction
- Real-time collaboration features
- AI-powered study planner
- Personalized learning recommendations
- Advanced analytics dashboard
- Dark/Light theme customization

---

## Author

**Harshika Sipani**

NexusAI was developed as a full-stack AI productivity platform to explore modern web development, AI integration, and scalable application design.

---

## License

This project is licensed under the MIT License.

Feel free to fork, modify, and build upon this project.
