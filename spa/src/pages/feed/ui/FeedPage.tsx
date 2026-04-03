import { PageLayout } from "@/widgets"
import { SwipeFeed } from "@/features/SwipeCards"

export const FeedPage = () => {
  return (
    <PageLayout className='pb-safe-area-bottom-with-menu'>
      <SwipeFeed />
    </PageLayout>
  )
}
