import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { CheckCircle, Quote } from 'lucide-react';
import heroImage from '@/assets/images/hero.jpg';
import clarityIcon from '@/assets/images/icon-clarity.png';
import confidenceIcon from '@/assets/images/icon-confidence.png';
import growthIcon from '@/assets/images/icon-growth.png';

const Home = () => {
  const { t } = useTranslation(['home', 'common']);

  const values = [
    {
      icon: clarityIcon,
      title: t('home:values.clarity_title'),
      description: t('home:values.clarity_desc'),
    },
    {
      icon: confidenceIcon,
      title: t('home:values.confidence_title'),
      description: t('home:values.confidence_desc'),
    },
    {
      icon: growthIcon,
      title: t('home:values.growth_title'),
      description: t('home:values.growth_desc'),
    },
  ];

  const testimonials = [
    {
      text: t('home:testimonials.testimonial1'),
      author: t('home:testimonials.author1'),
    },
    {
      text: t('home:testimonials.testimonial2'),
      author: t('home:testimonials.author2'),
    },
    {
      text: t('home:testimonials.testimonial3'),
      author: t('home:testimonials.author3'),
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background with overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt="Professional coaching"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-hero" />
        </div>

        {/* Content */}
        <div className="container relative z-10 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-white"
            >
              <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6 leading-tight">
                {t('home:hero.title')}
              </h1>
              <p className="text-xl mb-8 text-white/90">
                {t('home:hero.subtitle')}
              </p>

              <div className="space-y-3 mb-8">
                {[t('home:hero.bullet1'), t('home:hero.bullet2'), t('home:hero.bullet3')].map(
                  (bullet, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <CheckCircle className="h-6 w-6 text-brand-accent flex-shrink-0 mt-0.5" />
                      <span className="text-white/90">{bullet}</span>
                    </motion.div>
                  )
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild variant="hero" size="lg">
                  <Link to="/book">{t('common:cta.book')}</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <Link to="/quiz">{t('common:cta.quiz')}</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-background">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-serif font-bold mb-4">{t('home:values.title')}</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full border-2 hover:shadow-medium transition-smooth">
                  <CardContent className="pt-8 text-center">
                    <img
                      src={value.icon}
                      alt={value.title}
                      className="w-20 h-20 mx-auto mb-4"
                    />
                    <h3 className="text-xl font-serif font-semibold mb-3">{value.title}</h3>
                    <p className="text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-muted/50">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-serif font-bold mb-4">
              {t('home:testimonials.title')}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full">
                  <CardContent className="pt-6">
                    <Quote className="h-8 w-8 text-brand-accent mb-4" />
                    <p className="mb-4 text-muted-foreground italic">"{testimonial.text}"</p>
                    <p className="font-semibold text-sm">— {testimonial.author}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-primary text-white">
        <div className="container text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-serif font-bold mb-4">
              {t('home:cta.title')}
            </h2>
            <p className="text-xl mb-8 text-white/90">
              {t('home:cta.subtitle')}
            </p>
            <Button asChild variant="hero" size="lg">
              <Link to="/quiz">{t('common:cta.quiz')}</Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
