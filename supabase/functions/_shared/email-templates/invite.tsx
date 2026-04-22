/// <reference types="npm:@types/react@18.3.1" />

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

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ siteUrl, confirmationUrl }: InviteEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You're invited to Vyana</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>You're invited</Heading>
        <Text style={text}>
          You've been invited to join{' '}
          <Link href={siteUrl} style={link}>
            <strong>Vyana</strong>
          </Link>
          , your longitudinal health memory layer. Tap the button below to
          accept the invitation and create your account.
        </Text>
        <Section style={buttonSection}>
          <Button style={button} href={confirmationUrl}>
            Accept invitation
          </Button>
        </Section>
        <Text style={footer}>
          If you weren't expecting this invitation, you can safely ignore this
          email.
        </Text>
        <Text style={signoff}>
          With care,
          <br />
          The Vyana team
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

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
const link = { color: '#CC613D', textDecoration: 'underline' }
const buttonSection = { margin: '28px 0' }
const button = {
  backgroundColor: '#CC613D',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 500,
  borderRadius: '8px',
  padding: '12px 24px',
  textDecoration: 'none',
  display: 'inline-block',
}
const footer = { fontSize: '13px', color: '#6a6a6a', margin: '24px 0 0', lineHeight: '1.5' }
const signoff = { fontSize: '14px', color: '#6a6a6a', margin: '24px 0 0', lineHeight: '1.5' }
