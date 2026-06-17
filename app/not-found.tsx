import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 px-4">
      <div className="text-center max-w-sm">
        <p className="text-sm font-medium text-primary-500 tracking-wider uppercase">404</p>
        <h1 className="text-xl font-semibold text-neutral-800 mt-2">
          Página no encontrada
        </h1>
        <p className="text-sm text-neutral-500 mt-2">
          Lo sentimos, no pudimos encontrar lo que buscas. Puede que la dirección haya cambiado o ya no exista.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center mt-6 px-5 py-2.5 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
