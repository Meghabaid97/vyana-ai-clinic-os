import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Vyana'
const BILLING_URL = 'https://vyana.care/app/billing'

interface Props {
  name?: string
  planLabel?: string
  amountInr?: string
  paymentId?: string
  receiptDate?: string
  nextRenewalDate?: string
  mode?: 'one_time' | 'autopay'
}

const PaymentReceiptEmail = ({
  name, planLabel, amountInr, paymentId, receiptDate, nextRenewalDate, mode,
}: Props) => {
  const greeting = name ? `Hi ${name},` : 'Hi there,'
  const renewalLine =
    mode === 'autopay' && nextRenewalDate
      ? `Your next AutoPay charge is scheduled for ${nextRenewalDate}.`
      : nextRenewalDate
        ? `Your plan is active until ${nextRenewalDate}. Renew anytime from billing.`
        : ''

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Receipt for your {SITE_NAME} subscription</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Thanks for supporting {SITE_NAME}</Heading>
          <Text style={text}>{greeting}</Text>
          <Text style={text}>
            We've received your payment. Your Pro features are active.
          </Text>

          <Section style={receiptBox}>
            <Row label="Plan" value={planLabel ?? 'Vyana Pro'} />
            <Row label="Amount" value={amountInr ?? '—'} />
            <Row label="Date" value={receiptDate ?? new Date().toLocaleDateString('en-IN')} />
            <Row label="Payment ID" value={paymentId ?? '—'} mono />
          </Section>

          {renewalLine && <Text style={smallText}>{renewalLine}</Text>}

          <Section style={buttonSection}>
            <Button href={BILLING_URL} style={button}>View billing history</Button>
          </Section>

          <Hr style={hr} />
          <Text style={smallText}>
            This receipt is for your records. GST is inclusive in the amount.
            For a GST invoice, reply to this email with your GSTIN.
          </Text>
          <Text style={footer}>
            With care,<br />The {SITE_NAME} team
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const Row = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
    <Text style={rowLabel}>{label}</Text>
    <Text style={mono ? rowValueMono : rowValue}>{value}</Text>
  </div>
)

export const template = {
  component: PaymentReceiptEmail,
  subject: ({ planLabel }: Props) =>
    `Receipt: ${planLabel ?? 'Vyana Pro'} payment confirmed`,
  displayName: 'Payment receipt',
  previewData: {
    name: 'Megha',
    planLabel: 'Vyana Individual · monthly',
    amountInr: '₹99',
    paymentId: 'pay_PXyZabc12345',
    receiptDate: '18 Jun 2026',
    nextRenewalDate: '18 Jul 2026',
    mode: 'autopay',
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
const hr = { borderColor: '#eaeaea', margin: '24px 0' }
const receiptBox = { backgroundColor: '#f6f4f0', borderRadius: '10px', padding: '14px 18px', margin: '20px 0' }
const rowLabel = { fontSize: '13px', color: '#6a6a6a', margin: 0 }
const rowValue = { fontSize: '13px', color: '#1a1a1a', fontWeight: 600, margin: 0 }
const rowValueMono = { fontSize: '12px', color: '#1a1a1a', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', margin: 0 }
