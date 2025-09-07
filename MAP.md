# Leave Management System - Implementation Map

This document maps user stories and requirements to their implementation
locations in the codebase.

## Core User Stories Implementation

### 1. As an employee I want to view my requested (planned) leaves including the (approval) status

**Frontend Implementation:**

- **Component**: `src/app/pages/dashboard/dashboard.ts` (line 70-85)
  - Method: `loadMyLeaves()` - Loads current user's leave requests
  - Signal: `myLeaves` - Stores the leave data
- **Template**: `src/app/pages/dashboard/dashboard.html` (lines 53-95)
  - Displays leave requests with status, dates, and approval information
  - Shows status badges with color coding via `getStatusClass()`
- **Service**: `src/app/services/leave/Leave.service.ts` (line 13-15)
  - Method: `getEmployeeLeaves(employeeId)` - API call to fetch leaves

**Backend Implementation:**

- **Controller**: `src/server/controllers/Leave.controller.ts` (lines 7-26)
  - Method: `getEmployeeLeaves()` - Returns all leaves for an employee with
    approver info
- **Route**: `src/server/routes/Leave.route.ts`
  - GET `/api/employees/:employeeId/leaves`

### 2. As an employee I want to view my remaining leave days and hours

**Frontend Implementation:**

- **Component**: `src/app/pages/dashboard/dashboard.ts` (line 86-94)
  - Method: `loadLeaveBalance()` - Fetches current year's leave balance
  - Signal: `leaveBalance` - Stores balance information
- **Template**: `src/app/pages/dashboard/dashboard.html` (lines 42-53)
  - Displays remaining days and hours with visual progress indication
- **Service**: `src/app/services/leave-balance/Leave-balance.service.ts`
  - Method: `getEmployeeBalance(employeeId, year)` - API call for balance

**Backend Implementation:**

- **Controller**: `src/server/controllers/LeaveBalance.controller.ts` (lines
  42-95)
  - Method: `getEmployeeBalance()` - Calculates remaining balance considering
    approved leaves
- **Database Model**: `prisma/schema.prisma` (lines 38-50)
  - `LeaveBalance` model with totalDays, totalHours, usedDays, usedHours
- **Business Logic**: Automatic pro-rata calculation for part-time employees

### 3. As an employee I want to request a new leave

**Frontend Implementation:**

- **Component**: `src/app/components/leave-form/leave-form.component.ts`
  - Complete form component for creating leave requests
  - Handles both regular and special leave types
- **Template**: `src/app/components/leave-form/leave-form.component.html`
  - Form with date pickers, leave type selection, and business rules display
- **Parent Component**: `src/app/pages/dashboard/dashboard.ts` (lines 224-240)
  - Method: `createLeave()` - Submits leave request

**Backend Implementation:**

- **Controller**: `src/server/controllers/Leave.controller.ts` (lines 66-240)
  - Method: `createLeave()` - Validates and creates leave requests
  - Implements all business rule validations
- **Business Rules**: `src/server/services/leave-business-rules.service.ts`
  - Complete validation logic for working days, hours, overlaps, special leave
    rules
- **Route**: POST `/api/leaves`

### 4. As an employee I want to cancel (delete) an existing, future leave

**Frontend Implementation:**

- **Component**: `src/app/pages/dashboard/dashboard.ts` (lines 170-189)
  - Method: `deleteLeave()` - Cancels leave requests with validation
  - Method: `canDeleteLeave()` - Determines if leave can be cancelled
- **Template**: `src/app/pages/dashboard/dashboard.html` (lines 80-88)
  - Cancel button displayed conditionally based on leave status and date

**Backend Implementation:**

- **Controller**: `src/server/controllers/Leave.controller.ts` (lines 349-383)
  - Method: `deleteLeave()` - Validates permissions and deletes leave
  - Business rules: Cannot delete past/started leaves or approved leaves
- **Route**: DELETE `/api/leaves/:leaveId`

### 5. As a manager I want to approve the leaves requested by my employees

**Frontend Implementation:**

- **Component**: `src/app/pages/dashboard/dashboard.ts` (lines 100-117, 194-215)
  - Method: `loadPendingApprovals()` - Loads subordinate leave requests
  - Method: `approveLeave()` - Approves/rejects leave requests
  - Signal: `pendingApprovals` - Stores pending requests for approval
- **Template**: `src/app/pages/dashboard/dashboard.html` (lines 103-135)
  - Approvals tab with approve/reject buttons for managers
- **Service**: `src/app/services/leave/Leave.service.ts` (lines 17-19, 25-29)
  - Methods: `getManagerLeaves()`, `updateLeaveStatus()`

**Backend Implementation:**

- **Controller**: `src/server/controllers/Leave.controller.ts`
  - Method: `getManagerLeaves()` (lines 30-62) - Gets leaves of subordinates
  - Method: `updateLeaveStatus()` (lines 247-345) - Updates leave approval
    status
- **Authorization**: Validates manager-employee relationship before approval
- **Special Leave Tracking**: Updates usage counters when special leaves are
  approved

