import InfoPageLayout from '../components/InfoPageLayout';

export default function Careers() {
  return (
    <InfoPageLayout
      badge="Careers"
      title="Build tools that make student life more affordable"
      subtitle="UniShare is creating a trusted campus marketplace and shared-subscription network. We are hiring builders who care about product quality and real-world impact."
      highlights={[
        'Remote-first collaboration with flexible schedules.',
        'Ownership from idea to shipped feature.',
        'Intern and graduate tracks for early-career talent.',
      ]}
      sections={[
        {
          title: 'Product Engineering',
          body: 'Work across frontend and backend systems that power listing discovery, payments, and messaging. You will ship quickly and iterate with direct user feedback.',
        },
        {
          title: 'Trust and Safety',
          body: 'Help define the platform rules that protect buyers, sellers, and shared-account owners. This team combines policy, moderation, and smart automation.',
        },
        {
          title: 'Campus Growth',
          body: 'Partner with student ambassadors and university communities to bring UniShare to more campuses in a sustainable and user-focused way.',
        },
      ]}
      ctaLabel="Contact Our Team"
      ctaTo="/contact"
    />
  );
}
