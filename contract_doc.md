# AI-Powered LinkedIn Post Automation Chrome Extension
## API Contract and Coding Conventions

## 1. Overview

This document defines the agreed API contracts and coding conventions for the AI-Powered LinkedIn Post Automation Chrome Extension project.

The current product scope includes:
- User signup and login
- Authenticated access to protected endpoints
- AI-powered LinkedIn post generation
- Separate structured output for:
  - post content
  - hashtags
  - CTA
- Draft saving and retrieval
- Usage event logging

## 2. General API Standards

### 2.1 Base URL
Development base URL example:

```
http://localhost:5000/api
```

### 2.2 Content Type
All JSON request bodies must use:

```http
Content-Type: application/json
```

### 2.3 Authentication
Protected endpoints must include:

```http
Authorization: Bearer <jwt_token>
```

### 2.4 Standard Success Response Shape
All successful responses should follow this structure:

```json
{
  "success": true,
  "data": {}
}
```

### 2.5 Standard Error Response Shape
All failed responses should follow this structure:

```json
{
  "success": false,
  "message": "Human-readable error message"
}
```

### 2.6 Validation Error Response Shape
For invalid input:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "field_name": "Specific reason"
  }
}
```

### 2.7 Timestamp Format
All timestamps must be returned in ISO 8601 format.

Example:

```
2026-03-16T13:45:00.000Z
```

## 3. Endpoint Summary

### Public Endpoints
- `GET /health`
- `POST /auth/signup`
- `POST /auth/login`

### Protected Endpoints
- `GET /auth/me`
- `POST /posts/generate`
- `POST /drafts`
- `GET /drafts`
- `GET /drafts/:id`
- `PUT /drafts/:id`
- `DELETE /drafts/:id`
- `POST /events`

## 4. Full API Contracts

---

## 4.1 Health Check

### Endpoint
`GET /health`

### Purpose
Confirms the backend server is available.

### Request Body
None.

### Success Response
```json
{
  "success": true,
  "data": {
    "message": "Server is running"
  }
}
```

---

## 4.2 User Signup

### Endpoint
`POST /auth/signup`

### Purpose
Creates a new user account and returns an authentication token.

### Request Body
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "password": "StrongPassword123"
}
```

### Field Rules
- `full_name`: required, string, minimum 2 characters
- `email`: required, valid email, unique
- `password`: required, string, minimum 8 characters

### Success Response
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "9dd1d9d6-c1c3-4d22-bf89-37f1f4fdb09c",
      "full_name": "John Doe",
      "email": "john@example.com",
      "created_at": "2026-03-16T13:45:00.000Z"
    },
    "token": "jwt_token_here"
  }
}
```

### Error Response Examples
#### Email already exists
```json
{
  "success": false,
  "message": "Email already in use"
}
```

#### Validation failure
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "password": "Password must be at least 8 characters long"
  }
}
```

---

## 4.3 User Login

### Endpoint
`POST /auth/login`

### Purpose
Authenticates a user and returns a JWT token.

### Request Body
```json
{
  "email": "john@example.com",
  "password": "StrongPassword123"
}
```

### Field Rules
- `email`: required, valid email
- `password`: required

### Success Response
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "9dd1d9d6-c1c3-4d22-bf89-37f1f4fdb09c",
      "full_name": "John Doe",
      "email": "john@example.com"
    },
    "token": "jwt_token_here"
  }
}
```

### Error Response Example
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

## 4.4 Get Current Authenticated User

### Endpoint
`GET /auth/me`

### Purpose
Returns profile information for the currently authenticated user.

### Headers
```http
Authorization: Bearer <jwt_token>
```

### Success Response
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "9dd1d9d6-c1c3-4d22-bf89-37f1f4fdb09c",
      "full_name": "John Doe",
      "email": "john@example.com",
      "created_at": "2026-03-16T13:45:00.000Z"
    }
  }
}
```

### Error Response Example
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

---

## 4.5 Generate LinkedIn Post

