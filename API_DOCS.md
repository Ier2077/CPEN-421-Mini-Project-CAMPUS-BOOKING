# API Documentation

## Auth Endpoints

### POST /auth/login
Authenticate user.
- Request: `{ "username": "string", "password": "string" }`
- Response: `{ "token": "string", "user": { ... } }` or error.

### POST /auth/logout
Log out user.
- Request: none
- Response: `{ "message": "Logged out" }`

### POST /auth/register
Register new user.
- Request: `{ "username": "string", "password": "string", ... }`
- Response: `{ "user": { ... } }` or error.

### GET /auth/me
Get current user info.
- Request: none
- Response: `{ "user": { ... } }`

---

## Booking Endpoints

### GET /bookings
Get all bookings (admin) or own bookings (user).
- Response: `[ { booking }, ... ]`

### GET /bookings/:id
Get booking by ID (owner or admin).
- Response: `{ booking }`

### POST /bookings
Create a booking (user must be logged in).
- Request: `{ facilityId, date, ... }`
- Response: `{ booking }`

### PUT /bookings/:id
Update booking (owner or admin).
- Request: `{ ...fields to update... }`
- Response: `{ booking }`

### DELETE /bookings/:id
Delete booking (owner or admin).
- Response: `{ message: "Deleted" }`

---

## Facility Endpoints

### GET /facilities
Get all facilities.
- Response: `[ { facility }, ... ]`

### GET /facilities/:id
Get facility by ID.
- Response: `{ facility }`

### POST /facilities
Create facility (admin only).
- Request: `{ name, location, ... }`
- Response: `{ facility }`

### PUT /facilities/:id
Update facility (admin only).
- Request: `{ ...fields to update... }`
- Response: `{ facility }`

### DELETE /facilities/:id
Delete facility (admin only).
- Response: `{ message: "Deleted" }`

---

## Error Responses
All endpoints may return errors in the format:
```json
{
  "error": "Error message here"
}
```
