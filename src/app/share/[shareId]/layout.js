import connectToDatabase from "@/lib/mongodb";
import SharedContent from "@/models/SharedContent";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }) {
  try {
    await connectToDatabase();
    
    const shareData = await SharedContent.findOne({ 
      shareId: params.shareId,
      isActive: true 
    }).lean();

    if (!shareData) {
      return {
        title: "Content Not Found - QuestWhisper",
        description: "The shared content you're looking for could not be found.",
      };
    }

    // Extract first paragraph of content for description
    const contentPreview = shareData.content
      .replace(/^#+\s+/gm, '') // Remove markdown headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold formatting
      .replace(/\*(.*?)\*/g, '$1') // Remove italic formatting
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links, keep text
      .split('\n')
      .filter(line => line.trim().length > 0)
      .slice(0, 2)
      .join(' ')
      .substring(0, 150) + (shareData.content.length > 150 ? '...' : '');

    const ogImageUrl = `/api/og-image?type=share&title=${encodeURIComponent(shareData.title)}&description=${encodeURIComponent(contentPreview)}&author=${encodeURIComponent(shareData.sharedBy.name)}&date=${shareData.createdAt}`;

    return {
      title: `${shareData.title} - Shared on QuestWhisper`,
      description: contentPreview,
      keywords: "AI response, shared content, QuestWhisper, AI assistant",
      authors: [{ name: shareData.sharedBy.name }],
      openGraph: {
        type: 'article',
        title: shareData.title,
        description: contentPreview,
        url: `/share/${shareData.shareId}`,
        siteName: 'QuestWhisper',
        publishedTime: shareData.createdAt,
        authors: [shareData.sharedBy.name],
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: `${shareData.title} - Shared by ${shareData.sharedBy.name}`,
            type: 'image/png',
          },
          // Fallback to display image if available
          ...(shareData.displayImage ? [{
            url: shareData.displayImage,
            width: 800,
            height: 600,
            alt: shareData.title,
          }] : [])
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: shareData.title,
        description: contentPreview,
        images: [ogImageUrl],
        creator: '@questwhisper',
        site: '@questwhisper',
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  } catch (error) {
    console.error('Error generating metadata for shared content:', error);
    return {
      title: "Shared Content - QuestWhisper",
      description: "AI-generated content shared on QuestWhisper",
    };
  }
}

export default function ShareLayout({ children }) {
  return children;
} 