### Endpoint
`POST /posts/generate`

### Purpose
Generates a LinkedIn post from user input and returns separate structured fields for post content, hashtags, and CTA.

### Headers
```http
Authorization: Bearer <jwt_token>
```

### Request Body
```json
{
  "prompt": "I built my first Node.js Chrome extension and learned a lot about browser APIs and product thinking.",
  "tone": "professional",
  "goal": "project showcase"
}
```

### Field Rules
- `prompt`: required, string, max recommended 2000 characters
- `tone`: required, string
- `goal`: required, string

### Success Response
```json
{
  "success": true,
  "data": {
    "post": "I recently built my first Node.js Chrome extension, and the process taught me a lot about browser APIs, user workflows, and product thinking. Building it pushed me to think beyond code and focus on solving a real user problem with a simple interface. It reminded me that the best projects are the ones that make people’s work easier.",
    "hashtags": ["#NodeJS", "#ChromeExtension", "#ProductThinking"],
    "cta": "What project has taught you the most lately?",
    "generated_post_id": "5c1f3f1d-cf52-4bc3-8b8e-78852d2fbbab",
    "created_at": "2026-03-16T14:02:00.000Z"
  }
}
```

### Notes
- `post` must not include hashtags inside the main post body
- `hashtags` must be returned separately as an array of strings
- `cta` must be returned separately as a single string
- the frontend may combine `post`, `cta`, and `hashtags` when inserting into LinkedIn

### Error Response Example
```json
{
  "success": false,
  "message": "Prompt is required"
}
```

---

## 4.6 Save Draft

### Endpoint
`POST /drafts`

### Purpose
Saves a draft so the user can access it later across devices.

### Headers
```http
Authorization: Bearer <jwt_token>
```

### Request Body
```json
{
  "title": "My Node.js Extension Post",
  "original_prompt": "I built my first Node.js Chrome extension and learned a lot about browser APIs and product thinking.",
  "tone": "professional",
  "goal": "project showcase",
  "draft_content": "I recently built my first Node.js Chrome extension, and the process taught me a lot about browser APIs, user workflows, and product thinking.",
  "hashtags": ["#NodeJS", "#ChromeExtension", "#ProductThinking"],
  "cta": "What project has taught you the most lately?"
}
```

### Success Response
```json
{
  "success": true,
  "data": {
    "draft": {
      "id": "f3b2f6ac-2695-4a8b-830d-b0f3eb111a70",
      "user_id": "9dd1d9d6-c1c3-4d22-bf89-37f1f4fdb09c",
      "title": "My Node.js Extension Post",
      "original_prompt": "I built my first Node.js Chrome extension and learned a lot about browser APIs and product thinking.",
      "tone": "professional",
      "goal": "project showcase",
      "draft_content": "I recently built my first Node.js Chrome extension, and the process taught me a lot about browser APIs, user workflows, and product thinking.",
      "hashtags": ["#NodeJS", "#ChromeExtension", "#ProductThinking"],
      "cta": "What project has taught you the most lately?",
      "created_at": "2026-03-16T14:10:00.000Z",
      "updated_at": "2026-03-16T14:10:00.000Z"
    }
  }
}
```

### Error Response Example
```json
{
  "success": false,
  "message": "Draft content is required"
}
```

---

## 4.7 Get All Drafts

### Endpoint
`GET /drafts`

### Purpose
Returns all drafts owned by the authenticated user.

### Headers
```http
Authorization: Bearer <jwt_token>
```

### Success Response
```json
{
  "success": true,
  "data": {
    "drafts": [
      {
        "id": "f3b2f6ac-2695-4a8b-830d-b0f3eb111a70",
        "title": "My Node.js Extension Post",
        "tone": "professional",
        "goal": "project showcase",
        "draft_content": "I recently built my first Node.js Chrome extension...",
        "hashtags": ["#NodeJS", "#ChromeExtension", "#ProductThinking"],
        "cta": "What project has taught you the most lately?",
        "created_at": "2026-03-16T14:10:00.000Z",
        "updated_at": "2026-03-16T14:10:00.000Z"
      }
    ]
  }
}
```

