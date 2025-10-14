import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackEventCN } from '@/lib/analytics-cn';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

/**
 * China-specific booking page using Feishu (飞书) forms
 * Replace Cal.com with Feishu for China visitors due to better performance
 */
export default function BookSessionCN() {
  const navigate = useNavigate();

  useEffect(() => {
    // Track page view with Baidu Tongji
    trackEventCN('booking', 'view');
  }, []);

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回
        </Button>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-serif text-primary mb-4">
            预约免费发现会议
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            填写以下表单，我将在24小时内与您联系，安排30分钟的免费咨询。
          </p>

          <div className="bg-card rounded-2xl shadow-lg overflow-hidden">
            {/* 
              Replace YOUR_FORM_ID with your actual Feishu form ID
              Get it from: https://www.feishu.cn/ → 多维表格 → Create form → Share
            */}
            <iframe
              title="飞书预约表单"
              src="https://p3-feishu-sign.feishu.cn/share/base/form/YOUR_FORM_ID?from=cn"
              className="w-full h-[1100px] border-0"
              allow="clipboard-read; clipboard-write"
              loading="lazy"
              onLoad={() => {
                // Track form loaded
                trackEventCN('booking', 'form_loaded');
              }}
            />
          </div>

          <div className="mt-8 p-6 bg-muted/50 rounded-xl">
            <h3 className="font-semibold text-lg mb-3">发现会议包括：</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>深入了解您的职业目标和挑战</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>评估您当前的清晰度和信心水平</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>探讨可能的成长路径</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>了解教练如何帮助您实现目标</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
