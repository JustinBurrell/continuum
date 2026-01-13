# Sprint 1: Foundation Layer
**February 16-22 | Core Infrastructure**

## 🎯 Sprint Objectives
Build the foundational authentication and infrastructure that everything else depends on. Get basic app running on web and mobile.

**Key Learning Goals:**
- Understand JWT authentication flow
- Set up MongoDB with Mongoose schemas
- Implement Google OAuth 2.0 integration
- Create protected routes with middleware
- Build React context for auth state management
- Set up React Navigation for mobile app

---

## 📋 Detailed Task Breakdown

### Backend Setup (Tickets 1-5)

#### Ticket 1: Initialize Express Server
**Commit**: `feat: initialize express server with cors and body-parser`

**What to Learn:**
- Express.js middleware architecture
- CORS configuration for cross-origin requests
- Body parsing for JSON and URL-encoded data

**Implementation Steps:**
1. Initialize Node.js project with `npm init`
2. Install Express, CORS, body-parser, dotenv
3. Create `server.js` entry point
4. Set up basic Express app with middleware
5. Configure environment variables
6. Add health check endpoint

**Acceptance Criteria:**
- Server starts on configured port
- CORS allows requests from frontend origin
- JSON and form data parsing works
- Health endpoint returns 200

**Resources:**
- Express.js documentation
- CORS middleware docs
- Environment variable best practices

---

#### Ticket 2: MongoDB Connection & User Model
**Commit**: `feat: add mongodb connection and user model`

**What to Learn:**
- MongoDB connection patterns
- Mongoose schema design
- User authentication data modeling
- Password hashing with bcrypt

**Implementation Steps:**
1. Install mongoose and bcrypt
2. Create database connection utility
3. Design User schema (email, password hash, name, createdAt)
4. Add password hashing middleware
5. Create user model methods (comparePassword)
6. Test connection and model creation

**Acceptance Criteria:**
- Database connects successfully
- User model can be created and saved
- Passwords are hashed before saving
- User can be queried by email

**Resources:**
- Mongoose documentation
- Bcrypt password hashing
- MongoDB connection strings

---

#### Ticket 3: JWT Authentication Endpoints
**Commit**: `feat: implement jwt authentication endpoints`

**What to Learn:**
- JWT token generation and verification
- Stateless authentication patterns
- Secure password validation
- Error handling in auth flows

**Implementation Steps:**
1. Install jsonwebtoken
2. Create `/auth/register` endpoint
3. Create `/auth/login` endpoint
4. Generate JWT tokens with user payload
5. Set token expiration (7 days)
6. Add input validation
7. Handle duplicate email errors

**Acceptance Criteria:**
- User can register with email/password
- User can login and receive JWT token
- Invalid credentials return proper errors
- Tokens contain user ID and email

**Resources:**
- JWT.io for token structure
- Express route handlers
- Input validation patterns

---

#### Ticket 4: Google OAuth Integration
**Commit**: `feat: add google oauth integration`

**What to Learn:**
- OAuth 2.0 authorization code flow
- Google OAuth API integration
- Token exchange and user info retrieval
- Linking OAuth accounts to users

**Implementation Steps:**
1. Set up Google Cloud Console project
2. Install googleapis or passport-google-oauth
3. Create `/auth/google/url` endpoint (generate consent URL)
4. Create `/auth/google/exchange` endpoint (exchange code for token)
5. Fetch user profile from Google API
6. Create or find user by Google ID
7. Generate JWT for authenticated user

**Acceptance Criteria:**
- Google OAuth consent URL generated
- Code exchange returns JWT token
- Google user info retrieved correctly
- Existing users can login with Google

**Resources:**
- Google OAuth 2.0 documentation
- OAuth 2.0 flow diagrams
- Google APIs Node.js client

---

#### Ticket 5: JWT Verification Middleware
**Commit**: `feat: add jwt verification middleware`