### 6. As a security officer I want employees to only view and manage their own leaves (except managers)

**Frontend Implementation:**

- **Guard**: `src/app/guards/auth.guard.ts`
  - Route protection requiring authentication
- **Service**: `src/app/services/auth/Auth.service.ts`
  - Authentication state management with user roles
  - Method: `isManager()` - Role-based access control
- **Component Logic**: `src/app/pages/dashboard/dashboard.ts`
  - Conditional display of manager features based on user role
  - Employee data filtering based on current user

**Backend Implementation:**

- **Authorization**: All controllers validate employee ownership
  - Leave operations check `employeeId` matches authenticated user
  - Manager operations verify hierarchical relationship
- **Database Relations**: `prisma/schema.prisma` (lines 8-28)
  - Manager-employee relationship enforced at DB level

## Bonus/Stretch Goals Implementation

### 7. As an employee I want to manage special leaves

**Frontend Implementation:**

- **Component**: `src/app/components/leave-form/leave-form.component.html`
  (lines 35-45, 95-120)
  - Special leave type selection with different rules display
  - Usage tracking and limit display
- **Business Rules Display**: Detailed special leave rules and limits shown in
  UI

**Backend Implementation:**

- **Database Model**: `prisma/schema.prisma` (lines 52-68, 78-84)
  - `SpecialLeaveUsage` model tracks usage by type and year
  - `SpecialLeaveType` enum with all special leave categories
- **Business Rules**: `src/server/services/leave-business-rules.service.ts`
  (lines 76-95)
  - Method: `getSpecialLeaveLimit()` - Defines limits per special leave type
  - 2-week advance notice validation for special leaves
- **Controller**: `src/server/controllers/Leave.controller.ts` (lines 390-431)
  - Method: `getSpecialLeaveUsage()` - Returns usage and remaining limits

## Business Rules Implementation

### Working Hours and Days Validation

- **File**: `src/server/services/leave-business-rules.service.ts`
- **Methods**:
  - `isWorkingDay()` (lines 8-12) - Monday-Friday validation
  - `isWorkingHours()` (lines 17-21) - 9:00-17:00 validation
  - `isPublicHoliday()` (lines 26-42) - Public holiday checking
  - `calculateWorkingHours()` (lines 47-73) - Working hours calculation

### Leave Balance Calculation

- **Pro-rata Calculation**:
  `src/server/services/leave-business-rules.service.ts` (lines 158-170)
  - Method: `calculateProRataLeave()` - Part-time employee leave calculation
- **Balance Tracking**: `src/server/controllers/LeaveBalance.controller.ts`
  - Real-time balance calculation considering approved leaves

### Overlap Prevention

- **Implementation**: `src/server/controllers/Leave.controller.ts` (lines
  118-135)
- **Logic**: Prevents overlapping leave periods for the same employee

### Special Leave Business Rules

1. **Moving**: 1 day per year (lines 78-79)
2. **Wedding**: 1 day lifetime (lines 80-81)
3. **Child Birth**: Max 5 days (lines 82-83)
4. **Parental Care**: 10x contract hours (lines 84-87)

## Database Schema

### Core Models

- **Employee**: `prisma/schema.prisma` (lines 8-28)
  - Hierarchical manager-employee relationship
  - Contract hours for pro-rata calculations
- **Leave**: `prisma/schema.prisma` (lines 30-50)
  - Complete leave structure with approval workflow
- **LeaveBalance**: `prisma/schema.prisma` (lines 52-68)
  - Annual leave balance tracking
- **SpecialLeaveUsage**: `prisma/schema.prisma` (lines 70-84)
  - Special leave usage tracking by type and year

## API Endpoints

### Leave Management

- GET `/api/employees/:employeeId/leaves` - Get employee leaves
- GET `/api/managers/:managerId/leaves` - Get subordinate leaves
- POST `/api/leaves` - Create leave request
- PATCH `/api/leaves/:leaveId/status` - Approve/reject leave
- DELETE `/api/leaves/:leaveId` - Cancel leave request

### Leave Balance

- GET `/api/employees/:employeeId/balance` - Get leave balance
- GET `/api/leaves/:leaveId/special-usage` - Get special leave usage

## Testing

- **Unit Tests**: Located alongside each service/component with `.spec.ts`
  extension
- **Coverage**: Authentication, business rules validation, leave operations
- **Test Data**: Mock users and scenarios in `prisma/seed.ts`

## Key Features Summary

✅ **Complete Authentication & Authorization** with role-based access ✅ **Full
Leave Lifecycle** from request to approval ✅ **Business Rules Enforcement** for
working hours, overlaps, advance notice ✅ **Pro-rata Leave Calculation** for
part-time employees  
✅ **Special Leave Management** with usage tracking and limits ✅ **Manager
Approval Workflow** with hierarchical validation ✅ **Real-time Balance
Calculation** considering approved leaves ✅ **Security Controls** ensuring data
isolation between employees
