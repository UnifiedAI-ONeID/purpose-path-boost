import { useTranslation } from 'react-i18next';

const Contact = () => {
  const { t } = useTranslation('common');

  return (
    <div className="min-h-screen py-20">
      <div className="container">
        <h1 className="text-4xl font-serif font-bold mb-4">{t('nav.contact')}</h1>
        <p className="text-xl text-muted-foreground">Get in touch with us</p>
      </div>
    </div>
  );
};

export default Contact;