**What to Learn:**
- Express middleware patterns
- Token verification and extraction
- Protected route patterns
- Error handling in middleware

**Implementation Steps:**
1. Create `authMiddleware.js`
2. Extract token from Authorization header
3. Verify JWT signature and expiration
4. Attach user info to request object
5. Handle invalid/expired tokens
6. Apply middleware to protected routes

**Acceptance Criteria:**
- Valid tokens allow access to protected routes
- Invalid tokens return 401 Unauthorized
- User info available in `req.user`
- Expired tokens handled gracefully

**Resources:**
- Express middleware documentation
- JWT verification patterns
- Error handling best practices

---

### Web Frontend (Tickets 6-9)

#### Ticket 6: Initialize React App with Router
**Commit**: `feat: initialize react app with router`

**What to Learn:**
- React app structure and organization
- React Router setup and configuration
- Component architecture patterns
- Project folder structure

**Implementation Steps:**
1. Create React app with Vite or Create React App
2. Install React Router DOM
3. Set up route structure (/, /login, /register, /dashboard)
4. Create basic layout components
5. Configure routing with BrowserRouter
6. Add navigation structure

**Acceptance Criteria:**
- App runs without errors
- Routes navigate correctly
- Basic layout renders
- Router history works

**Resources:**
- React Router documentation
- React project structure guides
- Vite/React setup tutorials

---

#### Ticket 7: Login and Registration Forms
**Commit**: `feat: add login and registration forms`

**What to Learn:**
- React form handling
- Controlled components
- Form validation
- API integration with Axios

**Implementation Steps:**
1. Create Login component with form
2. Create Register component with form
3. Add form validation (email format, password strength)
4. Handle form submission
5. Integrate with auth API endpoints
6. Display error messages
7. Redirect on success

**Acceptance Criteria:**
- Forms validate input correctly
- API calls work correctly
- Error messages display properly
- Success redirects to dashboard

**Resources:**
- React forms documentation
- Form validation patterns
- Axios API client setup

---

#### Ticket 8: Auth Context and Protected Routing
**Commit**: `feat: add auth context and protected routing`

**What to Learn:**
- React Context API
- Custom hooks for auth state
- Protected route patterns
- Token storage and retrieval

**Implementation Steps:**
1. Create AuthContext with Provider
2. Implement auth state management (user, token, loading)
3. Create useAuth hook
4. Add login/logout functions
5. Create ProtectedRoute component
6. Wrap protected routes
7. Store token in localStorage

**Acceptance Criteria:**
- Auth state persists across page refreshes
- Protected routes redirect if not authenticated
- Auth context provides user info globally
- Logout clears state and token

**Resources:**
- React Context API documentation
- Custom hooks patterns
- Protected routes tutorial

---

#### Ticket 9: Dashboard Shell with Navigation
**Commit**: `feat: create dashboard shell with navigation`

**What to Learn:**
- Layout component patterns
- Navigation UI design
- Responsive design basics
- Component composition

**Implementation Steps:**
1. Create Dashboard layout component
2. Add navigation sidebar/menu
3. Create placeholder content areas
4. Add user profile display
5. Implement logout functionality
6. Style with CSS/Tailwind

**Acceptance Criteria:**
- Dashboard layout renders correctly
- Navigation works between sections
- User info displays
- Logout button works

**Resources:**
- React component composition
- CSS/Tailwind styling
- Navigation UI patterns

---

### Mobile App (Tickets 10-13)

#### Ticket 10: Initialize Expo React Native Project
**Commit**: `feat: initialize expo react native project`

**What to Learn:**
- Expo CLI and project structure
- React Native basics
- Mobile app architecture
- Development workflow

**Implementation Steps:**
1. Install Expo CLI
2. Create new Expo project
3. Understand project structure
4. Set up development environment
5. Test on iOS simulator/Android emulator
6. Configure app.json

**Acceptance Criteria:**
- Expo app runs on simulator
- Hot reload works
- Project structure is organized
- App displays basic screen

