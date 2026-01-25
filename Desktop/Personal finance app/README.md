# finance

A full-stack personal finance management application with authentication, built with HTML, CSS, JavaScript, Node.js, Express, and SQLite.

## Features

### Core Features
- ✅ User Authentication (Register/Login/Logout)
- ✅ Overview Dashboard with at-a-glance data
- ✅ Transaction Management (CRUD)
- ✅ Budget Management (CRUD)
- ✅ Savings Pots (CRUD)
- ✅ Recurring Bills Management
- ✅ Category Management
- ✅ Dark Mode
- ✅ Data Export/Import
- ✅ Monthly Spending Trends

### UI/UX Features
- ✅ Smooth Animations and Transitions
- ✅ Responsive Design (Mobile, Tablet, Desktop)
- ✅ Keyboard Navigation
- ✅ Form Validation
- ✅ Loading States
- ✅ Error Handling

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

3. Open your browser and navigate to:
```
http://localhost:3000
```

## Project Structure

```
personal-finance-app/
├── server.js              # Express server with API routes
├── package.json           # Node.js dependencies
├── finance.db             # SQLite database (created automatically)
├── index.html             # Main HTML file
├── css/
│   ├── styles.css         # Main styles
│   ├── pages.css          # Page-specific styles
│   └── animations.css     # Animations and transitions
├── js/
│   ├── api.js             # API client (ES6 modules)
│   ├── auth.js            # Authentication module
│   ├── app.js             # Main application logic
│   ├── router.js          # Hash-based routing
│   ├── store.js           # Data store (localStorage fallback)
│   ├── utils.js           # Utility functions
│   ├── charts.js          # Chart rendering
│   ├── components.js      # Reusable UI components
│   ├── validation.js      # Form validation
│   ├── settings.js        # Settings page
│   └── keyboard.js        # Keyboard navigation
└── data/
    └── sample-data.js     # Sample data for seeding
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Budgets
- `GET /api/budgets` - Get all budgets
- `POST /api/budgets` - Create budget
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget

### Pots
- `GET /api/pots` - Get all pots
- `POST /api/pots` - Create pot
- `PUT /api/pots/:id` - Update pot
- `DELETE /api/pots/:id` - Delete pot

### Recurring Bills
- `GET /api/recurring-bills` - Get all recurring bills
- `POST /api/recurring-bills` - Create recurring bill
- `PUT /api/recurring-bills/:id` - Update recurring bill
- `DELETE /api/recurring-bills/:id` - Delete recurring bill

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

## Environment Variables

Create a `.env` file (optional):
```
PORT=3000
JWT_SECRET=your-secret-key-change-in-production
```

## Security Notes

- Passwords are hashed using bcrypt
- JWT tokens are used for authentication
- All API routes (except auth) require authentication
- SQL injection protection via parameterized queries

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

ISC