---

## 4.8 Get Draft By ID

### Endpoint
`GET /drafts/:id`

### Purpose
Returns a single draft belonging to the authenticated user.

### Headers
```http
Authorization: Bearer <jwt_token>
```

### Success Response
```json
{
  "success": true,
  "data": {
    "draft": {
      "id": "f3b2f6ac-2695-4a8b-830d-b0f3eb111a70",
      "title": "My Node.js Extension Post",
      "original_prompt": "I built my first Node.js Chrome extension and learned a lot about browser APIs and product thinking.",
      "tone": "professional",
      "goal": "project showcase",
      "draft_content": "I recently built my first Node.js Chrome extension, and the process taught me a lot about browser APIs, user workflows, and product thinking.",
      "hashtags": ["#NodeJS", "#ChromeExtension", "#ProductThinking"],
      "cta": "What project has taught you the most lately?",
      "created_at": "2026-03-16T14:10:00.000Z",
      "updated_at": "2026-03-16T14:20:00.000Z"
    }
  }
}
```

### Error Response Example
```json
{
  "success": false,
  "message": "Draft not found"
}
```

---

## 4.9 Update Draft

### Endpoint
`PUT /drafts/:id`

### Purpose
Updates a draft belonging to the authenticated user.

### Headers
```http
Authorization: Bearer <jwt_token>
```

### Request Body
```json
{
  "title": "Updated Node.js Extension Post",
  "draft_content": "Updated draft text here",
  "hashtags": ["#NodeJS", "#Automation", "#ChromeExtension"],
  "cta": "What project pushed your skills forward recently?"
}
```

### Success Response
```json
{
  "success": true,
  "data": {
    "draft": {
      "id": "f3b2f6ac-2695-4a8b-830d-b0f3eb111a70",
      "title": "Updated Node.js Extension Post",
      "draft_content": "Updated draft text here",
      "hashtags": ["#NodeJS", "#Automation", "#ChromeExtension"],
      "cta": "What project pushed your skills forward recently?",
      "updated_at": "2026-03-16T14:30:00.000Z"
    }
  }
}
```

---

## 4.10 Delete Draft

### Endpoint
`DELETE /drafts/:id`

### Purpose
Deletes a draft belonging to the authenticated user.

### Headers
```http
Authorization: Bearer <jwt_token>
```

### Success Response
```json
{
  "success": true,
  "data": {
    "message": "Draft deleted successfully"
  }
}
```

---

## 4.11 Log Usage Event

### Endpoint
`POST /events`

### Purpose
Logs product usage events for analytics and tracking.

### Headers
```http
Authorization: Bearer <jwt_token>
```

### Request Body
```json
{
  "event_type": "post_copied",
  "metadata": {
    "generated_post_id": "5c1f3f1d-cf52-4bc3-8b8e-78852d2fbbab"
  }
}
```

### Recommended Event Types
- `user_signup`
- `user_login`
- `post_generated`
- `post_generation_failed`
- `draft_saved`
- `draft_updated`
- `draft_deleted`
- `post_copied`
- `post_inserted`

### Success Response
```json
{
  "success": true,
  "data": {
    "message": "Event logged successfully"
  }
}
```

---

## 5. Recommended Prompt Strategy for AI Generation

The backend prompt should be written to return separate fields for post, hashtags, and CTA.

### Prompt Template
```
You are a professional LinkedIn content assistant.

Write a LinkedIn post based on the following input.

Topic: {{prompt}}
Tone: {{tone}}
Goal: {{goal}}

Rules:
- Start with a strong hook
- Keep paragraphs short
- Make it sound natural, not robotic
- End with a thoughtful CTA
- Suggest exactly 3 relevant hashtags
- Do not include hashtags inside the main post body
- Return valid JSON only

Return this exact structure:
{
  "post": "Main post body here",
  "hashtags": ["#tag1", "#tag2", "#tag3"],
  "cta": "Thoughtful closing line or question"
}
```

