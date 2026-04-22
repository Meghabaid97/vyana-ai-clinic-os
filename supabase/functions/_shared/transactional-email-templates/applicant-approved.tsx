import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Vyana'

interface ApplicantApprovedProps {
  name?: string
  inviteUrl?: string
}

const ApplicantApprovedEmail = ({ name, inviteUrl }: ApplicantApprovedProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You're in. Welcome to {SITE_NAME}.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>
          {name ? `Welcome, ${name}.` : 'Welcome.'}
        </Heading>
        <Text style={text}>
          Your request for early access to {SITE_NAME} has been approved.
        </Text>
        <Text style={text}>
          {SITE_NAME} is your longitudinal health memory layer, so you never
          have to explain your medical history again.
        </Text>
        {inviteUrl ? (
          <>
            <Section style={buttonSection}>
              <Button href={inviteUrl} style={button}>
                Create your account
              </Button>
            </Section>
            <Text style={smallText}>
              Or paste this link into your browser:
              <br />
              <Link href={inviteUrl} style={linkStyle}>
                {inviteUrl}
              </Link>
            </Text>
            <Text style={smallText}>
              This invite link is unique to you and expires in 7 days.
            </Text>
          </>
        ) : (
          <Text style={text}>
            We will follow up shortly with your personal sign-up link.
          </Text>
        )}
        <Text style={footer}>
          With care,
          <br />
          The {SITE_NAME} team
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ApplicantApprovedEmail,
  subject: 'You\'re in. Welcome to Vyana.',
  displayName: 'Applicant approved',
  previewData: {
    name: 'Megha',
    inviteUrl: 'https://meghabaid.lovable.app/auth?token=sample-token',
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
  margin: '0 0 16px',
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
const linkStyle = { color: '#E07A5F', textDecoration: 'underline', wordBreak: 'break-all' as const }
const footer = {
  fontSize: '14px',
  color: '#6a6a6a',
  margin: '32px 0 0',
  lineHeight: '1.5',
}
