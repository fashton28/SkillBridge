# Horizon

AI-powered mock interview practice platform. Practice interviews with an AI interviewer via real-time video/audio calls and receive detailed feedback to improve your skills.

## Features

- **AI Voice Interviewer** - Conversational AI powered by Gemini Live
- **Real-time Video/Audio** - High-quality calls via Stream Video SDK
- **Multiple Interview Types** - Technical, Behavioral, System Design, Product, and General
- **Multi-language Support** - English, Spanish, and Bilingual modes
- **Voice Selection** - 6 distinct voices (Puck, Charon, Kore, Fenrir, Aoede, Leda)
- **Smart Turn Detection** - Reduced latency with 1s silence detection
- **Session History** - All sessions stored in PostgreSQL with transcripts
- **AI Summaries** - Automated feedback with strengths/weaknesses analysis
- **User Authentication** - Secure accounts via Better-auth
- **Quiz System** - Practice questions for interview preparation
- **Resume Optimizer** - AI-powered resume analysis and improvement

## Architecture

```
Frontend (Next.js) --> API Routes --> Python Agent --> Gemini Live
                   |                        |
                   v                        v
              PostgreSQL            Stream Video Cloud
```

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, Radix UI |
| Backend | Next.js API Routes, FastAPI (Python) |
| Database | PostgreSQL (Neon), Drizzle ORM |
| AI | Google Gemini Live, Vision Agents |
| Video | Stream Video SDK |
| Auth | Better-auth |

## Project Structure

```
/aimeeting
├── src/
│   ├── app/           # Next.js pages and API routes
│   ├── components/    # React components (ui/, meeting/, etc.)
│   ├── lib/           # Utilities (auth, stream, gemini)
│   └── db/            # Database schema
├── agent/
│   ├── server.py      # Python FastAPI agent
│   └── requirements.txt
└── package.json
```

## Prerequisites

- Node.js 20.9.0+
- Python 3.11+
- Stream Video account
- Google AI (Gemini) API key
- PostgreSQL database (Neon recommended)

## Environment Variables

### Next.js (.env.local)

```
STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_api_secret
NEXT_PUBLIC_STREAM_API_KEY=your_stream_api_key
DATABASE_URL=your_neon_database_url
GOOGLE_API_KEY=your_gemini_api_key
BETTER_AUTH_SECRET=your_auth_secret
BETTER_AUTH_URL=http://localhost:3000
```

### Python Agent (agent/.env)

```
STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_api_secret
GOOGLE_API_KEY=your_gemini_api_key
NEXTJS_API_URL=http://localhost:3000
```

## Installation

### Next.js Frontend

```bash
npm install
npm run dev
```

### Python Agent

```bash
cd agent
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python server.py
```

The app will be available at http://localhost:3000/dashboard

## Configuration

### Interview Types

| Type | Description |
|------|-------------|
| `technical` | Algorithms, data structures, coding |
| `behavioral` | STAR method, past experiences |
| `system_design` | Architecture, scalability |
| `product` | Product thinking, estimation |
| `general` | Mix of technical and behavioral |

### Languages

- `en` - English
- `es` - Spanish
- `bilingual` - English/Spanish mix

### Voices

| Voice | Style |
|-------|-------|
| Puck | Upbeat, energetic |
| Charon | Calm, informative |
| Kore | Warm, friendly |
| Fenrir | Strong, confident |
| Aoede | Soft, bright |
| Leda | Clear, neutral |

### Turn Detection (agent/server.py)

```python
turn_detection = smart_turn.TurnDetection(
    silence_duration_ms=1000,           # Wait 1s of silence
    speech_probability_threshold=0.4    # Sensitivity threshold
)
```

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/meeting/create` | POST | Create a new meeting |
| `/api/meeting/end` | POST | End meeting, trigger summary |
| `/api/session/[id]` | GET | Get session details |
| `/api/session/transcript` | POST | Store session transcript |
| `/api/session/summary` | POST | Generate AI summary |
| `/api/stream/token` | POST | Generate Stream token |
| `/api/auth/*` | Various | Better-auth endpoints |

## Database Commands

```bash
npm run db:push    # Push schema changes to database
npm run db:studio  # Open Drizzle Studio
```

## License

MIT
