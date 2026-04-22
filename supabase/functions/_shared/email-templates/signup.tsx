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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email for Vyana</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Confirm your email</Heading>
        <Text style={text}>
          Thanks for signing up for{' '}
          <Link href={siteUrl} style={link}>
            <strong>Vyana</strong>
          </Link>
          . You're one step closer to never having to explain your medical
          history again.
        </Text>
        <Text style={text}>
          Please confirm{' '}
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>{' '}
          by tapping the button below.
        </Text>
        <Section style={buttonSection}>
          <Button style={button} href={confirmationUrl}>
            Verify email
          </Button>
        </Section>
        <Text style={footer}>
          If you didn't create an account, you can safely ignore this email.
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

export default SignupEmail

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
