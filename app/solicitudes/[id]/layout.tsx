import { SolicitudesSidebar } from '@/components/solicitudes/SolicitudesSidebar';

export default function SolicitudesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SolicitudesSidebar />
      <main className="md:ml-80">
        {children}
      </main>
    </>
  );
}
