# Campus Facility Booking System

## Overview
This project is a web-based campus facility booking system with authentication. It allows users to register, log in, and book campus facilities. Admins can manage facilities and bookings.

## Features
- User registration and authentication
- Facility listing and management
- Booking creation, update, and cancellation
- Role-based access (user/admin)
- RESTful API
- Frontend and backend separation

## Technologies Used
- Node.js
- Express.js
- SQLite (or your DB)
- HTML, CSS, JavaScript (frontend)

## Project Structure
```
app.js
config/
controllers/
frontend/
middleware/
models/
routes/
```

## How It Works
- Users register and log in.
- Authenticated users can view and book facilities.
- Admins can add, update, or delete facilities.
- Bookings can be created, updated, or deleted by users (with permissions).

## Setup Instructions
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up your `.env` file
4. Run migrations: `npm run migrate` (if available)
5. Start the server: `npm start`

## Deployment
- Backend and frontend can be deployed separately (e.g., Render).
- CORS is enabled for frontend-backend communication.

## Placeholder for Images
![System Architecture](images/architecture.png)
![UI Screenshot](images/ui.png)

## API Documentation
See [API_DOCS.md](API_DOCS.md) for detailed endpoint information.

## Authors
- Your Name
- Collaborators

## License
Specify your license here.