**Resources:**
- Expo documentation
- React Native basics
- Expo development workflow

---

#### Ticket 11: Configure React Navigation with Auth Flow
**Commit**: `feat: configure react navigation with auth flow`

**What to Learn:**
- React Navigation setup
- Stack and Tab navigators
- Navigation state management
- Auth flow navigation patterns

**Implementation Steps:**
1. Install React Navigation packages
2. Set up NavigationContainer
3. Create Auth stack (Login, Register)
4. Create Main stack (Dashboard, etc.)
5. Implement conditional navigation based on auth
6. Add navigation types

**Acceptance Criteria:**
- Navigation works between screens
- Auth flow navigates correctly
- Navigation state persists
- Back button works properly

**Resources:**
- React Navigation documentation
- Navigation patterns
- TypeScript navigation types

---

#### Ticket 12: Login Screen with Google OAuth
**Commit**: `feat: add login screen with google oauth`

**What to Learn:**
- React Native form components
- Google Sign-In integration
- Mobile UI/UX patterns
- AsyncStorage for token storage

**Implementation Steps:**
1. Create Login screen component
2. Add email/password input fields
3. Integrate Google Sign-In button
4. Handle form submission
5. Store token in AsyncStorage
6. Navigate to dashboard on success
7. Style with React Native StyleSheet

**Acceptance Criteria:**
- Login form works correctly
- Google Sign-In opens and completes
- Token stored securely
- Navigation works after login

**Resources:**
- React Native components
- Google Sign-In for React Native
- AsyncStorage documentation
- Mobile form patterns

---

#### Ticket 13: Secure Token Storage
**Commit**: `feat: add secure token storage with async storage`

**What to Learn:**
- Secure storage patterns
- AsyncStorage API
- Token refresh strategies
- Security best practices

**Implementation Steps:**
1. Create token storage utility
2. Implement save/retrieve/delete functions
3. Add token expiration checking
4. Create auth service layer
5. Integrate with login flow
6. Handle token refresh logic

**Acceptance Criteria:**
- Tokens stored securely
- Tokens retrieved on app restart
- Expired tokens handled
- Token deletion works

**Resources:**
- AsyncStorage documentation
- Secure storage patterns
- Token management best practices

---

## ✅ Demo Checkpoint

**What to Demonstrate:**
1. User can register with email/password on web
2. User can login on web and receive JWT token
3. User can login with Google OAuth on web
4. User can login on mobile app
5. Session persists when app is closed and reopened
6. Protected routes require authentication

**Success Criteria:**
- All authentication flows work
- No console errors
- UI is functional (doesn't need to be polished)
- Both web and mobile apps can authenticate

---

## 📚 Learning Resources

### Authentication
- JWT.io - Understanding JSON Web Tokens
- OAuth 2.0 Simplified
- Express.js Security Best Practices

### MongoDB & Mongoose
- Mongoose Getting Started Guide
- MongoDB University (free courses)
- Schema Design Patterns

### React & React Native
- React Official Tutorial
- React Native Documentation
- Expo Documentation

### Development Tools
- Git workflow and commits
- Environment variables
- API testing with Postman/Insomnia

---

## 🐛 Common Issues & Solutions

**Issue**: MongoDB connection fails
- **Solution**: Check connection string, ensure MongoDB is running, verify network access

**Issue**: JWT token invalid
- **Solution**: Verify secret key matches, check token expiration, ensure proper header format

**Issue**: Google OAuth redirect URI mismatch
- **Solution**: Verify redirect URI in Google Console matches exactly (including http vs https)

**Issue**: React Native navigation errors
- **Solution**: Ensure all navigation packages are installed, check navigation structure

---

## 📝 Notes

- Focus on understanding the authentication flow, not just making it work
- Test each commit before moving to the next
- Keep commits small and focused
- Document any decisions or gotchas in code comments
- Ask questions when stuck - better to understand than guess

