import React from 'react';
import PostCard from './PostCard';

interface PostFeedProps {
  posts: any[];
  loading?: boolean;
  onReact?: (postId: number, type: string) => void;
  onDelete?: (postId: number) => void;
  onComment?: (postId: number, content: string) => void;
  onShare?: (content: string) => void;
  onDeleteComment?: (commentId: number) => void;
  onVotePoll?: (postId: number, optionId: number) => void;
  showDelete?: (post: any) => boolean;
  canDeleteComment?: (comment: any) => boolean;
}

const PostFeed: React.FC<PostFeedProps> = ({ posts, loading, onReact, onDelete, onComment, onShare, onDeleteComment, onVotePoll, showDelete, canDeleteComment }) => {
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!posts.length) {
    return (
      <div className="text-center py-16">
        <p className="text-on-surface-variant font-bold uppercase tracking-widest text-sm">No hay publicaciones aún</p>
        <p className="text-on-surface-variant/60 text-xs mt-2">Sé el primero en publicar</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {posts.map(post => (
        <PostCard
          key={post.id_post}
          post={post}
          onReact={onReact}
          onDelete={onDelete}
          onComment={onComment}
          onShare={onShare}
          onDeleteComment={onDeleteComment}
          onVotePoll={onVotePoll}
          showDelete={showDelete?.(post)}
          canDeleteComment={canDeleteComment}
        />
      ))}
    </div>
  );
};

export default PostFeed;
