![reduce.png](blob/cover.png)

# Reduce

A minimal URL shortener with user accounts, custom short codes, and password-protected links.

## Features

- **Shorten URLs** — works anonymously or logged-in
- **User accounts** — register / login with username & password (JWT)
- **Custom short codes** — choose your own slug (logged-in users)
- **Protected links** — require authentication before redirect (uses account credentials or custom)
- **Dashboard** — view, edit, and delete your links
- **Click tracking** — see how many times each link was visited
- **QR codes** — generated for every shortened URL

## Production

- **Frontend & Short links**: https://r.webark.in
- **API**: https://api.r.webark.in

## Tech Stack

| Layer    | Stack                          |
| -------- | ------------------------------ |
| Backend  | Go · Echo · GORM · SQLite     |
| Frontend | React · TypeScript · Tailwind  |
| Auth     | JWT (72 h expiry) · bcrypt     |

## API

### Auth

| Method | Path              | Auth | Description       |
| ------ | ----------------- | ---- | ----------------- |
| POST   | `/auth/register`  | —    | Create account    |
| POST   | `/auth/login`     | —    | Get JWT token     |
| GET    | `/auth/me`        | JWT  | Current user info |

### Links (public)

| Method | Path                   | Auth     | Description                           |
| ------ | ---------------------- | -------- | ------------------------------------- |
| POST   | `/reduce/shorten`      | Optional | Create short link                     |
| GET    | `/reduce/:code`        | —        | Resolve short code                    |
| POST   | `/reduce/:code/verify` | —        | Verify credentials for protected link |

### Links (dashboard)

| Method | Path           | Auth | Description     |
| ------ | -------------- | ---- | --------------- |
| GET    | `/links`       | JWT  | List your links |
| PUT    | `/links/:id`   | JWT  | Update a link   |
| DELETE | `/links/:id`   | JWT  | Delete a link   |

## Quick Start

### Backend

```bash
cd backend
# Edit .env and set a secure JWT_SECRET:
# openssl rand -base64 32
go run .
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Docker

```bash
JWT_SECRET=$(openssl rand -base64 32) docker compose up --build
```

## Database

SQLite with two tables:

- **users** — id, username, password (bcrypt), timestamps
- **links** — id, user_id (nullable), code (unique), long_url, is_custom, requires_auth, access_username, access_password (bcrypt), click_count, timestamps

### Protected Links

When a logged-in user creates a protected link, they can choose:
- **Use account credentials** — visitors must enter the owner's username/password
- **Custom credentials** — set specific username/password for this link only

## Contributing

Contributions welcome — feel free to open issues or submit pull requests.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
