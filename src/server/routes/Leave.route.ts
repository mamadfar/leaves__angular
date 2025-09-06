import { Router } from 'express';
import { LeaveController } from '../controllers/Leave.controller';

const router = Router();

router.get('/employees/:employeeId/leaves', LeaveController.getEmployeeLeaves);
router.get('/managers/:managerId/leaves', LeaveController.getManagerLeaves);
router.post('/leaves', LeaveController.createLeave);
router.patch('/leaves/:leaveId/status', LeaveController.updateLeaveStatus);
router.delete('/leaves/:leaveId', LeaveController.deleteLeave);

export default router;
