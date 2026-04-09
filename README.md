# Library Book Management System

A full-stack library management system with role-based access control for Librarians and Members.

---

## Tech Stack

**Backend:** Node.js, Express, Prisma ORM, PostgreSQL, JWT, Multer  
**Frontend:** React, Vite, Tailwind CSS, Axios, React Router

---

## Project Structure

```
root/
├── backend/
└── frontend/
```

---

## Setup Steps

### Prerequisites

- Node.js v18+
- PostgreSQL (running locally or remote)

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

**Required environment variables** (`backend/.env`):

| Variable       | Description                        | Example                                              |
|----------------|------------------------------------|------------------------------------------------------|
| `PORT`         | Port the server runs on            | `5000`                                               |
| `DATABASE_URL` | PostgreSQL connection string       | `postgresql://user:password@localhost:5432/library_db` |
| `JWT_SECRET`   | Secret key for signing JWT tokens  | `your_secret_key`                                    |

---

### 3. Run Migrations

```bash
npx prisma migrate dev --name init
```

This will create all the required tables in your database.

---

### 4. Seed Test Data

```bash
npx prisma db seed
```

This will create the following default accounts and sample books:

**Default Accounts:**

| Role      | Email                    | Password      |
|-----------|--------------------------|---------------|
| Librarian | librarian@library.com    | password123   |
| Member    | russel@library.com       | password123   |

**Sample Books:** The Great Gatsby, To Kill a Mockingbird, 1984, Clean Code, The Pragmatic Programmer

---

### 5. Start the Backend Server

```bash
npm run dev
```

Server will run on `http://localhost:5000`

---

### 6. Frontend Setup

```bash
cd ../frontend
npm install
```

Copy the example env file:

```bash
cp .env.example .env
```

**Required environment variables** (`frontend/.env`):

| Variable       | Description              | Example                        |
|----------------|--------------------------|--------------------------------|
| `VITE_API_URL` | Backend API base URL     | `http://localhost:5000/api`    |

---

### 7. Start the Frontend

```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

---

## Features

### Librarian
- Add, edit, and delete books (with optional cover image upload)
- View and search all members, activate/deactivate accounts
- Approve or reject borrow requests
- View all borrowing history across all members

### Member
- Browse and search the book catalogue by title, author, or genre
- Submit a borrow request for an available book
- Return a borrowed book
- View own borrowing history

---

## API Endpoints

### Auth
| Method | Endpoint         | Access  | Description          |
|--------|------------------|---------|----------------------|
| POST   | /api/auth/register | Public  | Register new account |
| POST   | /api/auth/login    | Public  | Login                |
| POST   | /api/auth/logout   | Auth    | Logout (blacklist token) |
| GET    | /api/auth/me       | Auth    | Get current user     |

### Books
| Method | Endpoint         | Access     | Description          |
|--------|------------------|------------|----------------------|
| GET    | /api/books       | Auth       | List books (paginated, searchable) |
| GET    | /api/books/:id   | Auth       | Get single book      |
| GET    | /api/books/genres | Auth      | Get all genres       |
| POST   | /api/books       | Librarian  | Create book          |
| PUT    | /api/books/:id   | Librarian  | Update book          |
| DELETE | /api/books/:id   | Librarian  | Delete book          |

### Borrows
| Method | Endpoint                    | Access     | Description              |
|--------|-----------------------------|------------|--------------------------|
| POST   | /api/borrows/books/:bookId  | Member     | Request to borrow a book |
| GET    | /api/borrows/my-history     | Member     | View own borrow history  |
| PATCH  | /api/borrows/:id/return     | Member     | Return a book            |
| GET    | /api/borrows                | Librarian  | View all borrow history  |
| GET    | /api/borrows/pending        | Librarian  | View pending requests    |
| PATCH  | /api/borrows/:id/approve    | Librarian  | Approve borrow request   |
| PATCH  | /api/borrows/:id/reject     | Librarian  | Reject borrow request    |

### Members
| Method | Endpoint                        | Access     | Description              |
|--------|---------------------------------|------------|--------------------------|
| GET    | /api/members                    | Librarian  | List all members         |
| GET    | /api/members/:id                | Librarian  | Get member detail        |
| PATCH  | /api/members/:id/toggle-status  | Librarian  | Activate/deactivate      |
