import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Vyana'
const APP_URL = 'https://meghabaid.lovable.app/app/journal'

interface JournalReminderProps {
  name?: string
  streakDays?: number
  cadenceLabel?: string
}

const JournalReminderEmail = ({ name, streakDays, cadenceLabel }: JournalReminderProps) => {
  const greeting = name ? `Hi ${name},` : 'Hi there,'
  const streakLine =
    streakDays && streakDays > 0
      ? `You're on a ${streakDays}-day check-in streak. A quick log keeps it alive.`
      : 'A quick log today builds your health story over time.'

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>How are you feeling today? A 30-second check-in for {SITE_NAME}.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>How are you feeling today?</Heading>
          <Text style={text}>{greeting}</Text>
          <Text style={text}>{streakLine}</Text>
          <Text style={text}>
            One tap. Energy, sleep, a symptom, anything you noticed. {SITE_NAME}
            stitches it into your timeline so patterns surface earlier.
          </Text>
          <Section style={buttonSection}>
            <Button href={APP_URL} style={button}>
              Log a check-in
            </Button>
          </Section>
          <Text style={smallText}>
            {cadenceLabel
              ? `You're getting these because your reminder cadence is set to "${cadenceLabel}". You can change it anytime inside the app.`
              : 'You can change reminder frequency anytime inside the app.'}
          </Text>
          <Text style={footer}>
            With care,
            <br />
            The {SITE_NAME} team
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: JournalReminderEmail,
  subject: 'A quick health check-in?',
  displayName: 'Journal reminder',
  previewData: {
    name: 'Megha',
    streakDays: 4,
    cadenceLabel: 'A few times a week',
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}
const container = { padding: '32px 28px', maxWidth: '560px' }
const h1 = {
  fontSize: '24px',
  fontWeight: 600,
  color: '#1a1a1a',
  margin: '0 0 20px',
  letterSpacing: '-0.01em',
}
const text = {
  fontSize: '15px',
  color: '#3a3a3a',
  lineHeight: '1.6',
  margin: '0 0 16px',
}
const smallText = {
  fontSize: '13px',
  color: '#6a6a6a',
  lineHeight: '1.5',
  margin: '20px 0 0',
}
const buttonSection = { margin: '28px 0' }
const button = {
  backgroundColor: '#E07A5F',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '8px',
  fontSize: '15px',
  fontWeight: 500,
  textDecoration: 'none',
  display: 'inline-block',
}
const footer = {
  fontSize: '14px',
  color: '#6a6a6a',
  margin: '32px 0 0',
  lineHeight: '1.5',
}
