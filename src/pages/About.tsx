import { useTranslation } from 'react-i18next';

const About = () => {
  const { t } = useTranslation('about');

  return (
    <div className="min-h-screen py-20">
      <div className="container">
        <h1 className="text-4xl font-serif font-bold mb-4">{t('title')}</h1>
        <p className="text-xl text-muted-foreground">{t('subtitle')}</p>
      </div>
    </div>
  );
};

export default About;
