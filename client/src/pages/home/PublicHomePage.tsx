import type { FC } from 'react';
import { Box, Link, Stack } from '@mui/material';
import { CustomButton, CustomTypography } from '@components/index';
import { useSession } from '@features/session/hooks';
import {
  Header,
  Hero,
  Section,
  InfoCard,
  BrandCard,
  Footer,
} from './components';

/**
 * PublicHomePage
 *
 * Public-facing homepage for WIDE Naturals.
 * - No embedded login form (security boundary)
 * - "Staff Login" redirects to ERP subdomain
 *
 * Notes:
 * - Replace domain values via environment variables in production.
 * - Keep this page free of sensitive auth/session logic.
 */
const PublicHomePage: FC = () => {
  const { isAuthenticated } = useSession();
  const ERP_LOGIN_URL = import.meta?.env?.VITE_ERP_LOGIN_URL ?? '/login';

  const CONTACT_EMAIL =
    import.meta?.env?.VITE_PUBLIC_CONTACT_EMAIL ?? 'info@widenaturals.com';

  const onStaffLogin = () => {
    window.location.assign(ERP_LOGIN_URL);
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  return (
    <Box>
      <Header onStaffLogin={!isAuthenticated ? onStaffLogin : undefined} />

      <Box component="main">
        <Hero
          onPrimary={() => scrollTo('contact')}
          onSecondary={() => scrollTo('capabilities')}
        />

        <Section
          id="about"
          title="About Us"
          subtitle="Built for quality, compliance, and global scale."
        >
          <CustomTypography
            variant="body2"
            sx={{ color: 'text.secondary', mt: 1.5 }}
          >
            WIDE Naturals is a Canadian natural health company specializing in
            research, manufacturing, and global distribution of premium natural
            health products. Operating from Health Canada–licensed cGMP
            facilities in British Columbia, we deliver compliant, high-quality
            solutions for brands and partners worldwide.
          </CustomTypography>

          <CustomTypography
            variant="body2"
            sx={{ color: 'text.secondary', mt: 2 }}
          >
            Our operations span the full product lifecycle—from scientific
            research and formulation to large-scale manufacturing and
            international distribution. We support both our own brands and
            strategic partners through white-label manufacturing, private
            branding, and market entry services.
          </CustomTypography>
        </Section>

        <Section
          id="capabilities"
          title="Our Capabilities"
          subtitle="End-to-end execution from R&D through manufacturing and distribution."
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
              gap: 2,
            }}
          >
            <InfoCard
              title="Research & Development"
              body="Formulation design, stability testing, quality validation, and regulatory documentation to support innovation-driven product pipelines."
              bullets={[
                'Formulation and validation',
                'Stability and QC support',
                'Regulatory documentation readiness',
              ]}
            />

            <InfoCard
              title="Manufacturing"
              body="Licensed Canadian cGMP manufacturing capacity across multiple delivery formats, supported by rigorous quality systems."
              bullets={[
                'Capsules, tablets, gummies',
                'Softgels and tinctures',
                'Quality-controlled, scalable production',
              ]}
            />

            <InfoCard
              title="Compliance & Qualifications"
              body="Compliance is embedded into every stage of operations, supporting market readiness and confidence."
              bullets={[
                'Health Canada NHP site licensing',
                'cGMP certified facilities',
                'FDA registered; Free Sale certificates; CHFA membership',
              ]}
            />

            <InfoCard
              title="Brand & Market Reach"
              body="Global distribution through online and offline channels, supporting modern commerce pathways."
              bullets={[
                'Amazon, Tmall, JD.com',
                'TikTok Commerce, WeChat stores',
                'Strategic retail & distribution partners',
              ]}
            />
          </Box>
        </Section>

        <Section
          id="brands"
          title="Our Brands"
          subtitle="A portfolio built for trust and consumer outcomes."
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: 2,
            }}
          >
            <BrandCard
              title="Canaherb®"
              body="Premium wellness products developed with a focus on quality, compliance, and consumer trust."
            />
            <BrandCard
              title="Phyto-Genious®"
              body="Scientifically formulated natural health supplements designed for modern lifestyles."
            />
            <BrandCard
              title="WIDE Collection"
              body="A curated portfolio developed for international markets and private-label partnerships."
            />
          </Box>
        </Section>

        <Section
          id="why"
          title="Why WIDE Naturals"
          subtitle="More than manufacturing—an integrated partner for sustainable brand growth."
        >
          <Box component="ul" sx={{ pl: 2, mt: 1 }}>
            {[
              'Advanced in-house R&D and formulation expertise',
              'Fully licensed Canadian cGMP manufacturing',
              'Rigorous quality control and regulatory alignment',
              'Scalable production and global distribution capability',
              'Integrated brand, manufacturing, and market strategy support',
            ].map((item) => (
              <CustomTypography
                key={item}
                component="li"
                variant="body2"
                sx={{ color: 'text.secondary', mt: 0.75 }}
              >
                {item}
              </CustomTypography>
            ))}
          </Box>
        </Section>

        <Section
          id="services"
          title="Partnerships & Services"
          subtitle="We collaborate with brands, distributors, retailers, and international market entrants."
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
              gap: 2,
            }}
          >
            <InfoCard
              title="Who we work with"
              body="Flexible engagement models for different growth stages."
              bullets={[
                'Brand owners',
                'Distributors',
                'Retail partners',
                'International market entrants',
              ]}
            />

            <InfoCard
              title="What we provide"
              body="Execution support across product, compliance, and go-to-market."
              bullets={[
                'White-label manufacturing',
                'Private brand development',
                'Regulatory & compliance support',
                'Market research & positioning',
                'Business matching & partnerships',
              ]}
            />
          </Box>
        </Section>

        <Section
          id="contact"
          title="Contact Us"
          subtitle="Let’s discuss partnership opportunities."
        >
          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              p: 2.25,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            <Box>
              <CustomTypography variant="subtitle2" fontWeight={900}>
                WIDE Naturals Inc.
              </CustomTypography>
              <CustomTypography variant="body2" sx={{ mt: 0.5 }}>
                Vancouver, British Columbia, Canada
              </CustomTypography>
              <CustomTypography variant="body2" sx={{ mt: 0.5 }}>
                Email:{' '}
                <Link
                  href={`mailto:${CONTACT_EMAIL}`}
                  underline="hover"
                  sx={{
                    fontWeight: 700,
                    color: 'primary.main',
                  }}
                >
                  {CONTACT_EMAIL}
                </Link>
              </CustomTypography>
            </Box>

            <Stack direction="row" spacing={1.5} flexWrap="wrap">
              <CustomButton
                variant="contained"
                href={`mailto:${CONTACT_EMAIL}?subject=Partnership%20Inquiry`}
              >
                Contact Us
              </CustomButton>
              {!isAuthenticated ? (
                <CustomButton variant="outlined" onClick={onStaffLogin}>
                  Staff Login
                </CustomButton>
              ) : null}
            </Stack>
          </Box>
        </Section>
      </Box>

      <Footer onStaffLogin={!isAuthenticated ? onStaffLogin : undefined} />
    </Box>
  );
};

export default PublicHomePage;
