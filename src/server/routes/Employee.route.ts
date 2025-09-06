import { Router } from 'express';
import { EmployeeController } from '../controllers/Employee.controller';

const router = Router();

router.get('/employees', EmployeeController.getEmployees);
router.get('/employees/:employeeId', EmployeeController.getEmployee);
router.post('/employees', EmployeeController.createEmployee);
router.get('/employees/:employeeId/subordinates', EmployeeController.getSubordinates);

export default router;