## 6. Coding Conventions - Industry Standard for Node.js Projects

These conventions are mandatory for this project.

### 6.1 Naming

#### Variables and Functions
- Use `camelCase`
- Examples:
  - `generatePost`
  - `userId`
  - `draftContent`

#### Classes
- Use `PascalCase`
- Examples:
  - `PostService`
  - `AuthController`

#### File Names
Choose one consistent style and apply it across the project.

Recommended for this project:
- use framework-like naming for non-class files
- examples:
- `postController.js`
- `authMiddleware.js`


#### Constants
- Use `UPPER_SNAKE_CASE`
- Examples:
  - `JWT_SECRET`
  - `MAX_PROMPT_LENGTH`

#### Database Naming
- Table names: `snake_case` plural
  - `users`
  - `generated_posts`
  - `usage_events`
- Column names: `snake_case`
  - `created_at`
  - `password_hash`
  - `draft_content`

### 6.2 Formatting

- Use 2 spaces for indentation
- Use semicolons
- Use double quotes in JavaScript files
- Use trailing commas where formatter supports them
- Keep lines reasonably short, ideally under 100 characters where practical
- Use one blank line between logical blocks
- Use Prettier to enforce formatting automatically

#### Example
```js
async function generatePost(req, res, next) {
  try {
    const { prompt, tone, goal } = req.body;

    const result = await postService.generatePost({ prompt, tone, goal });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}
```

### 6.3 Folder Structure

Use separation of concerns.

### Recommended Backend Structure
```
src/
  config/
  routes/
  controllers/
  services/
  middleware/
  utils/
  db/
  validators/
  app.js
  server.js
```

### Responsibility Rules
- `routes/`: endpoint definitions only
- `controllers/`: request/response handling only
- `services/`: business logic
- `middleware/`: auth, validation, error interception
- `utils/`: helpers and pure utility functions
- `db/`: query files, migrations, seed scripts, or repository code
- `validators/`: request validation schemas

### Extension Structure
```
extension/
  manifest.json
  popup.html
  popup.css
  popup.js
  background.js
  content.js
  utils/
  icons/
```

### 6.4 Error Handling

- Never expose raw internal errors to the client
- Always return structured JSON errors
- Use centralized error middleware in Express
- Validate request input before processing
- Use clear, human-readable messages
- Log internal errors on the server side

#### Standard Error Response
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

#### Validation Error Response
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": "Email is required"
  }
}
```

#### Rules
- 400: bad request / validation issues
- 401: unauthorized
- 403: forbidden
- 404: resource not found
- 409: conflict, such as duplicate email
- 500: internal server error

### 6.5 Git Style

#### Branch Naming
Use descriptive branch names.

Examples:
- `feature/auth-signup`
- `feature/post-generation`
- `feature/draft-api`
- `fix/linkedin-editor-insert`
- `chore/prettier-eslint-setup`

#### Commit Message Style
Use conventional commit style where possible.

Examples:
- `feat: add signup endpoint`
- `feat: implement post generation service`
- `fix: handle missing token in auth middleware`
- `refactor: move ai logic into service layer`
- `docs: add API contract document`
- `chore: set up prettier and eslint`

#### Pull Request Rules
- One feature or fix per pull request where possible
- PR title should clearly state the change
- Include summary, screenshots if UI changed, and test notes
- Do not merge broken or unreviewed code into `main`

#### Branch Flow
Recommended:
- `main`: stable production-ready branch
- `dev`: integration branch
- feature branches merge into `dev`
- `dev` merges into `main` after testing

## 7. Final Team Agreements

The team agrees that:
- hashtags must remain separate from the main post content
- CTA must remain separate from the main post content
- the popup must include separate text areas or display sections for:
  - generated post
  - hashtags
  - CTA
- all protected endpoints require JWT authentication
- all API responses must follow the agreed response structure
- all code must follow the agreed coding conventions in this document

