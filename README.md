# Bookstore Full-Stack Application

A complete full-stack bookstore application with React frontend, Express.js backend with MongoDB, and React admin panel.

## Project Structure

```
bookstore/
├── front/          # React Frontend (Customer-facing)
├── back/           # Node.js/Express Backend with MongoDB
├── admin/          # React Admin Panel
├── package.json    # Root package.json with scripts
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Clone or navigate to the project directory**

2. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables:**
   - Copy `back/.env.example` to `back/.env`
   - Update the MongoDB URI and other settings

4. **Start MongoDB** (if running locally):
   ```bash
   mongod
   ```

### Running the Application

#### Development Mode (Recommended)
Run all three parts simultaneously:
```bash
npm run dev
```

This will start:
- Frontend: http://localhost:5173
- Backend: http://localhost:5100
- Admin Panel: http://localhost:3000

#### Individual Services
```bash
# Frontend only
npm run dev:front

# Backend only
npm run dev:back

# Admin only
npm run dev:admin
```

#### Production Mode
```bash
npm run start
```

## API Endpoints

### Books
- `GET /api/books` - Get all books
- `GET /api/books/:id` - Get single book
- `POST /api/books` - Create book (admin)
- `PUT /api/books/:id` - Update book (admin)
- `DELETE /api/books/:id` - Delete book (admin)

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

## Features

### Frontend (Customer)
- Browse books with carousel
- Search and filter books
- User authentication
- Shopping cart and checkout
- User dashboard

### Admin Panel
- Manage books (CRUD operations)
- Manage users
- View orders
- Analytics dashboard

### Backend
- RESTful API
- MongoDB database
- JWT authentication
- File upload support
- Rate limiting and security

## Technology Stack

### Frontend
- React 18
- React Router
- Tailwind CSS
- Vite

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- CORS, Helmet, Rate Limiting

### Admin Panel
- React 18
- React Router
- Tailwind CSS (can be customized)

## Development

### Adding New Features
1. Frontend features: Work in `front/` directory
2. Backend APIs: Work in `back/` directory
3. Admin features: Work in `admin/` directory

### Database Schema
Books, Users, Orders, Categories, etc. (defined in `back/models/`)

## Deployment

Each part can be deployed separately:
- Frontend: Vercel, Netlify, or any static hosting
- Backend: Heroku, Railway, or any Node.js hosting
- Admin: Same as frontend
- Database: MongoDB Atlas or any MongoDB hosting

## Contributing

1. Create a feature branch
2. Make changes in the appropriate directory
3. Test all three parts
4. Submit a pull request

## License

MIT License