export default function SubmitButton({
  calculating,
  requesting,
  disabled,
  label = "Solicitar Préstamo →",
  onClick,
}: {
  calculating: boolean;
  requesting: boolean;
  disabled: boolean;
  label?: string;
  onClick: () => void;
}) {
  return (
    <button
      id="calc-solicitar"
      className="w-full bg-primary-500 text-white rounded-xl font-bold transition-all duration-300 disabled:opacity-60 py-2.5 sm:py-3 text-sm sm:text-base"
      disabled={disabled}
      onClick={onClick}
    >
      {requesting ? "Procesando..." : calculating ? "Calculando..." : label}
    </button>
  );
}
