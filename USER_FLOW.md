# Meal Voting App - User Flow Diagram

## Complete User Journey

```mermaid
sequenceDiagram
    participant Host
    participant Backend
    participant Database
    participant Socket
    participant Guest1
    participant Guest2

    Note over Host: Screen 1: Setup
    Host->>Backend: POST /api/parties {vibe, headcount, dietary}
    Backend->>Database: Store party data
    Backend->>Backend: Generate 3-5 meals
    Backend->>Backend: Fetch images from Unsplash
    Backend-->>Host: Return {partyId, meals[]}
    
    Note over Host: Screen 2: Menu Review
    Host->>Host: Display meal cards
    Host->>Host: Click "Create Voting Link"
    Host->>Host: Copy link: localhost:5173/vote/abc123
    
    Note over Host: Share link with guests
    Host-->>Guest1: Send link via message
    Host-->>Guest2: Send link via message
    
    Note over Guest1,Guest2: Screen 3: Guest Voting
    Guest1->>Backend: GET /api/parties/abc123
    Backend-->>Guest1: Return party & meals data
    Guest1->>Socket: connect()
    Guest1->>Socket: emit('join-party', {partyId, guestId})
    
    Guest2->>Backend: GET /api/parties/abc123
    Backend-->>Guest2: Return party & meals data
    Guest2->>Socket: connect()
    Guest2->>Socket: emit('join-party', {partyId, guestId})
    
    Socket-->>Guest1: emit('guest-joined')
    Socket-->>Guest2: emit('guest-joined')
    
    Note over Guest1: Swipe right on Meal 1
    Guest1->>Socket: emit('vote', {mealId: 1, vote: 'yes'})
    Socket->>Database: Update vote
    Socket-->>Guest1: emit('vote-update')
    Socket-->>Guest2: emit('vote-update')
    
    Note over Guest2: Swipe right on Meal 1
    Guest2->>Socket: emit('vote', {mealId: 1, vote: 'yes'})
    Socket->>Database: Update vote
    Socket->>Backend: Check for winner
    Backend->>Backend: All guests voted YES!
    
    Note over Guest1,Guest2: Winner Found!
    Socket-->>Guest1: emit('winner-found', {meal})
    Socket-->>Guest2: emit('winner-found', {meal})
    
    Note over Guest1,Guest2: Screen 4: Winner
    Guest1->>Guest1: Display winning meal
    Guest2->>Guest2: Display winning meal
```

## Detailed Screen Flow

### Host Journey

```mermaid
graph LR
    A[Landing Page] --> B[Host Setup Form]
    B --> C{Form Valid?}
    C -->|No| B
    C -->|Yes| D[Generate Meals]
    D --> E[Loading State]
    E --> F[Menu Review]
    F --> G[Create Link]
    G --> H[Share with Guests]
    H --> I[Wait for Voting]
    I --> J[Winner Announced]
```

### Guest Journey

```mermaid
graph LR
    A[Receive Link] --> B[Open Link]
    B --> C[Load Party Data]
    C --> D[Connect Socket]
    D --> E[View First Meal]
    E --> F{Vote?}
    F -->|Yes| G[Swipe Right]
    F -->|No| H[Swipe Left]
    G --> I{More Meals?}
    H --> I
    I -->|Yes| E
    I -->|No| J[Wait for Others]
    J --> K{Winner?}
    K -->|No| J
    K -->|Yes| L[Winner Screen]
```

## State Management Flow

```mermaid
stateDiagram-v2
    [*] --> Setup
    Setup --> Generating: Submit Form
    Generating --> MenuReview: Meals Generated
    MenuReview --> Voting: Create Link
    Voting --> Voting: Guest Votes
    Voting --> Winner: All Yes Votes
    Voting --> NoWinner: All Meals Rejected
    Winner --> [*]
    NoWinner --> MenuReview: Generate New Meals
```

## Real-time Voting Synchronization

```mermaid
graph TB
    subgraph Guest Clients
        G1[Guest 1 Browser]
        G2[Guest 2 Browser]
        G3[Guest 3 Browser]
    end
    
    subgraph Socket.io Server
        S[Socket Server]
        R[Room: party-abc123]
    end
    
    subgraph Backend
        V[Vote Handler]
        W[Winner Detector]
        D[Data Store]
    end
    
    G1 -->|vote event| S
    G2 -->|vote event| S
    G3 -->|vote event| S
    
    S --> R
    R --> V
    V --> D
    V --> W
    
    W -->|Check all votes| D
    W -->|Broadcast winner| R
    
    R -->|vote-update| G1
    R -->|vote-update| G2
    R -->|vote-update| G3
```

## Data Flow Architecture

```mermaid
graph TB
    subgraph Frontend
        A[React Components]
        B[API Service]
        C[Socket Service]
    end
    
    subgraph Backend
        D[Express Routes]
        E[Socket.io Handler]
        F[Meal Generator]
        G[Image Service]
    end
    
    subgraph Storage
        H[In-Memory Store]
    end
    
    subgraph External
        I[Unsplash API]
        J[OpenAI API]
    end
    
    A -->|HTTP| B
    A -->|WebSocket| C
    B --> D
    C --> E
    D --> F
    F --> G
    F --> J
    G --> I
    D --> H
    E --> H
```

## Component Hierarchy

```mermaid
graph TB
    App[App.jsx]
    
    App --> HostSetup[HostSetup.jsx]
    App --> MenuReview[MenuReview.jsx]
    App --> GuestVoting[GuestVoting.jsx]
    App --> WinnerScreen[WinnerScreen.jsx]
    
    HostSetup --> VibeInput[VibeInput]
    HostSetup --> HeadcountInput[HeadcountInput]
    HostSetup --> DietaryToggle[DietaryToggle]
    
    MenuReview --> MealCard1[MealCard]
    MenuReview --> MealCard2[MealCard]
    MenuReview --> LoadingSpinner1[LoadingSpinner]
    
    GuestVoting --> SwipeableCard[SwipeableCard]
    GuestVoting --> VotingProgress[VotingProgress]
    GuestVoting --> LoadingSpinner2[LoadingSpinner]
    
    WinnerScreen --> RecipeDetails[RecipeDetails]
```

## Error Handling Flow

```mermaid
graph TB
    A[User Action] --> B{Network Available?}
    B -->|No| C[Show Offline Error]
    B -->|Yes| D{API Call}
    D -->|Success| E[Update UI]
    D -->|Error 404| F[Show Not Found]
    D -->|Error 500| G[Show Server Error]
    D -->|Timeout| H[Show Timeout Error]
    
    C --> I[Retry Button]
    F --> I
    G --> I
    H --> I
    
    I --> A
```

## Voting Logic Flowchart

```mermaid
flowchart TD
    Start[Guest Votes] --> A{Vote Type?}
    A -->|Yes| B[Record Yes Vote]
    A -->|No| C[Record No Vote]
    
    B --> D[Update Vote Count]
    C --> D
    
    D --> E[Broadcast to All Guests]
    E --> F{Check All Guests Voted?}
    
    F -->|No| G[Wait for More Votes]
    F -->|Yes| H{Any Meal Has All Yes?}
    
    H -->|Yes| I[Announce Winner]
    H -->|No| J{More Meals Available?}
    
    J -->|Yes| K[Show Next Meal]
    J -->|No| L[No Winner - End Session]
    
    K --> Start
    I --> End[Winner Screen]
    L --> End
```

---

This visual documentation provides a complete overview of how the application flows from user interactions to backend processing and real-time synchronization.