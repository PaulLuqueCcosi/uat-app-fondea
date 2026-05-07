import { appBackgroundStyle, blobTopRight, blobBottomLeft } from '@/lib/backgroundStyle';

/**
 * Fondo compartido de la app — patrón de puntos + blobs decorativos.
 * Usado en los layouts de dashboard y solicitar.
 */
export function AppBackground() {
  return (
    <>
      <div className="fixed inset-0 -z-10" style={appBackgroundStyle} />
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute -top-48 -right-48 w-[600px] h-[600px] rounded-full" style={blobTopRight} />
        <div className="absolute -bottom-64 -left-32 w-[550px] h-[550px] rounded-full" style={blobBottomLeft} />
      </div>
    </>
  );
}
