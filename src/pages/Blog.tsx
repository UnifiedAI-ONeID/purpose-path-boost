import { useTranslation } from 'react-i18next';

const Blog = () => {
  const { t } = useTranslation('common');

  return (
    <div className="min-h-screen py-20">
      <div className="container">
        <h1 className="text-4xl font-serif font-bold mb-4">{t('nav.blog')}</h1>
        <p className="text-xl text-muted-foreground">Insights and resources for your growth</p>
      </div>
    </div>
  );
};

export default Blog;
