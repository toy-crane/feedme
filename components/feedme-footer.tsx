export function FeedmeFooter() {
  return (
    <footer className="mt-auto w-full pt-16 pb-7 text-sm text-muted-foreground">
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-3">
          <span>© 2026 feed-me</span>
          <span>·</span>
          <a
            href="https://github.com/toy-crane/feedme/issues/new"
            target="_blank"
            rel="noopener noreferrer"
          >
            Feedback
          </a>
          <span>·</span>
          <a
            href="https://github.com/toy-crane/feedme"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </div>
        <a
          href="https://toycrane.notion.site/Toy-Crane-e1083f83d3864669bf27290a8f033b00"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs"
        >
          by toy-crane
        </a>
      </div>
    </footer>
  );
}
