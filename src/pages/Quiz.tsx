import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const formSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  language: z.string(),
  wechat: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const Quiz = () => {
  const { t } = useTranslation('quiz');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const questions = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    text: t(`questions.q${i + 1}`),
  }));

  const options = [
    { value: 1, label: t('options.not_at_all') },
    { value: 2, label: t('options.somewhat') },
    { value: 3, label: t('options.moderately') },
    { value: 4, label: t('options.very') },
    { value: 5, label: t('options.extremely') },
  ];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      language: 'en',
    },
  });

  const handleAnswer = (value: number) => {
    const newAnswers = [...answers, value];
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const calculateScore = () => {
    const total = answers.reduce((acc, val) => acc + val, 0);
    return Math.round((total / (questions.length * 5)) * 100);
  };

  const getScoreInterpretation = (score: number) => {
    if (score < 40) return t('results.low');
    if (score < 70) return t('results.medium');
    return t('results.high');
  };

  const onSubmit = async (data: FormData) => {
    const score = calculateScore();
    
    try {
      // Track event
      if (window.umami) {
        window.umami('lead_magnet_submit');
      }

      // In production, this would save to Supabase and send email
      console.log('Lead data:', { ...data, score, answers });
      
      toast.success('Success! Check your email for the 7-Day Clarity Sprint guide.');
      setShowForm(false);
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    }
  };

  const score = calculateScore();

  return (
    <div className="min-h-screen py-20 bg-background">
      <div className="container max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-serif font-bold mb-4">{t('title')}</h1>
          <p className="text-xl text-muted-foreground">{t('subtitle')}</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!showResults ? (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-muted-foreground">
                      Question {currentQuestion + 1} of {questions.length}
                    </span>
                    <span className="text-sm font-medium">
                      {Math.round(((currentQuestion + 1) / questions.length) * 100)}%
                    </span>
                  </div>
                  <CardTitle className="text-xl">{questions[currentQuestion].text}</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup className="space-y-3">
                    {options.map((option) => (
                      <div
                        key={option.value}
                        onClick={() => handleAnswer(option.value)}
                        className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent cursor-pointer transition-smooth"
                      >
                        <RadioGroupItem value={option.value.toString()} />
                        <Label className="cursor-pointer flex-1">{option.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>
            </motion.div>
          ) : !showForm ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card>
                <CardContent className="pt-8 text-center">
                  <h2 className="text-3xl font-serif font-bold mb-4">
                    {t('results.your_score')}
                  </h2>
                  <div className="text-7xl font-bold text-brand-accent mb-6">{score}%</div>
                  <p className="text-lg mb-8 text-muted-foreground max-w-2xl mx-auto">
                    {getScoreInterpretation(score)}
                  </p>
                  <Button variant="cta" size="lg" onClick={() => setShowForm(true)}>
                    {t('results.download')}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>{t('results.download')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <Label htmlFor="name">{t('form.name')}</Label>
                      <Input id="name" {...register('name')} />
                      {errors.name && (
                        <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="email">{t('form.email')}</Label>
                      <Input id="email" type="email" {...register('email')} />
                      {errors.email && (
                        <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="language">{t('form.language')}</Label>
                      <select
                        id="language"
                        {...register('language')}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="en">English</option>
                        <option value="zh-TW">繁體中文</option>
                        <option value="zh-CN">简体中文</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="wechat">{t('form.wechat')}</Label>
                      <Input id="wechat" {...register('wechat')} />
                    </div>

                    <Button type="submit" variant="cta" size="lg" className="w-full">
                      {t('form.submit')}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Quiz;
