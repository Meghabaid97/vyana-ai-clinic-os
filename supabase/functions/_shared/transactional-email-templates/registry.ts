/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as applicantApproved } from './applicant-approved.tsx'
import { template as journalReminder } from './journal-reminder.tsx'
import { template as paymentPastDue } from './payment-past-due.tsx'
import { template as paymentReceipt } from './payment-receipt.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'applicant-approved': applicantApproved,
  'journal-reminder': journalReminder,
  'payment-past-due': paymentPastDue,
  'payment-receipt': paymentReceipt,
}
