# Yippie-Bot Architecture Documentation

This document provides an overview of the Yippie-Bot architecture, including component relationships and data flow.

## Component Architecture

```mermaid
graph TD
    A[Client/Discord] <--> B[Main Bot Process]
    
    %% Main Components
    B --> C[Commands]
    B --> D[Events]
    B --> E[Buttons]
    B --> F[Modals]
    B --> G[Riffy/Music]
    
    %% Utility Components
    B --> H[Utilities]
    H --> H1[Config]
    H --> H2[JSON Manager]
    H --> H3[General Utils]
    
    %% Logging
    B --> I[Logging]
    I --> I1[Logger]
    I --> I2[Error Handler]
    
    %% Data Flow
    C --> J[Discord API]
    D --> J
    E --> J
    F --> J
    G --> K[Lavalink Server]
```

## Initialization Flow

```mermaid
sequenceDiagram
    participant Main as Main Process
    participant Commands as Commands
    participant Events as Events
    participant Buttons as Buttons
    participant Modals as Modals
    participant Riffy as Riffy
    participant Discord as Discord API
    
    Main->>Main: Load Configuration
    Main->>Main: Initialize Client
    
    Main->>Commands: Initialize Commands
    Commands-->>Main: Commands Loaded
    
    Main->>Events: Initialize Events
    Events-->>Main: Events Loaded
    
    Main->>Buttons: Initialize Buttons
    Buttons-->>Main: Buttons Loaded
    
    Main->>Modals: Initialize Modals
    Modals-->>Main: Modals Loaded
    
    Main->>Riffy: Initialize Riffy
    Riffy-->>Main: Riffy Loaded
    
    Main->>Discord: Login
    Discord-->>Main: Ready Event
```

## Command Execution Flow

```mermaid
sequenceDiagram
    participant User as User
    participant Discord as Discord API
    participant Bot as Yippie-Bot
    participant Command as Command Handler
    participant Util as Utilities
    participant Logger as Logger
    
    User->>Discord: Invoke Command
    Discord->>Bot: Interaction Create Event
    Bot->>Logger: Log Command Invocation
    Bot->>Command: Execute Command
    Command->>Util: Use Utility Functions
    Command->>Discord: Send Response
    Discord->>User: Display Response
```

## Music System Architecture

```mermaid
graph TD
    A[User] --> B[Music Commands]
    B --> C[Riffy Client]
    C --> D[Lavalink Server]
    D --> E[Audio Sources]
    E --> F[YouTube]
    E --> G[Spotify]
    
    C --> I[Queue Management]
    I --> J[Queue Embed Manager]
    
    C --> K[Player Controls]
    K --> L[Play/Pause]
    K --> M[Skip]
    K --> N[Volume]
```

## Error Handling Flow

```mermaid
sequenceDiagram
    participant Component as Bot Component
    participant Handler as Error Handler
    participant Logger as Logger
    participant User as User
    
    Component->>Handler: Error Occurs
    Handler->>Logger: Log Error
    Handler->>Component: Return Friendly Message
    Component->>User: Display User-Friendly Error
```

This architecture documentation provides a high-level overview of the Yippie-Bot system. For more detailed information about specific components, please refer to the JSDoc documentation in the source code.