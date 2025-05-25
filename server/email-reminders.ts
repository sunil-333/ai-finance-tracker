import { sendEmail } from './email';
import { IStorage } from './mongo-storage';
import { BillDocument } from './models';
import { isAfter, isBefore, differenceInDays, format } from 'date-fns';
import dotenv from 'dotenv';

dotenv.config();
export interface BillReminderEmailParams {
  to: string;
  userName?: string;
  billName: string;
  billAmount: number;
  dueDate: Date;
  daysToDue: number;
  billId: string;
}

/**
 * Sends bill reminder email
 */
export async function sendBillReminderEmail(params: BillReminderEmailParams): Promise<boolean> {
  const { to, userName, billName, billAmount, dueDate, daysToDue, billId } = params;
  
  const dueDateFormatted = format(dueDate, 'MMMM dd, yyyy');
  const urgency = daysToDue <= 1 ? 'high' : daysToDue <= 3 ? 'medium' : 'low';
  const salutation = userName ? `Hi ${userName},` : 'Hi,';
  
  let urgencyText = '';
  if (urgency === 'high') {
    urgencyText = 'URGENT: ';
  } else if (urgency === 'medium') {
    urgencyText = 'Reminder: ';
  }
  
  const subject = `${urgencyText}Bill Payment Reminder: ${billName} due in ${daysToDue} day${daysToDue !== 1 ? 's' : ''}`;
  
  let timeframeText = '';
  if (daysToDue === 0) {
    timeframeText = 'today';
  } else if (daysToDue === 1) {
    timeframeText = 'tomorrow';
  } else {
    timeframeText = `in ${daysToDue} days`;
  }
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #4338ca; margin-bottom: 5px;">Bill Payment Reminder</h1>
        <p style="color: #64748b; font-size: 16px;">Keep track of your finances</p>
      </div>
      
      <div style="margin-bottom: 20px;">
        <p style="font-size: 16px; color: #334155;">${salutation}</p>
        <p style="font-size: 16px; color: #334155;">This is a friendly reminder that your bill <strong>${billName}</strong> is due ${timeframeText} on <strong>${dueDateFormatted}</strong>.</p>
      </div>
      
      <div style="background-color: #f8fafc; border-radius: 5px; padding: 15px; margin-bottom: 20px;">
        <h2 style="color: #334155; font-size: 18px; margin-top: 0;">Bill Details</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Name:</td>
            <td style="padding: 8px 0; color: #334155; font-weight: bold;">${billName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Amount:</td>
            <td style="padding: 8px 0; color: #334155; font-weight: bold;">$${billAmount.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Due Date:</td>
            <td style="padding: 8px 0; color: #334155; font-weight: bold;">${dueDateFormatted}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Status:</td>
            <td style="padding: 8px 0;">
              <span style="display: inline-block; padding: 4px 8px; background-color: ${urgency === 'high' ? '#fecaca' : urgency === 'medium' ? '#fed7aa' : '#bbf7d0'}; color: ${urgency === 'high' ? '#b91c1c' : urgency === 'medium' ? '#9a3412' : '#166534'}; border-radius: 4px; font-size: 14px;">
                Due ${timeframeText}
              </span>
            </td>
          </tr>
        </table>
      </div>
      
      <div style="text-align: center; margin-bottom: 20px;">
        <a href="${process.env.APP_URL || 'http://localhost:3000'}/bills" style="display: inline-block; background-color: #4338ca; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">View My Bills</a>
      </div>
      
      <div style="color: #64748b; font-size: 14px; text-align: center; border-top: 1px solid #e0e0e0; padding-top: 20px;">
        <p>This email was sent automatically from your Personal Finance App. Please do not reply to this email.</p>
      </div>
    </div>
  `;
  
  const text = `Bill Payment Reminder\n\n${salutation}\n\nThis is a friendly reminder that your bill ${billName} is due ${timeframeText} on ${dueDateFormatted}.\n\nBill Details:\nName: ${billName}\nAmount: $${billAmount.toFixed(2)}\nDue Date: ${dueDateFormatted}\n\nPlease log in to your account to view more details or make a payment.\n\nThank you for using our services.`;
  
  return await sendEmail({
    to,
    from: process.env.EMAIL_FROM || 'noreply@personalfinance.app',
    subject,
    text,
    html,
  });
}

/**
 * Checks for upcoming bills and sends reminder emails based on reminderDays setting
 * For recurring bills, ensures emails are sent 3 days before due date each month
 * @param storage Storage instance to retrieve data
 * @param userId User ID to check bills for
 */
export async function checkBillReminders(storage: IStorage, userId: string): Promise<void> {
  try {
    // Get the user
    const user = await storage.getUser(userId);
    if (!user) {
      console.error(`User not found: ${userId}`);
      return;
    }
    
    // If no email, can't send reminders
    if (!user.email) {
      console.error(`User ${userId} has no email address for reminders`);
      return;
    }
    
    // Get all bills for the user
    const today = new Date();
    const bills = await storage.getBillsByUserId(userId);
    
    console.log(`Checking ${bills.length} bills for user ${userId} for reminders`);
    
    // Check each bill to see if we need to send a reminder
    for (const bill of bills) {
      // Handle both one-time and recurring bills
      if (bill.recurringPeriod && bill.recurringPeriod !== 'none') {
        // This is a recurring bill, we need to calculate the next due date
        const originalDueDate = new Date(bill.dueDate);
        console.log(bill.name, '---->', bill.recurringPeriod)
        
        // Find the next occurrence of this bill based on the current date
        const nextDueDate = calculateNextDueDate(originalDueDate, bill.recurringPeriod, today);
        
        // Calculate days until the next due date
        const daysToDue = differenceInDays(nextDueDate, today);
        
        console.log(`Recurring bill ${bill.name}: Next due date is ${nextDueDate.toISOString()}, which is ${daysToDue} days away`);
        
        // Always send reminder 3 days before due date for recurring bills
        // Default to the bill's reminderDays if specified, otherwise use 3 days
        const reminderDays = bill.reminderDays || 3;
        
        if (daysToDue <= reminderDays && !bill.isPaid) {
          console.log(`Sending reminder for recurring bill ${bill.name} due in ${daysToDue} days`);
          
          // Send email reminder
          await sendBillReminderEmail({
            to: user.email,
            userName: user.fullName || user.username,
            billName: bill.name,
            billAmount: bill.amount,
            dueDate: nextDueDate,
            daysToDue: daysToDue,
            billId: bill._id.toString(),
          });
          
          console.log(`Recurring bill reminder sent for bill ${bill.name} to user ${user.email}`);
        }
      } else {
        // This is a one-time bill
        const dueDate = new Date(bill.dueDate);
        
        // Only process bills that are still in the future
        if (isBefore(today, dueDate)) {
          // Calculate days until due
          const daysToDue = differenceInDays(dueDate, today);
          
          // Check if we need to send a reminder based on reminderDays setting
          if (daysToDue <= bill.reminderDays && daysToDue >= 0) {
            console.log(`Sending reminder for one-time bill ${bill.name} due in ${daysToDue} days`);
            
            // Send email reminder
            await sendBillReminderEmail({
              to: user.email,
              userName: user.fullName || user.username,
              billName: bill.name,
              billAmount: bill.amount,
              dueDate: dueDate,
              daysToDue: daysToDue,
              billId: bill._id.toString(),
            });
            
            console.log(`One-time bill reminder sent for bill ${bill.name} to user ${user.email}`);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking bill reminders:', error);
  }
}

/**
 * Calculates the next due date for a recurring bill
 * @param originalDueDate The original due date of the bill
 * @param recurringPeriod The period of recurrence (monthly, weekly, etc.)
 * @param currentDate The current date to calculate from
 * @returns The next due date
 */
function calculateNextDueDate(originalDueDate: Date, recurringPeriod: string, currentDate: Date): Date {
  console.log(`Calculating next due date for bill with:
  - Original due date: ${originalDueDate.toISOString()}
  - Recurring period: ${recurringPeriod}
  - Current date: ${currentDate.toISOString()}`);
  
  // Create a copy of the original date to avoid mutating the input
  const nextDueDate = new Date(originalDueDate);
  
  // If the original due date is in the future, just return it
  if (isAfter(originalDueDate, currentDate)) {
    console.log(`Original due date is in the future, returning it unchanged`);
    return originalDueDate;
  }
  
  // Calculate the next due date based on the recurring period
  switch (recurringPeriod.toLowerCase()) {
    case 'weekly':
      console.log(`Processing weekly recurrence...`);
      // For weekly bills, add weeks until we're in the future
      while (isBefore(nextDueDate, currentDate)) {
        const oldDate = new Date(nextDueDate);
        nextDueDate.setDate(nextDueDate.getDate() + 7);
        console.log(`Weekly: Advanced from ${oldDate.toISOString()} to ${nextDueDate.toISOString()}`);
      }
      break;
      
    case 'monthly':
      console.log(`Processing monthly recurrence...`);
      // Find the next month with the same day
      while (isBefore(nextDueDate, currentDate)) {
        const oldDate = new Date(nextDueDate);
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        console.log(`Monthly: Advanced from ${oldDate.toISOString()} to ${nextDueDate.toISOString()}`);
      }
      break;
      
    case 'yearly':
      console.log(`Processing yearly recurrence...`);
      // Find the next year with the same day
      while (isBefore(nextDueDate, currentDate)) {
        const oldDate = new Date(nextDueDate);
        nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
        console.log(`Yearly: Advanced from ${oldDate.toISOString()} to ${nextDueDate.toISOString()}`);
      }
      break;
      
    case 'quarterly':
      console.log(`Processing quarterly recurrence...`);
      // Find the next quarter with the same day
      while (isBefore(nextDueDate, currentDate)) {
        const oldDate = new Date(nextDueDate);
        nextDueDate.setMonth(nextDueDate.getMonth() + 3);
        console.log(`Quarterly: Advanced from ${oldDate.toISOString()} to ${nextDueDate.toISOString()}`);
      }
      break;
      
    default:
      console.log(`Unknown recurrence type "${recurringPeriod}", defaulting to monthly`);
      // Default to monthly
      while (isBefore(nextDueDate, currentDate)) {
        const oldDate = new Date(nextDueDate);
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        console.log(`Default (monthly): Advanced from ${oldDate.toISOString()} to ${nextDueDate.toISOString()}`);
      }
  }
  
  console.log(`Final calculated next due date: ${nextDueDate.toISOString()}`);
  return nextDueDate;
}

/**
 * Trigger bill reminders check for all users
 * This could be run on a schedule (e.g., daily)
 */
export async function sendAllBillReminders(storage: IStorage): Promise<void> {
  try {
    // In a production environment, you would likely want to process users in batches
    // For simplicity, we'll process all users here
    const users = await storage.getAllUsers();
    
    console.log(`Processing bill reminders for ${users.length} users`);
    
    for (const user of users) {
      await checkBillReminders(storage, user._id.toString());
    }
    
    console.log('Completed processing bill reminders');
  } catch (error) {
    console.error('Error sending all bill reminders:', error);
  }
}