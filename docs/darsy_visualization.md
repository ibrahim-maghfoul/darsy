# Darsy Platform Visualizations

Here is a visual representation of Darsy that you can use to explain the project architecture, features, and system interactions to your partner. 

## 1. High-Level Concept Map

This mind map breaks down the platform from a top-level business view down to the core functionalities offered by each module.

```mermaid
mindmap
  root((Darsy Platform))
    Students & Learning
      Darsy Web interface
      Curriculum Explorer
      School Services Catalog
      Interactive Document & Video Player
       रियल / Real-Time Collaboration Rooms
      Gamification & Learning Streaks
    Platform Administration
      Admin Hub interface
      Content Taxonomy Editor
      School Services Manager
      Subscription & User Roles Manager
      Multi-Model AI Dashboard
      Marketing Idea Generator
    Infrastructure Core
      Node.js & Express REST APIs
      WebSockets Layer
      MongoDB NoSQL Datastore
      JWT Auth & Security
    Growth & Automations
      n8n Marketing Engine Hub
      Social Media Autopilots
      Automated Drip Sequences
      Telegram Command Center
```

---

## 2. Technical System Architecture

This flow chart outlines how the moving parts communicate with one another under the hood.

```mermaid
graph TD
  %% External Entities
  Students([Students / Users])
  Teachers([Instructors & Teachers])
  Admins([Internal Team / Admins])

  %% Frontend Layer
  subgraph Client Layer
    Web[Darsy Web Portal<br/>Next.js / Tailwind]
    Admin[Admin Panel<br/>React / Vite]
  end

  %% API & Logic Layer
  subgraph Backend Services Layer
    API[Node.js Express API]
    Stream[Socket.io Real-Time Engine]
  end

  %% Data Layer
  subgraph Data Layer
    DB[(MongoDB)]
    FS[Local File Storage / Resouces]
  end

  %% Growth Layer
  subgraph AI & Automations Layer
    N8N[27x n8n Workflows]
    AIModels[Multi-AI Router<br/>Nebius / OpenRouter / Gemini]
  end

  %% Relationships
  Students -->|Uses Features & Services| Web
  Teachers -->|Creates Content| Web
  Admins -->|Manages Platform| Admin

  Web -->|HTTPS REST| API
  Web <-->|WebSockets| Stream
  Admin -->|HTTPS REST| API
  
  API <-->|Mongoose queries| DB
  API -->|Read/Write Files| FS
  Admin <-->|Generates Ideas / Logos / Posters| AIModels
  
  API --->|Trigger Webhooks| N8N
  N8N <-->|Direct DB Access| DB
  N8N <-->|Automation| AIModels
  
  %% Styling
  classDef app fill:#e1f5fe,stroke:#03a9f4,stroke-width:2px;
  classDef api fill:#fff3e0,stroke:#ff9800,stroke-width:2px;
  classDef dat fill:#e8f5e9,stroke:#4caf50,stroke-width:2px;
  classDef aut fill:#fce4ec,stroke:#e91e63,stroke-width:2px;
  
  class Web,Admin app;
  class API,Stream api;
  class DB,FS dat;
  class N8N,AIModels aut;
```

---

## 3. The 27-Workflow N8N Marketing Engine

Since automations define how the web-app scales with zero human-effort, here is a breakdown of how the marketing layer independently fuels Darsy.

```mermaid
graph LR
  subgraph Darsy Platform Growth Engine
    direction TB
    
    Trigger{Event Trigger}
    Router((AI Decision Engine))

    subgraph Categories
      Mark[Marketing Automation<br/>e.g., SEO, Social Autopilot]
      Engage[User Engagement<br/>e.g., Drips, Newsletters]
      Ana[Analytics & Retention<br/>e.g., Churn Prediction]
      Interact[Support Chatbots<br/>e.g., Telegram / WhatsApp]
    end
    
    Ext((Socials / Email / Web))
    
    Trigger -->|Webhook / CRON / DB| Router
    Router -->|Contextualizes Action| Categories
    Categories -->|Action Execution| Ext
  end

  classDef main fill:#f3e5f5,stroke:#9c27b0,stroke-width:2px;
  class Router,Trigger main;
```
