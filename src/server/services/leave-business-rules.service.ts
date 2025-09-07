import { ILeaveRequest, IValidationResult } from '$types/Leave.type';
import { LeaveType, SpecialLeaveType } from '../../../generated/prisma/enums';

export class LeaveBusinessRulesService {
  /**
   * Validates if a date is a working day (Monday-Friday, 9:00-17:00)
   */
  static isWorkingDay(date: Date): boolean {
    const day = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    return day >= 1 && day <= 5; // Monday to Friday
  }

  /**
   * Validates if time is within working hours (9:00-17:00)
   */
  static isWorkingHours(date: Date): boolean {
    const hours = date.getHours();
    return hours >= 9 && hours <= 17;
  }

  /**
   * Checks if a date is a public holiday (mock implementation)
   */
  static isPublicHoliday(date: Date): boolean {
    const currentYear = date.getFullYear();

    // Mock public holidays (this should be configurable in a real application)
    const holidays = [
      new Date(currentYear, 0, 1), // New Year's Day
      new Date(currentYear, 3, 27), // King's Day (April 27)
      new Date(currentYear, 4, 5), // Liberation Day (May 5)
      new Date(currentYear, 11, 25), // Christmas Day
      new Date(currentYear, 11, 26), // Boxing Day
    ];

    return holidays.some((holiday) => holiday.toDateString() === date.toDateString());
  }

  /**
   * Calculates the number of working hours between two dates
   */
  static calculateWorkingHours(startDate: Date, endDate: Date): number {
    let totalHours = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      if (this.isWorkingDay(current) && !this.isPublicHoliday(current)) {
        const dayStart = new Date(current);
        dayStart.setHours(9, 0, 0, 0);

        const dayEnd = new Date(current);
        dayEnd.setHours(17, 0, 0, 0);

        const effectiveStart = current > dayStart ? current : dayStart;
        const effectiveEnd = endDate < dayEnd ? endDate : dayEnd;

        if (effectiveStart < effectiveEnd) {
          const hours = (effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60);
          totalHours += hours;
        }
      }

      current.setDate(current.getDate() + 1);
      current.setHours(9, 0, 0, 0);
    }

    return totalHours;
  }

  /**
   * Gets the maximum allowed days/hours for special leave types
   */
  static getSpecialLeaveLimit(
    specialLeaveType: SpecialLeaveType,
    contractHours: number,
  ): { maxDays: number; maxHours: number } {
    switch (specialLeaveType) {
      case SpecialLeaveType.MOVING:
        return { maxDays: 1, maxHours: 8 }; // 1 day per year
      case SpecialLeaveType.WEDDING:
        return { maxDays: 1, maxHours: 8 }; // 1 day (lifetime)
      case SpecialLeaveType.CHILD_BIRTH:
        return { maxDays: 5, maxHours: 40 }; // Maximum 5 days
      case SpecialLeaveType.PARENTAL_CARE:
        const maxHours = contractHours * 10; // 10x contract hours
        return { maxDays: Math.floor(maxHours / 8), maxHours };
      default:
        return { maxDays: 0, maxHours: 0 };
    }
  }

  /**
   * Validates a leave request against business rules
   */
  static validateLeaveRequest(request: ILeaveRequest): IValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic date validation
    if (request.endOfLeave <= request.startOfLeave) {
      errors.push('End date must be after start date');
    }

    // Cannot schedule leave in the past
    if (request.startOfLeave < new Date()) {
      errors.push('Cannot schedule leave in the past');
    }

    // Validate working days and hours
    const current = new Date(request.startOfLeave);
    const endDate = new Date(request.endOfLeave);

    while (current <= endDate) {
      if (!this.isWorkingDay(current)) {
        warnings.push(`Leave includes weekend day: ${current.toDateString()}`);
      }

      if (this.isPublicHoliday(current)) {
        warnings.push(`Leave includes public holiday: ${current.toDateString()}`);
      }

      current.setDate(current.getDate() + 1);
    }

    // Validate working hours
    if (!this.isWorkingHours(request.startOfLeave)) {
      errors.push('Start time must be within working hours (9:00-17:00)');
    }

    if (!this.isWorkingHours(request.endOfLeave)) {
      errors.push('End time must be within working hours (9:00-17:00)');
    }

    // Special leave validation
    if (request.leaveType === LeaveType.SPECIAL) {
      if (!request.specialLeaveType) {
        errors.push('Special leave type is required for special leaves');
      } else {
        // Check 2-week advance notice for special leaves
        const twoWeeksFromNow = new Date();
        twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

        if (request.startOfLeave < twoWeeksFromNow) {
          errors.push('Special leaves must be requested at least 2 weeks in advance');
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Calculates pro-rata leave entitlement based on contract hours
   */
  static calculateProRataLeave(contractHours: number): { days: number; hours: number } {
    const fullTimeHours = 40;
    const fullTimeLeaveHours = 200; // 25 days * 8 hours

    const proRataRatio = contractHours / fullTimeHours;
    const totalLeaveHours = Math.round(fullTimeLeaveHours * proRataRatio);
    const totalLeaveDays = Math.round(totalLeaveHours / 8);

    return {
      days: totalLeaveDays,
      hours: totalLeaveHours,
    };
  }
}
