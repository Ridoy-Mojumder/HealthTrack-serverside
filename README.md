# HealthTrack Server Side

## Project Overview
HealthTrack Server Side is the backend component of the HealthTrack web application, designed to manage appointments, patient records, test results, and administrative tasks for a diagnostic center. It provides robust API endpoints for data management and integration with the client-side application.

## Features
- **User Management:** CRUD operations for users, including registration, login, and profile management.
- **Appointment Management:** APIs for booking, canceling, and managing appointments.
- **Test Management:** APIs for accessing, managing, and submitting test results.
- **Admin Dashboard:** APIs for managing users, tests, reservations, and statistical data visualization.

## Technology Used
- **Backend Framework:** Node.js, Express.js
- **Database:** MongoDB
- **Authentication:** Firebase Authentication
- **Deployment:** Heroku

## Local Setup Instructions
1. Clone the repository: `git clone https://github.com/Ridoy-Mojumder/HealthTrack-serverside`
2. Navigate to the project directory: `cd HealthTrack-serverside`
3. Install dependencies: `npm install`
4. Set up environment variables (e.g., MongoDB URI, Firebase credentials).
5. Start the server: `nodemon index.js`
6. The server will start running on `http://localhost:3000`

