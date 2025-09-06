## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn or pnpm

### Installation

1. **Clone and install dependencies**

   ```bash
   git clone <repository-url>
   cd leaves
   npm install
   ```

2. **Environment Setup**

   Create a `.env` file in the project root:

   ```env
   # Database
   DATABASE_URL="file:./dev.db"

   # Server
   PORT=4000
   ```

### Database Setup

3. **Generate Prisma Client**

   ```bash
   npm run db:generate
   ```

4. **Push Database Schema**

   ```bash
   npm run db:push
   ```

5. **Seed the Database**

   ```bash
   npm run db:seed
   ```

   This will create:

   - 5 employees (2 managers, 3 regular employees)
   - Leave balances for all employees
   - 2 sample leave requests

### Viewing Database Data

#### Option 1: Prisma Studio (Recommended)

```bash
npm run db:studio
```

- Opens web interface at `http://localhost:5555`
- Visual database browser and editor
- Shows table relationships
- Allows data editing

#### Option 2: Traditional SQLite Tools

**Using DB Browser for SQLite:**

1. Download [DB Browser for SQLite](https://sqlitebrowser.org/)
2. Open file: `prisma/dev.db`
3. Browse and query your data

**Using SQLite Command Line:**

```bash
# Navigate to project directory
\leaves

# Open SQLite CLI
sqlite3 prisma/dev.db

# View tables
.tables

# Query data
SELECT * FROM employees;
SELECT * FROM leaves;
SELECT * FROM leave_balances;

# Exit
.exit
```

### Running the Application

6. **Build the application**

   ```bash
   npm run build
   ```

7. **Start the server**

   ```bash
   npm run serve:ssr:leaves
   ```

   The application will be available at `http://localhost:4000`

## API Endpoints

### Employee Endpoints

- `GET /api/employees` - Get all employees
- `GET /api/employees/:employeeId` - Get specific employee
- `POST /api/employees` - Create new employee
- `GET /api/employees/:employeeId/subordinates` - Get employee's subordinates

### Leave Endpoints

- `GET /api/employees/:employeeId/leaves` - Get employee's leaves
- `GET /api/managers/:managerId/leaves` - Get leaves for manager's subordinates
- `POST /api/leaves` - Create new leave request
- `PATCH /api/leaves/:leaveId/status` - Update leave status (approve/reject)
- `DELETE /api/leaves/:leaveId` - Delete leave request

### Leave Balance Endpoints

- `GET /api/employees/:employeeId/balance` - Get employee's leave balance

## Development Commands

```bash
# Database commands
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema to database
npm run db:migrate     # Create migration
npm run db:studio      # Open Prisma Studio
npm run db:seed        # Seed database with sample data

# Application commands
npm start              # Development server
npm run build          # Build for production
npm run serve:ssr:leaves # Serve production build
npm test               # Run tests
```

## Database Schema Details

The application uses three main tables:

- **employees**: User accounts with hierarchical manager relationships
- **leaves**: Leave requests with approval workflow
- **leave_balances**: Annual leave entitlements and usage tracking

## Sample Data

After seeding, you'll have:

**Managers:**

- K000001 - Velthoven Jeroen-van
- K000002 - Eszter Nasz

**Employees:**

- K012345 - Mohammad Farhadi (reports to Velthoven Jeroen-van)
- K012346 - Bertold Oravecz (reports to Velthoven Jeroen-van)
- K012347 - Carol Davis (reports to Eszter Nasz)

**Sample Leaves:**

- Alice's approved summer vacation
- Bob's pending Christmas break request

## File Structure

```
leaves/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.ts               # Database seed file
│   └── dev.db                # SQLite database file
├── src/
│   ├── app/                  # Angular frontend
│   └── server/               # Express backend
│       ├── controllers/      # API controllers
│       ├── services/         # Business logic
│       └── routes/           # API routes
├── package.json
└── README.md
```
