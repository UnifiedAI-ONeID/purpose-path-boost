import { useIsMobile } from '@/hooks/use-mobile';
import BlogDetailMobile from '@/components/mobile/BlogDetailMobile';
import BlogDetailContent from '@/components/BlogDetailContent';

const BlogDetail = () => {
  const isMobile = useIsMobile();

  // Use mobile version on mobile devices
  if (isMobile) {
    return <BlogDetailMobile />;
  }

  return <BlogDetailContent />;
};

export default BlogDetail;
