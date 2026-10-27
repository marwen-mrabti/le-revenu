import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import type { ReactNode } from 'react';

/**
 * Shared shell of every transactional mail: text logo (mail clients block images
 * and web fonts), serif title, one red button, the link in clear under it,
 * a short English block and the "ignore this" line. Inline styles only.
 */
export interface MailLayoutProps {
  preview: string;
  title: string;
  children: ReactNode;
  buttonLabel: string;
  /** Already carries Strapi's placeholders (`__URL__`, `__CODE__`, `__TOKEN__`). */
  href: string;
  english: string;
  ignore: string;
}

const sans = 'Arial, Helvetica, sans-serif';
const serif = "Georgia, 'Times New Roman', serif";

const styles = {
  body: { margin: 0, backgroundColor: '#f5f5f7', padding: '32px 12px' },
  card: {
    maxWidth: '560px',
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    border: '1px solid #e5e5ea',
    padding: '28px 32px',
  },
  logo: {
    display: 'inline-block',
    backgroundColor: '#eb0f0f',
    color: '#ffffff',
    font: `800 13px/1 ${sans}`,
    letterSpacing: '0.06em',
    padding: '7px 9px',
    borderRadius: '4px',
  },
  logoSuffix: { font: `600 13px ${sans}`, color: '#6e6e73', marginLeft: '8px' },
  title: { margin: '22px 0 0', font: `700 24px/1.25 ${serif}`, color: '#1d1d1f' },
  text: { margin: '12px 0 0', font: `15px/1.55 ${sans}`, color: '#48484a' },
  button: {
    display: 'inline-block',
    backgroundColor: '#eb0f0f',
    color: '#ffffff',
    font: `700 15px/1 ${sans}`,
    textDecoration: 'none',
    padding: '13px 22px',
    borderRadius: '10px',
  },
  small: { margin: '16px 0 0', font: `12.5px/1.5 ${sans}`, color: '#6e6e73' },
  link: { color: '#e00b0b', wordBreak: 'break-all' as const },
  hr: { border: 0, borderTop: '1px solid #e5e5ea', margin: '22px 0 0' },
  footer: { margin: '16px 0 0', font: `12.5px/1.55 ${sans}`, color: '#6e6e73' },
  footerLabel: { color: '#48484a', fontWeight: 700 },
} satisfies Record<string, React.CSSProperties>;

export function MailLayout({
  preview,
  title,
  children,
  buttonLabel,
  href,
  english,
  ignore,
}: MailLayoutProps) {
  return (
    <Html lang="fr" dir="ltr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.card}>
          <Section>
            <span style={styles.logo}>LE REVENU</span>
            <span style={styles.logoSuffix}>Communauté</span>
          </Section>
          <Heading as="h1" style={styles.title}>
            {title}
          </Heading>
          <Text style={styles.text}>{children}</Text>
          <Section style={{ marginTop: '22px' }}>
            <Button href={href} style={styles.button}>
              {buttonLabel}
            </Button>
          </Section>
          <Text style={styles.small}>
            Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br />
            <Link href={href} style={styles.link}>
              {href}
            </Link>
          </Text>
          <Hr style={styles.hr} />
          <Text style={styles.footer}>
            <span style={styles.footerLabel}>English</span> · {english}
            <br />
            <br />
            {ignore}
            <br />
            Communauté Le Revenu
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
