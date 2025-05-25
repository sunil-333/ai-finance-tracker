import mongoose, { Schema, Document } from 'mongoose';

// Define interfaces for each model that extends Document
export interface IUser extends Document {
  username: string;
  password: string;
  email: string;
  fullName: string;
  plaidItems?: mongoose.Types.ObjectId[];  // Reference to PlaidItems associated with the user
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategory extends Document {
  name: string;
  icon: string;
  color: string;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPlaidItem extends Document {
  userId: mongoose.Types.ObjectId;
  accessToken: string;
  itemId: string;
  institutionId: string;
  institutionName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAccount extends Document {
  name: string;
  type: string;
  balance: number;
  currency: string;
  userId: mongoose.Types.ObjectId;
  description: string;
  plaidAccountId?: string;
  plaidItemId?: mongoose.Types.ObjectId;
  officialName?: string;
  mask?: string;
  subtype?: string;
  isPlaidConnected: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITransaction extends Document {
  description: string;
  date: Date;
  amount: number;
  userId: mongoose.Types.ObjectId;
  categoryId: string | null;
  accountId: mongoose.Types.ObjectId | null;
  isIncome: boolean;
  notes: string;
  receiptImageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBudget extends Document {
  categoryId: string;
  userId: mongoose.Types.ObjectId;
  amount: number;
  period: string;
  startDate: Date;
  endDate: Date;
  alertThreshold: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBill extends Document {
  name: string;
  amount: number;
  dueDate: Date;
  originalStartDate?: Date;
  recurringPeriod: string;
  userId: mongoose.Types.ObjectId;
  categoryId: string | null;
  isPaid: boolean;
  notes: string;
  reminderDays: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFinancialGoal extends Document {
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  category: string;
  userId: mongoose.Types.ObjectId;
  description: string;
  priority: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAiInsight extends Document {
  title: string;
  content: string;
  insightType: string;
  severity: string;
  isRead: boolean;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Define schemas
const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true },
    fullName: { type: String, required: true },
    plaidItems: [{ type: Schema.Types.ObjectId, ref: 'PlaidItem' }]
  },
  { timestamps: true }
);

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true },
    icon: { type: String, default: 'tag' },
    color: { type: String, default: '#6366f1' },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

const PlaidItemSchema = new Schema<IPlaidItem>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    accessToken: { type: String, required: true },
    itemId: { type: String, required: true },
    institutionId: { type: String, required: true },
    institutionName: { type: String, required: true }
  },
  { timestamps: true }
);

const AccountSchema = new Schema<IAccount>(
  {
    name: { type: String, required: true },
    type: { type: String, required: true },
    balance: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String, default: '' },
    // Plaid-related fields
    plaidAccountId: { type: String },
    plaidItemId: { type: Schema.Types.ObjectId, ref: 'PlaidItem' },
    officialName: { type: String },
    mask: { type: String },
    subtype: { type: String },
    isPlaidConnected: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const TransactionSchema = new Schema<ITransaction>(
  {
    description: { type: String, required: true },
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    categoryId: { type: String, default: null },
    accountId: { type: Schema.Types.ObjectId, ref: 'Account', default: null },
    isIncome: { type: Boolean, default: false },
    notes: { type: String, default: '' },
    receiptImageUrl: { type: String, default: null }
  },
  { timestamps: true }
);

const BudgetSchema = new Schema<IBudget>(
  {
    categoryId: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    period: { type: String, required: true }, // monthly, quarterly, yearly
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    alertThreshold: { type: Number, default: 80 } // percentage of budget
  },
  { timestamps: true }
);

const BillSchema = new Schema<IBill>(
  {
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    originalStartDate: { type: Date },
    recurringPeriod: { type: String, required: true }, // monthly, quarterly, yearly, once
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    categoryId: { type: String, default: null },
    isPaid: { type: Boolean, default: false },
    notes: { type: String, default: '' },
    reminderDays: { type: Number, default: 3 }
  },
  { timestamps: true }
);

const FinancialGoalSchema = new Schema<IFinancialGoal>(
  {
    name: { type: String, required: true },
    targetAmount: { type: Number, required: true },
    currentAmount: { type: Number, default: 0 },
    targetDate: { type: Date, required: true },
    category: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String, default: '' },
    priority: { type: String, default: 'medium' }
  },
  { timestamps: true }
);

const AiInsightSchema = new Schema<IAiInsight>(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    insightType: { type: String, required: true },
    severity: { type: String, default: 'info' },
    isRead: { type: Boolean, default: false },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

// Create models
export const User = mongoose.model<IUser>('User', UserSchema);
export const Category = mongoose.model<ICategory>('Category', CategorySchema);
export const PlaidItem = mongoose.model<IPlaidItem>('PlaidItem', PlaidItemSchema);
export const Account = mongoose.model<IAccount>('Account', AccountSchema);
export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);
export const Budget = mongoose.model<IBudget>('Budget', BudgetSchema);
export const Bill = mongoose.model<IBill>('Bill', BillSchema);
export const FinancialGoal = mongoose.model<IFinancialGoal>('FinancialGoal', FinancialGoalSchema);
export const AiInsight = mongoose.model<IAiInsight>('AiInsight', AiInsightSchema);

// Export types for inserted and selected documents
export type UserDocument = IUser;
export type CategoryDocument = ICategory;
export type PlaidItemDocument = IPlaidItem;
export type AccountDocument = IAccount;
export type TransactionDocument = ITransaction;
export type BudgetDocument = IBudget;
export type BillDocument = IBill;
export type FinancialGoalDocument = IFinancialGoal;
export type AiInsightDocument = IAiInsight;

// Export types for creating new documents
export type InsertUser = Omit<IUser, '_id' | 'createdAt' | 'updatedAt'>;
export type InsertCategory = Omit<ICategory, '_id' | 'createdAt' | 'updatedAt'>;
export type InsertPlaidItem = Omit<IPlaidItem, '_id' | 'createdAt' | 'updatedAt'>;
export type InsertAccount = Omit<IAccount, '_id' | 'createdAt' | 'updatedAt'>;
export type InsertTransaction = Omit<ITransaction, '_id' | 'createdAt' | 'updatedAt'>;
export type InsertBudget = Omit<IBudget, '_id' | 'createdAt' | 'updatedAt'>;
export type InsertBill = Omit<IBill, '_id' | 'createdAt' | 'updatedAt'>;
export type InsertGoal = Omit<IFinancialGoal, '_id' | 'createdAt' | 'updatedAt'>;
export type InsertAiInsight = Omit<IAiInsight, '_id' | 'createdAt' | 'updatedAt'>;