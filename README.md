# Social Media DB Viewer

A clean, premium, lightweight Social Media Database Viewer designed for the DBMS course project. Connects to a local MySQL instance (Docker / TablePlus) and displays live analytics, social feeds, user statistics, hashtag distributions, and user group details.

## Tech Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (no external CSS or JS libraries, no frameworks)
- **Backend**: Node.js core `http` module, `mysql2` driver (no Express, no other package dependencies)
- **Visualization**: Pure HTML5 Canvas rendering for dynamic, interactive custom charts

## Installation & Setup

1. Make sure your local MySQL instance is running on port `3306` with credentials:
   - User: `root`
   - Password: `secretpassword`
   - Database: `social_media_db`

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Run the backend server:
   ```bash
   node server.js
   ```

4. Open `index.html` directly in your browser.
