# DesignFlow Pro

## Overview

DesignFlow Pro is a design team productivity tracking system with role-based dashboards for designers and administrators. The application tracks design work sessions, demands, feedback, lessons, and generates comprehensive analytics. It features a React frontend with a Node.js/Express backend using PostgreSQL for data persistence.

The system enables designers to log their daily work (demands with multiple art types, quantities, and variations), while administrators can monitor team productivity, manage feedback, create educational content, and customize system settings.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 19 with TypeScript
- React Router v7 for client-side routing (HashRouter)
- Recharts for data visualization
- Tailwind CSS for styling
- Lucide React for icons

**State Management:**
- Centralized AppContext (React Context API) managing all application state
- Single source of truth for users, art types, demands, work sessions, feedbacks, lessons, and system settings
- API calls abstracted through context methods

**Routing Structure:**
- Role-based private routes with authentication guards
- Designer routes: `/designer`, `/designer/feedbacks`, `/designer/lessons`
- Admin routes: `/admin`, `/admin/history`, `/admin/feedbacks`, `/admin/lessons`, `/admin/settings`
- Automatic redirection based on user role

**Key Design Patterns:**
- Component composition with Layout wrapper
- Custom hooks (useApp) for context access
- Protected routes with role validation
- Modal-based CRUD operations
- Real-time data filtering and aggregation

### Backend Architecture

**Technology Stack:**
- Node.js with Express 5
- TypeScript with tsx runtime
- PostgreSQL database with pg driver
- bcryptjs for password hashing
- Multer for file upload handling
- CORS enabled for cross-origin requests

**API Design:**
- RESTful API structure at `/api/*` endpoints
- Concurrent development setup (server on port 3001, Vite dev on port 5000)
- Vite proxy configuration for API requests during development
- Production mode serves both API and static frontend from single port (5000)

**Database Schema:**
- **users**: Stores designer and admin accounts with hashed passwords, avatar customization, and active status
- **art_types**: Configurable art categories with points and drag-drop ordering
- **demands**: Work submissions linking to users with timestamp tracking
- **demand_items**: Individual art items within demands (art type, quantity, variations)
- **work_sessions**: Daily clock-in records per designer
- **feedbacks**: Admin-to-designer feedback with images and viewed status
- **lessons**: Educational videos with metadata
- **lesson_progress**: Tracks which designers viewed which lessons
- **system_settings**: Branding, logo, variation points configuration

**Security & Authentication:**
- Password hashing using bcryptjs with salt rounds
- Session-based authentication (user data returned on login)
- Role-based authorization checks
- Active user filtering

### Data Flow

**Authentication Flow:**
1. User submits credentials via Login page
2. Backend validates against hashed passwords in PostgreSQL
3. Successful login returns user object (without password)
4. Frontend stores currentUser in context and redirects based on role

**Demand Creation Flow:**
1. Designer adds multiple art items (type, quantity, variations)
2. Frontend calculates total points using variation points from settings
3. Demand submitted to backend with all items
4. Backend atomically inserts demand and demand_items records
5. Context refreshes to show updated data

**Admin Filtering:**
- Time-based filters: today, yesterday, weekly, monthly, yearly, custom range
- Designer-specific filters for history and analytics
- Computed aggregations for dashboard metrics (total points, arts, sessions)

## External Dependencies

### Third-Party Libraries

**Frontend:**
- `react` & `react-dom`: UI framework
- `react-router-dom`: Client-side routing with hash-based navigation
- `recharts`: Chart rendering (bar charts, pie charts for analytics)
- `lucide-react`: Icon library
- `tailwindcss`: Utility-first CSS framework (loaded via CDN in development)

**Backend:**
- `express`: Web framework
- `pg`: PostgreSQL client
- `bcryptjs`: Password hashing
- `multer`: Multipart form data handling (image uploads)
- `cors`: Cross-origin resource sharing
- `dotenv`: Environment variable management

**Development Tools:**
- `vite`: Build tool and dev server
- `tsx`: TypeScript execution for backend
- `concurrently`: Run multiple npm scripts simultaneously
- `wait-on`: Wait for server health check before starting frontend
- `typescript`: Type checking
- `@vitejs/plugin-react`: React fast refresh support

### Database

**PostgreSQL:**
- Primary data store for all application data
- Connection via `DATABASE_URL` environment variable
- Schema initialization on first run
- Supports BIGINT timestamps, JSON-like data through relational design

### Asset Handling

**Image Storage:**
- Base64 encoding for logo and feedback images stored directly in database
- Multer handles multipart uploads with 10MB limit
- Avatar URLs use ui-avatars.com API for generated avatars with custom colors

### External APIs

**UI Avatars:**
- Service: `https://ui-avatars.com/api/`
- Purpose: Generate default user avatars with initials and custom background colors
- Used when users don't upload custom avatars

**YouTube Embeds:**
- Lessons support YouTube video URLs
- Frontend extracts video IDs and generates embed URLs
- Supports formats: `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/embed/`

### Environment Configuration

**Required Environment Variables:**
- `DATABASE_URL`: PostgreSQL connection string
- `GEMINI_API_KEY`: (Referenced in config but not actively used in current codebase)
- `NODE_ENV`: Production vs development mode switching