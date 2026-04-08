import { useSignedUrl } from "@/hooks/useSignedUrl";

interface ForecastImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
}

/**
 * Image component that automatically resolves forecast storage URLs to signed URLs.
 * Drop-in replacement for <img> when displaying forecast images.
 */
export function ForecastImage({ src, alt, ...props }: ForecastImageProps) {
  const signedUrl = useSignedUrl(src);

  if (!signedUrl) {
    return <div className={props.className} style={{ background: 'var(--muted)' }} />;
  }

  return <img src={signedUrl} alt={alt} {...props} />;
}
