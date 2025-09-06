import { Router } from 'express';
import { LeaveBalanceController } from '../controllers/LeaveBalance.controller';

const router = Router();

router.get('/employees/:employeeId/balance', LeaveBalanceController.getEmployeeBalance);

export default router;
