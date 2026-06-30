export default function NotFound() {
  return (
    <div className="container py-32 text-center">
      <p className="font-mono text-sm text-accent">{"// 404"}</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">
        Page not found
      </h1>
      <p className="mx-auto mt-3 max-w-md text-muted-foreground">
        The page you were looking for is not here. Use the navigation above to
        find your way back.
      </p>
    </div>
  );
}