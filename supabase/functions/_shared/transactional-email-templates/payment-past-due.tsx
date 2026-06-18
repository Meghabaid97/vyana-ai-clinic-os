import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Vyana'
const BILLING_URL = 'https://vyana.care/app/billing'

interface Props {
  name?: string
  planLabel?: string
  amountInr?: string
  reason?: string
}

const PaymentPastDueEmail = ({ name, planLabel, amountInr, reason }: Props) => {
  const greeting = name ? `Hi ${name},` : 'Hi there,'
  const planLine = planLabel ? `your ${planLabel} subscription` : 'your Vyana Pro subscription'
  const amtLine = amountInr ? ` for ${amountInr}` : ''
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your {SITE_NAME} AutoPay didn't go through</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Your AutoPay didn't go through</Heading>
          <Text style={text}>{greeting}</Text>
          <Text style={text}>
            We tried to renew {planLine}{amtLine} and the bank couldn't complete
            the AutoPay mandate. {reason ? `Reason from your bank: ${reason}.` : ''}
          </Text>
          <Text style={text}>
            Your {SITE_NAME} Pro features stay on for a short grace period.
            Update your payment method to keep your family's health story
            uninterrupted.
          </Text>
          <Section style={buttonSection}>
            <Button href={BILLING_URL} style={button}>Fix payment method</Button>
          </Section>
          <Text style={smallText}>
            Common fixes: low balance, expired card, daily UPI limit, or a
            mandate cap below the renewal amount. Approve the mandate again from
            the billing page and we'll retry automatically.
          </Text>
          <Text style={footer}>
            With care,<br />The {SITE_NAME} team
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: PaymentPastDueEmail,
  subject: ({ planLabel }: Props) =>
    `Action needed: ${planLabel ?? 'Vyana Pro'} payment failed`,
  displayName: 'Payment past due',
  previewData: {
    name: 'Megha',
    planLabel: 'Vyana Family · monthly',
    amountInr: '₹299',
    reason: 'Insufficient balance',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const h1 = { fontSize: '24px', fontWeight: 600, color: '#1a1a1a', margin: '0 0 20px', letterSpacing: '-0.01em' }
const text = { fontSize: '15px', color: '#3a3a3a', lineHeight: '1.6', margin: '0 0 16px' }
const smallText = { fontSize: '13px', color: '#6a6a6a', lineHeight: '1.5', margin: '20px 0 0' }
const buttonSection = { margin: '28px 0' }
const button = { backgroundColor: '#E07A5F', color: '#ffffff', padding: '12px 24px', borderRadius: '8px', fontSize: '15px', fontWeight: 500, textDecoration: 'none', display: 'inline-block' }
const footer = { fontSize: '14px', color: '#6a6a6a', margin: '32px 0 0', lineHeight: '1.5' }
